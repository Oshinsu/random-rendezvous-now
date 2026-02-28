import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatus {
  oauthConfigured: boolean;
  circuitBreakerActive: boolean;
  circuitBreakerUntil: Date | null;
  hasActiveQueues: boolean;
  status: 'active' | 'paused' | 'error' | 'loading';
  errorMessage?: string;
}

export function useCampaignSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    oauthConfigured: false,
    circuitBreakerActive: false,
    circuitBreakerUntil: null,
    hasActiveQueues: false,
    status: 'loading',
  });

  const checkStatus = async () => {
    try {
      // Check if OAuth token exists (we store access_token in the table)
      const { data: tokenData, error: tokenError } = await supabase
        .from('zoho_oauth_tokens')
        .select('access_token, circuit_breaker_until')
        .single();

      // Token is configured if we have a record (refresh_token is in env vars)
      const oauthConfigured = !tokenError && tokenData !== null;
      
      const circuitBreakerUntil = tokenData?.circuit_breaker_until 
        ? new Date(tokenData.circuit_breaker_until) 
        : null;
      const circuitBreakerActive = circuitBreakerUntil 
        ? circuitBreakerUntil.getTime() > Date.now() 
        : false;

      // Check if there are active queues
      const { data: queueData } = await supabase
        .from('campaign_email_queue')
        .select('id')
        .in('status', ['pending', 'sending'])
        .limit(1);

      const hasActiveQueues = queueData && queueData.length > 0;

      // Determine overall status
      let overallStatus: SystemStatus['status'] = 'paused';
      let errorMessage: string | undefined;

      if (!oauthConfigured) {
        overallStatus = 'error';
        errorMessage = 'Token OAuth Zoho non configuré - consultez ZOHO_INTEGRATION.md';
      } else if (circuitBreakerActive) {
        overallStatus = 'error';
        errorMessage = 'Circuit breaker activé (rate limit détecté)';
      } else if (hasActiveQueues) {
        overallStatus = 'active';
      }

      setStatus({
        oauthConfigured,
        circuitBreakerActive,
        circuitBreakerUntil,
        hasActiveQueues,
        status: overallStatus,
        errorMessage,
      });
    } catch (error) {
      console.error('Error checking system status:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Erreur lors de la vérification du statut',
      }));
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Every 60s (was 10s)
    return () => clearInterval(interval);
  }, []);

  return { ...status, refetch: checkStatus };
}
