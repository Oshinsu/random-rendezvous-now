import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported as checkFCMSupported } from 'firebase/messaging';

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

// VAPID public key for Web Push (from Firebase Console → Project Settings → Cloud Messaging)
const VAPID_PUBLIC_KEY = 'BOkV_HGdsNuvLckQFeB9DOsjp47KIDdBZ1RcWckIKur5gEmKYVmCuIGOX02l-QxA7_9JLX4gNvuMsk2SAbDTLko';

// Initialize Firebase once
let firebaseApp: ReturnType<typeof initializeApp> | null = null;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

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

  // Request notification permission and get FCM token (SOTA October 2025)
  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      console.log('🔔 Requesting notification permission (FCM HTTP v1 API)...');

      // Step 1: Check browser support
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        toast({
          title: 'Non supporté',
          description: 'Les notifications ne sont pas supportées sur ce navigateur.',
          variant: 'destructive',
        });
        return;
      }

      // Step 2: Check FCM support
      const fcmSupported = await checkFCMSupported();
      if (!fcmSupported) {
        toast({
          title: 'Non supporté',
          description: 'Firebase Messaging n\'est pas supporté.',
          variant: 'destructive',
        });
        return;
      }

      // Step 3: Register Service Worker
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      // Step 4: Request Notification permission
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

      // Step 5: Get Firebase Messaging instance
      if (!firebaseApp) {
        throw new Error('Firebase app not initialized');
      }

      const messaging = getMessaging(firebaseApp);

      // Step 6: Get FCM token using VAPID key
      console.log('🔑 Getting FCM token with VAPID key...');
      const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: swReg || undefined,
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');

      // Step 7: Save token to database
      if (user?.id) {
        // @ts-ignore - Avoid Supabase type recursion issue
        const result: any = await supabase.from('user_push_tokens').upsert({
          user_id: user.id,
          token: token,
          device_type: 'web',
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

        if (result.error) {
          console.error('Error saving FCM token:', result.error);
          throw new Error('Failed to save token');
        }
      }

      // Step 8: Update status
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
  }, [user?.id, toast]);

  // Check existing token on mount and user login
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      // Check browser support
      const browserSupported = 'Notification' in window && 'serviceWorker' in navigator;
      const fcmSupported = browserSupported ? await checkFCMSupported() : false;

      setStatus((prev) => ({
        ...prev,
        isSupported: fcmSupported,
        permission: browserSupported ? Notification.permission : 'denied',
      }));

      if (!fcmSupported || Notification.permission !== 'granted') {
        return;
      }

      // Check for existing token in database
      // @ts-ignore - Avoid Supabase type recursion issue
      const result: any = await supabase
        .from('user_push_tokens')
        .select('token')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('device_type', 'web')
        .maybeSingle();

      const data = result.data as { token: string } | null;

      if (data?.token) {
        console.log('✅ Existing FCM token found');
        setStatus((prev) => ({
          ...prev,
          fcmToken: data.token,
          isEnabled: true,
        }));
      }
    };

    init();
  }, [user?.id]);

  return {
    status,
    requestPermission,
    isEnabled: status.isEnabled && status.permission === 'granted',
    canRequest: status.isSupported && status.permission === 'default',
  };
};
