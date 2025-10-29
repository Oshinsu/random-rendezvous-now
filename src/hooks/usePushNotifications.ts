import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

// Firebase config for Random app (SOTA October 2025)
const firebaseConfig = {
  apiKey: "AIzaSyC_2EWImbg_4_7gwWcUe1WJLzhAV2Xhutk",
  authDomain: "random-e1d35.firebaseapp.com",
  projectId: "random-e1d35",
  storageBucket: "random-e1d35.firebasestorage.app",
  messagingSenderId: "922028744926",
  appId: "1:922028744926:web:b32e54369fe9738425a24f",
  measurementId: "G-BFV3N51PP1"
};

// VAPID public key for Web Push (get from Firebase Console → Project Settings → Cloud Messaging)
// TODO: Replace with your actual VAPID key from Firebase Console
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

// Status of push notifications
interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  fcmToken: string | null;
  isEnabled: boolean;
}

/**
 * Hook to manage web push notifications with Firebase Cloud Messaging
 * SOTA October 2025: FCM HTTP v1 API with OAuth 2.0
 * Source: https://firebase.google.com/docs/cloud-messaging/js/client
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<PushNotificationStatus>({
    isSupported: false,
    permission: 'default',
    fcmToken: null,
    isEnabled: false,
  });

  // Initialize Firebase (only once)
  const firebaseApp = useMemo(() => {
    try {
      return initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return null;
    }
  }, []);

  // Check if FCM is supported
  const checkFCMSupport = useCallback(async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        console.warn('Browser does not support Notifications API');
        return false;
      }

      if (!('serviceWorker' in navigator)) {
        console.warn('Browser does not support Service Workers');
        return false;
      }

      const fcmSupported = await isSupported();
      if (!fcmSupported) {
        console.warn('Firebase Messaging not supported in this browser');
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        console.log('Registering Firebase Messaging Service Worker...');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      return true;
    } catch (error) {
      console.error('FCM support check failed:', error);
      return false;
    }
  }, []);

  // Save FCM token to database
  const saveTokenToDatabase = useCallback(async (token: string): Promise<boolean> => {
      if (!user) {
        console.error('No user logged in');
        return false;
      }

      try {
        const { error } = await supabase.from('user_push_tokens').upsert(
          {
            user_id: user.id,
            token: token,
            device_type: 'web',
            is_active: true,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,token',
          }
        );

        if (error) {
          console.error('Error saving FCM token to database:', error);
          return false;
        }

        console.log('✅ FCM token saved to database');
        return true;
      } catch (error) {
        console.error('Exception saving FCM token:', error);
        return false;
      }
    }, [user]);

  // Request notification permission and get FCM token (SOTA October 2025)
  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      console.log('🔔 Requesting notification permission (FCM HTTP v1 API)...');

      // Step 1: Check FCM support
      const fcmReady = await checkFCMSupport();
      if (!fcmReady) {
        toast({
          title: 'Non supporté',
          description: 'Les notifications ne sont pas supportées sur ce navigateur.',
          variant: 'destructive',
        });
        return;
      }

      // Step 2: Request Notification permission
      const permission = await Notification.requestPermission();
      console.log('Permission status:', permission);

      if (permission !== 'granted') {
        toast({
          title: 'Permission refusée',
          description: 'Vous devez autoriser les notifications dans les paramètres de votre navigateur.',
          variant: 'destructive',
        });
        setStatus((prev) => ({ ...prev, permission }));
        return;
      }

      // Step 3: Get Firebase Messaging instance
      if (!firebaseApp) {
        throw new Error('Firebase app not initialized');
      }

      const messaging = getMessaging(firebaseApp);

      // Step 4: Get FCM token using VAPID key
      console.log('🔑 Getting FCM token with VAPID key...');
      const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');

      // Step 5: Save token to database
      const saved = await saveTokenToDatabase(token);
      if (!saved) {
        throw new Error('Failed to save token to database');
      }

      // Step 6: Update status
      setStatus({
        isSupported: true,
        permission: 'granted',
        fcmToken: token,
        isEnabled: true,
      });

      toast({
        title: 'Notifications activées ✅',
        description: 'Vous recevrez des notifications push pour vos groupes (FCM HTTP v1 API).',
      });
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer les notifications. Vérifiez la console.',
        variant: 'destructive',
      });
    }
  }, [checkFCMSupport, saveTokenToDatabase, toast, firebaseApp]);

  // Check existing token on mount and user login
  useEffect(() => {
    const initializePushNotifications = async () => {
      if (!user) return;

      // Check if FCM is supported
      const fcmSupported = await checkFCMSupport();
      setStatus((prev) => ({ ...prev, isSupported: fcmSupported }));

      if (!fcmSupported) {
        console.log('Push notifications not supported on this browser');
        return;
      }

      // Check current permission
      const currentPermission = Notification.permission;
      setStatus((prev) => ({ ...prev, permission: currentPermission }));

      // If permission granted, check for existing token in database
      if (currentPermission === 'granted') {
        try {
          const { data: existingToken } = await supabase
            .from('user_push_tokens')
            .select('token')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('device_type', 'web')
            .maybeSingle();

          if (existingToken) {
            console.log('✅ Existing FCM token found in database');
            setStatus((prev) => ({
              ...prev,
              fcmToken: existingToken.token,
              isEnabled: true,
            }));
          }
        } catch (error) {
          console.error('Error checking existing token:', error);
        }
      }
    };

    initializePushNotifications();
  }, [user, checkFCMSupport]);

  return {
    status,
    requestPermission,
    isEnabled: status.isEnabled && status.permission === 'granted',
    canRequest: status.isSupported && status.permission === 'default',
  };
};
