import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔄 Auto-Refresh Zoho Token
 * 
 * SOTA Oct 2025: Proactive token refresh pattern (Google Cloud API Design Guide)
 * Source: https://cloud.google.com/apis/design/design_patterns
 * 
 * CRON Schedule: Every 45 minutes (tokens expire at 59min)
 * Reference: OAuth 2.0 RFC 6749 - Token Refresh Best Practices
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 [Auto-Refresh] Checking token expiration...');

    // Check current token
    const { data: currentToken, error: fetchError } = await supabaseClient
      .from('zoho_oauth_tokens')
      .select('id, expires_at, consecutive_failures, circuit_breaker_until')
      .maybeSingle();

    if (fetchError) {
      console.error('❌ [Auto-Refresh] Error fetching token:', fetchError);
      throw fetchError;
    }

    // If no token exists, return error (must run bootstrap first)
    if (!currentToken) {
      console.warn('⚠️ [Auto-Refresh] No token found. Run bootstrap-zoho-token first.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No token found. Please run bootstrap-zoho-token function first.',
          action_required: 'https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/functions/bootstrap-zoho-token'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if circuit breaker is active
    if (currentToken.circuit_breaker_until && new Date(currentToken.circuit_breaker_until) > new Date()) {
      console.warn('🚨 [Auto-Refresh] Circuit breaker active until:', currentToken.circuit_breaker_until);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Circuit breaker active',
          retry_after: currentToken.circuit_breaker_until
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Check if token expires in next 10 minutes
    const expiresAt = new Date(currentToken.expires_at);
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    if (expiresAt > tenMinutesFromNow) {
      console.log('✅ [Auto-Refresh] Token still valid until:', expiresAt);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Token still valid',
          expires_at: expiresAt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔑 [Auto-Refresh] Token expiring soon, refreshing...');

    // Get Zoho credentials
    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const refreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing Zoho credentials in environment variables');
    }

    // Request new access token from Zoho (US datacenter)
    // Source: Zoho Mail API Documentation 2025
    // https://www.zoho.com/mail/help/api/oauth-overview.html
    const tokenResponse = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
      { method: 'POST' }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ [Auto-Refresh] Zoho API error:', tokenData);
      
      // Increment failure counter and activate circuit breaker if needed
      // Pattern: Circuit Breaker (Martin Fowler)
      // https://martinfowler.com/bliki/CircuitBreaker.html
      const newFailureCount = (currentToken.consecutive_failures || 0) + 1;
      const shouldActivateCircuitBreaker = newFailureCount >= 3;

      await supabaseClient
        .from('zoho_oauth_tokens')
        .update({
          consecutive_failures: newFailureCount,
          circuit_breaker_until: shouldActivateCircuitBreaker 
            ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
            : null
        })
        .eq('id', currentToken.id);

      throw new Error(`Zoho API error: ${tokenResponse.status} - ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token in Zoho response');
    }

    // Update token in database with 59min TTL
    const newExpiresAt = new Date(Date.now() + 59 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabaseClient
      .from('zoho_oauth_tokens')
      .update({
        access_token: accessToken,
        expires_at: newExpiresAt,
        consecutive_failures: 0,
        circuit_breaker_until: null
      })
      .eq('id', currentToken.id);

    if (updateError) {
      console.error('❌ [Auto-Refresh] Error updating token:', updateError);
      throw updateError;
    }

    console.log('✅ [Auto-Refresh] Token refreshed successfully!');
    console.log(`📅 New expiration: ${newExpiresAt}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Token refreshed successfully',
        expires_at: newExpiresAt
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [Auto-Refresh] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
