
import { useEffect, useRef } from 'react';
import { UnifiedGroupRetrievalService } from '@/services/unifiedGroupRetrieval';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityHeartbeatOptions {
  groupId: string | null;
  enabled: boolean;
  intervalMs?: number; // Default: 30 seconds
}

export const useActivityHeartbeat = ({ 
  groupId, 
  enabled, 
  intervalMs = 30000 
}: ActivityHeartbeatOptions) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      console.log('👁️ [HEARTBEAT] Visibilité page:', isActiveRef.current ? 'visible' : 'cachée');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Activity heartbeat
  useEffect(() => {
    if (!enabled || !groupId || !user) {
      console.log('💓 [HEARTBEAT] Désactivé:', { enabled, groupId: !!groupId, user: !!user });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('💓 [HEARTBEAT] Activation pour groupe:', groupId, 'intervalle:', intervalMs + 'ms');

    // Initial update
    UnifiedGroupRetrievalService.updateUserActivity(groupId, user.id);

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        console.log('💓 [HEARTBEAT] Pulse - mise à jour activité');
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
