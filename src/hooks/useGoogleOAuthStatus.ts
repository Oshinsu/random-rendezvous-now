import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if Google OAuth is enabled system-wide
 * SOTA 2025: Real-time feature flag avec cache local
 */
export const useGoogleOAuthStatus = () => {
  const [isEnabled, setIsEnabled] = useState(true); // Optimistic default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('is_google_oauth_enabled');
        
        if (error) {
          console.error('Error checking Google OAuth status:', error);
          setIsEnabled(true); // Failsafe on error
        } else {
          setIsEnabled(data || false);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setIsEnabled(true); // Failsafe
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Realtime subscription sur system_settings
    const subscription = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'setting_key=eq.google_oauth_enabled'
        },
        (payload) => {
          const newValue = payload.new.setting_value;
          setIsEnabled(newValue === 'true' || newValue?.[0] === 'true');
          console.log('🔄 Google OAuth status updated:', newValue);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isEnabled, loading };
};
