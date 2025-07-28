
import { useEffect, useRef } from 'react';
import { EnhancedGroupService } from '@/services/enhancedGroupService';
import { useAuth } from '@/contexts/AuthContext';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

interface ActivityHeartbeatOptions {
  groupId: string | null;
  enabled: boolean;
  intervalMs?: number;
}

export const useActivityHeartbeat = ({ 
  groupId, 
  enabled, 
  intervalMs = GROUP_CONSTANTS.HEARTBEAT_INTERVAL // Maintenant 30 secondes avec constantes unifiées
}: ActivityHeartbeatOptions) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Suivi de la visibilité de la page avec logging amélioré
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      console.log('👁️ [HEARTBEAT ENHANCED] Visibilité page:', isActiveRef.current ? 'visible' : 'cachée');
      
      // Mise à jour immédiate quand la page devient visible
      if (isActiveRef.current && groupId && user) {
        console.log('👁️ [HEARTBEAT ENHANCED] Page visible - mise à jour immédiate');
        EnhancedGroupService.updateUserActivity(groupId, user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [groupId, user]);

  // Battement de cœur d'activité UNIFIÉ et OPTIMISÉ
  useEffect(() => {
    if (!enabled || !groupId || !user) {
      console.log('💓 [HEARTBEAT ENHANCED] Désactivé:', { enabled, groupId: !!groupId, user: !!user });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('💓 [HEARTBEAT ENHANCED] Activation pour groupe:', groupId, 'intervalle:', intervalMs + 'ms');

    // Mise à jour initiale immédiate
    EnhancedGroupService.updateUserActivity(groupId, user.id);

    // Configuration de l'intervalle
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        console.log('💓 [HEARTBEAT ENHANCED] Pulse - mise à jour activité');
        EnhancedGroupService.updateUserActivity(groupId, user.id);
      } else {
        console.log('💓 [HEARTBEAT ENHANCED] Pulse ignoré - page non visible');
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        console.log('💓 [HEARTBEAT ENHANCED] Nettoyage');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, groupId, user, intervalMs]);

  return {
    isActive: isActiveRef.current,
    updateActivity: () => {
      if (groupId && user) {
        EnhancedGroupService.updateUserActivity(groupId, user.id);
      }
    }
  };
};
