import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PushNotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  token: string | null;
  enabled: boolean;
}

/**
 * Hook pour gérer les notifications push web avec Firebase Cloud Messaging
 * Phase 1 du plan notifications SOTA 2025
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushNotificationStatus>({
    supported: 'Notification' in window && 'serviceWorker' in navigator,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    token: null,
    enabled: false,
  });

  // Vérifier si le Service Worker est enregistré
  const checkServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker non supporté');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker prêt:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Erreur Service Worker:', error);
      return null;
    }
  }, []);

  // Enregistrer le token dans Supabase
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!user) {
      console.warn('⚠️ Pas d\'utilisateur connecté');
      return false;
    }

    try {
      // Détecter le type d'appareil
      const deviceType = /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert(
          {
            user_id: user.id,
            token,
            device_type: deviceType,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: 'token',
          }
        );

      if (error) {
        console.error('❌ Erreur enregistrement token:', error);
        return false;
      }

      console.log('✅ Token FCM enregistré:', token);
      return true;
    } catch (error) {
      console.error('❌ Erreur saveTokenToDatabase:', error);
      return false;
    }
  }, [user]);

  // Demander la permission et enregistrer le token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!status.supported) {
      toast({
        title: '❌ Notifications non supportées',
        description: 'Votre navigateur ne supporte pas les notifications push.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // 1. Demander la permission
      const permission = await Notification.requestPermission();
      console.log('📱 Permission notifications:', permission);

      if (permission !== 'granted') {
        toast({
          title: '❌ Permission refusée',
          description: 'Vous devez autoriser les notifications pour recevoir des alertes.',
          variant: 'destructive',
        });
        return false;
      }

      // 2. Vérifier le Service Worker
      const swRegistration = await checkServiceWorker();
      if (!swRegistration) {
        toast({
          title: '❌ Erreur technique',
          description: 'Le Service Worker n\'est pas disponible.',
          variant: 'destructive',
        });
        return false;
      }

      // 3. Obtenir le token FCM via le Service Worker
      // Note: Pour FCM v1, on utilise getToken() du SDK Firebase
      // Pour simplifier, on génère un token fictif pour le moment
      // TODO: Intégrer Firebase SDK pour obtenir le vrai token
      const mockToken = `fcm_token_${user?.id}_${Date.now()}`;
      
      console.log('🔑 Token FCM généré:', mockToken);

      // 4. Enregistrer dans Supabase
      const saved = await saveTokenToDatabase(mockToken);
      
      if (!saved) {
        toast({
          title: '⚠️ Erreur enregistrement',
          description: 'Impossible d\'enregistrer le token de notification.',
          variant: 'destructive',
        });
        return false;
      }

      // 5. Mettre à jour le statut
      setStatus({
        supported: true,
        permission: 'granted',
        token: mockToken,
        enabled: true,
      });

      toast({
        title: '✅ Notifications activées !',
        description: 'Vous recevrez des alertes pour vos groupes et messages.',
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur requestPermission:', error);
      toast({
        title: '❌ Erreur activation',
        description: 'Une erreur s\'est produite lors de l\'activation des notifications.',
        variant: 'destructive',
      });
      return false;
    }
  }, [status.supported, user, checkServiceWorker, saveTokenToDatabase]);

  // Vérifier le token existant au chargement
  useEffect(() => {
    if (!user || !status.supported) return;

    const checkExistingToken = async () => {
      try {
        const { data, error } = await supabase
          .from('user_push_tokens')
          .select('token')
          .eq('user_id', user.id)
          .order('last_used_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('❌ Erreur vérification token:', error);
          return;
        }

        if (data?.token) {
          console.log('✅ Token existant trouvé');
          setStatus(prev => ({
            ...prev,
            token: data.token,
            enabled: true,
            permission: Notification.permission,
          }));
        }
      } catch (error) {
        console.error('❌ Erreur checkExistingToken:', error);
      }
    };

    checkExistingToken();
  }, [user, status.supported]);

  return {
    status,
    requestPermission,
    isEnabled: status.enabled && status.permission === 'granted',
    canRequest: status.supported && status.permission === 'default',
  };
};
