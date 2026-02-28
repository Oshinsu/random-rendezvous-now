import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔧 Bootstrap Zoho Token
 * 
 * CRITICAL: This function initializes the first Zoho OAuth token in the database.
 * Must be called ONCE before any email campaigns can be sent.
 * 
 * SOTA Oct 2025: PostgreSQL-based token caching with circuit breaker
 * Reference: ZOHO_INTEGRATION.md
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 [Bootstrap] Starting Zoho token initialization...');

    // Check if token already exists
    const { data: existingToken, error: checkError } = await supabaseClient
      .from('zoho_oauth_tokens')
      .select('id, expires_at')
      .maybeSingle();

    if (checkError) {
      console.error('❌ [Bootstrap] Error checking existing token:', checkError);
      throw checkError;
    }

    if (existingToken) {
      console.log('✅ [Bootstrap] Token already exists, skipping initialization');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Token already initialized',
          existing_token_id: existingToken.id,
          expires_at: existingToken.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Zoho credentials from environment
    const clientId = Deno.env.get('ZOHO_CLIENT_ID');
    const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const refreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('❌ Missing Zoho credentials. Please set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN');
    }

    console.log('🔑 [Bootstrap] Fetching initial access token from Zoho...');

    // Request access token from Zoho (US datacenter)
    const tokenResponse = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
      { method: 'POST' }
    );

    console.log('📡 [Bootstrap] Zoho API response status:', tokenResponse.status);

    const tokenData = await tokenResponse.json();
    console.log('📦 [Bootstrap] Zoho API response body:', JSON.stringify(tokenData));

    if (!tokenResponse.ok) {
      console.error('❌ [Bootstrap] Zoho token request failed:', tokenData);
      throw new Error(`Zoho API error: ${tokenResponse.status} - ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('❌ [Bootstrap] No access_token in response. Full response:', tokenData);
      throw new Error(`No access token received from Zoho. Response: ${JSON.stringify(tokenData)}`);
    }

    console.log('✅ [Bootstrap] Access token received, saving to database...');

    // Insert initial token into database with 59min TTL
    const expiresAt = new Date(Date.now() + 59 * 60 * 1000).toISOString();
    
    const { data: insertedToken, error: insertError } = await supabaseClient
      .from('zoho_oauth_tokens')
      .insert({
        access_token: accessToken,
        expires_at: expiresAt,
        consecutive_failures: 0,
        circuit_breaker_until: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Bootstrap] Error inserting token:', insertError);
      throw insertError;
    }

    console.log('✅ [Bootstrap] Token successfully initialized!');
    console.log(`📅 Token expires at: ${expiresAt}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Zoho token successfully initialized',
        token_id: insertedToken.id,
        expires_at: insertedToken.expires_at,
        next_steps: [
          '1. Test email sending with send-zoho-email function',
          '2. Enable process-campaign-queue cron job',
          '3. Monitor logs for any rate limit issues'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [Bootstrap] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        troubleshooting: [
          'Verify ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN are set',
          'Check that refresh token is still valid in Zoho console',
          'Ensure Zoho API is accessible from this region'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
