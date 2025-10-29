import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * SOTA October 2025: Contextual Permission Request Hook
 * Source: NOTIFICATION_SYSTEM_SOTA_2025.md ligne 77-100
 * 
 * Best practices:
 * - Only request permission after user action (not on page load)
 * - Check browser support before requesting
 * - Handle permission state changes
 * - Store FCM token in database automatically
 */

// Firebase config (same as usePushNotifications)
const firebaseConfig = {
  apiKey: "AIzaSyC_2EWImbg_4_7gwWcUe1WJLzhAV2Xhutk",
  authDomain: "random-e1d35.firebaseapp.com",
  projectId: "random-e1d35",
  storageBucket: "random-e1d35.firebasestorage.app",
  messagingSenderId: "922028744926",
  appId: "1:922028744926:web:b32e54369fe9738425a24f",
  measurementId: "G-BFV3N51PP1"
};

// VAPID public key
const VAPID_PUBLIC_KEY = 'BOkV_HGdsNuvLckQFeB9DOsjp47KIDdBZ1RcWckIKur5gEmKYVmCuIGOX02l-QxA7_9JLX4gNvuMsk2SAbDTLko';

// Initialize Firebase app (singleton)
let firebaseApp: ReturnType<typeof initializeApp> | null = null;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (error) {
  // App already initialized
  console.log('Firebase app already initialized');
}

export interface PushPermissionState {
  permission: NotificationPermission;
  fcmToken: string | null;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
}

export const usePushPermission = () => {
  const [state, setState] = useState<PushPermissionState>({
    permission: 'default',
    fcmToken: null,
    isSupported: false,
    isLoading: false,
    error: null,
  });

  // Check browser support and current permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      // Check if browser supports notifications
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      setState(prev => ({ ...prev, isSupported: true }));

      // Get current permission state
      const currentPermission = Notification.permission;
      setState(prev => ({ ...prev, permission: currentPermission }));

      // Listen for permission changes (modern browsers)
      try {
        const result = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permission: result.state as NotificationPermission }));
        });
      } catch (error) {
        // Permissions API not supported, fallback to polling
        console.log('Permissions API not supported, using fallback');
      }
    };

    checkSupport();
  }, []);

  /**
   * Request notification permission and get FCM token
   * SOTA 2025: Only call this after user action (button click)
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast.error('❌ Les notifications ne sont pas supportées par votre navigateur');
      setState(prev => ({ ...prev, error: 'Browser not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Request notification permission
      const newPermission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission: newPermission }));

      if (newPermission !== 'granted') {
        toast.error('❌ Permission refusée pour les notifications');
        setState(prev => ({ ...prev, isLoading: false, error: 'Permission denied' }));
        return false;
      }

      // Step 2: Register service worker
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers not supported');
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registered:', registration);

      // Step 3: Get FCM token
      if (!firebaseApp) {
        throw new Error('Firebase app not initialized');
      }

      const messaging = getMessaging(firebaseApp);
      const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
      });

      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
      setState(prev => ({ ...prev, fcmToken: token, isLoading: false }));

      // Step 4: Save token to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: dbError } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          token,
          device_type: 'web',
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'token',
        });

      if (dbError) throw dbError;

      toast.success('✅ Notifications activées avec succès');
      return true;

    } catch (error: any) {
      console.error('❌ Permission request failed:', error);
      const errorMessage = error.message || 'Unknown error';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error(`❌ Erreur: ${errorMessage}`);
      return false;
    }
  }, [state.isSupported]);

  /**
   * Revoke notification permission (clear token)
   */
  const revokePermission = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Mark all user tokens as inactive
      const { error } = await supabase
        .from('user_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setState(prev => ({ ...prev, fcmToken: null }));
      toast.success('✅ Notifications désactivées');
      return true;
    } catch (error: any) {
      console.error('❌ Revoke failed:', error);
      toast.error(`❌ Erreur: ${error.message}`);
      return false;
    }
  }, []);

  return {
    ...state,
    requestPermission,
    revokePermission,
  };
};
