
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
        console.log('👁️ [HEARTBEAT INTELLIGENT] Page visible - mise à jour immédiate');
        EnhancedGroupService.updateUserActivity(groupId, user.id, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [groupId, user]);

  // Battement de cœur d'activité INTELLIGENT
  useEffect(() => {
    if (!enabled || !groupId || !user) {
      console.log('💓 [HEARTBEAT INTELLIGENT] Désactivé:', { enabled, groupId: !!groupId, user: !!user });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('💓 [HEARTBEAT INTELLIGENT] Activation pour groupe:', groupId, 'intervalle:', intervalMs + 'ms');

    // Mise à jour initiale immédiate avec état actif
    EnhancedGroupService.updateUserActivity(groupId, user.id, true);

    // Configuration de l'intervalle intelligent
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        console.log('💓 [HEARTBEAT INTELLIGENT] Pulse - utilisateur actif');
        EnhancedGroupService.updateUserActivity(groupId, user.id, true);
      } else {
        console.log('💓 [HEARTBEAT INTELLIGENT] Pulse - utilisateur passif (page cachée)');
        EnhancedGroupService.updateUserActivity(groupId, user.id, false);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        console.log('💓 [HEARTBEAT INTELLIGENT] Nettoyage');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, groupId, user, intervalMs]);

  return {
    isActive: isActiveRef.current,
    updateActivity: () => {
      if (groupId && user) {
        EnhancedGroupService.updateUserActivity(groupId, user.id, isActiveRef.current);
      }
    }
  };
};
