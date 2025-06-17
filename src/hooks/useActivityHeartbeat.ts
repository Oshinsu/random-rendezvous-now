
import { useEffect, useRef } from 'react';
import { UnifiedGroupRetrievalService } from '@/services/unifiedGroupRetrieval';
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
  intervalMs = GROUP_CONSTANTS.HEARTBEAT_INTERVAL // Now 20 seconds by default
}: ActivityHeartbeatOptions) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Track page visibility with enhanced logging
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      console.log('👁️ [HEARTBEAT] Visibilité page:', isActiveRef.current ? 'visible' : 'cachée');
      
      // Immediate update when page becomes visible
      if (isActiveRef.current && groupId && user) {
        console.log('👁️ [HEARTBEAT] Page visible - mise à jour immédiate');
        UnifiedGroupRetrievalService.updateUserActivity(groupId, user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [groupId, user]);

  // Enhanced activity heartbeat
  useEffect(() => {
    if (!enabled || !groupId || !user) {
      console.log('💓 [HEARTBEAT] Désactivé:', { enabled, groupId: !!groupId, user: !!user });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('💓 [HEARTBEAT] Activation RENFORCÉE pour groupe:', groupId, 'intervalle:', intervalMs + 'ms');

    // Immediate initial update
    UnifiedGroupRetrievalService.updateUserActivity(groupId, user.id);

    // Set up more frequent interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        console.log('💓 [HEARTBEAT] Pulse RENFORCÉ - mise à jour activité');
        UnifiedGroupRetrievalService.updateUserActivity(groupId, user.id);
      } else {
        console.log('💓 [HEARTBEAT] Pulse ignoré - page non visible');
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        console.log('💓 [HEARTBEAT] Nettoyage');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, groupId, user, intervalMs]);

  return {
    isActive: isActiveRef.current,
    updateActivity: () => {
      if (groupId && user) {
        UnifiedGroupRetrievalService.updateUserActivity(groupId, user.id);
      }
    }
  };
};
