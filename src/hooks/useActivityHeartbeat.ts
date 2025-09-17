
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { RateLimiter } from '@/utils/rateLimiter';

interface ActivityHeartbeatOptions {
  groupId?: string | null;
  enabled?: boolean;
  intervalMs?: number;
}

export const useActivityHeartbeat = ({ 
  groupId, 
  enabled = true, 
  intervalMs = GROUP_CONSTANTS.HEARTBEAT_INTERVAL 
}: ActivityHeartbeatOptions = {}) => {
  const { user } = useAuth();
  const isActiveRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const maxConsecutiveErrors = 3;

  // Smart visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden;
      isActiveRef.current = isActive;
      
      console.log(`📱 Page visibility: ${isActive ? 'visible' : 'hidden'}`);
      
      // Only update when page becomes visible and no recent errors
      if (isActive && enabled && groupId && user && consecutiveErrorsRef.current < maxConsecutiveErrors) {
        setTimeout(() => {
          if (isActiveRef.current) { // Double check still active
            updateActivitySafe();
          }
        }, 1000); // Small delay to avoid race conditions
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    handleVisibilityChange(); // Set initial state

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, groupId, user]);

  // Safe activity update with error handling
  const updateActivitySafe = useCallback(async () => {
    if (!groupId || !user) return;

    // Check circuit breaker
    if (RateLimiter.isRateLimited('heartbeat_activity', {
      maxAttempts: 3,
      windowMs: 5 * 60 * 1000, // 5 minutes window
      blockDurationMs: 10 * 60 * 1000 // 10 minutes block
    })) {
      console.log('💔 Heartbeat circuit breaker activated, skipping update');
      return;
    }

    try {
      await UnifiedGroupService.updateUserLastSeen(groupId, user.id);
      consecutiveErrorsRef.current = 0; // Reset error counter on success
      console.log('💓 Heartbeat successful');
    } catch (error: any) {
      consecutiveErrorsRef.current++;
      console.error(`💔 Heartbeat failed (${consecutiveErrorsRef.current}/${maxConsecutiveErrors}):`, error);
      
      // Stop heartbeat after too many errors
      if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
        console.error('💀 Too many heartbeat errors, stopping heartbeat');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      
      // Handle rate limiting specifically
      if (error.message?.includes('429') || error.status === 429) {
        console.warn('🚫 Heartbeat rate limited, backing off');
      }
    }
  }, [groupId, user]);

  // Intelligent heartbeat with circuit breaker
  useEffect(() => {
    if (!enabled || !groupId || !user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('💓 [HEARTBEAT OPTIMIZED] Starting for group:', groupId, 'interval:', intervalMs + 'ms');

    // Initial update (delayed to avoid startup rush)
    setTimeout(() => {
      if (isActiveRef.current && consecutiveErrorsRef.current < maxConsecutiveErrors) {
        updateActivitySafe();
      }
    }, 5000);

    // Set up intelligent interval
    intervalRef.current = setInterval(() => {
      // Only send heartbeat when page is visible AND no recent errors
      if (isActiveRef.current && consecutiveErrorsRef.current < maxConsecutiveErrors) {
        updateActivitySafe();
      } else if (!isActiveRef.current) {
        console.log('💤 Skipping heartbeat - page hidden');
      } else {
        console.log('💀 Skipping heartbeat - too many errors');
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        console.log('💓 [HEARTBEAT OPTIMIZED] Cleanup');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, groupId, user, intervalMs, updateActivitySafe]);

  return {
    isActive: isActiveRef.current,
    updateActivity: useCallback(async () => {
      if (groupId && user && consecutiveErrorsRef.current < maxConsecutiveErrors) {
        await updateActivitySafe();
      }
    }, [groupId, user, updateActivitySafe]),
    hasErrors: consecutiveErrorsRef.current >= maxConsecutiveErrors
  };
};
