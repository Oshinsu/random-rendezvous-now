import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to protect user sessions during critical operations
 * Tracks user activity and provides session monitoring
 */
export const useSessionProtection = () => {
  useEffect(() => {
    // Track user activity for session protection
    const trackActivity = () => {
      (window as any).lastActivity = Date.now();
    };

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Initial activity timestamp
    trackActivity();

    // Monitor session health
    const sessionHealthCheck = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ Session health check failed:', error);
          return;
        }

        if (session) {
          // Session is healthy, update activity
          trackActivity();
        }
      } catch (error) {
        console.warn('⚠️ Session health check error:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
      clearInterval(sessionHealthCheck);
    };
  }, []);

  // Function to protect critical operations
  const protectOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
    // Mark start of critical operation
    (window as any).criticalOperationInProgress = true;
    (window as any).lastActivity = Date.now();
    
    try {
      const result = await operation();
      return result;
    } finally {
      // Mark end of critical operation
      (window as any).criticalOperationInProgress = false;
      (window as any).lastActivity = Date.now();
    }
  };

  return { protectOperation };
};