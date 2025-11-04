import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Circuit breaker constants
const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_BREAKER_DURATION = 5 * 60 * 1000; // 5 minutes in ms
const ADVISORY_LOCK_ID = 123456789; // For distributed lock

// Retry helper with exponential backoff for Zoho rate limit handling
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    // Return immediately if not rate limited
    if (response.status !== 429) {
      return response;
    }
    
    // Rate limit detected - implement exponential backoff
    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
    console.log(`⏳ Zoho rate limit (429) detected, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
    await new Promise(r => setTimeout(r, delay));
  }
  
  throw new Error('Zoho rate limit exceeded after max retries');
}

async function getZohoAccessToken(supabaseClient: any, credentials: any): Promise<string> {
  // Step 1: Check circuit breaker status
  const { data: circuitCheck } = await supabaseClient
    .from('zoho_oauth_tokens')
    .select('id, access_token, expires_at, circuit_breaker_until, consecutive_failures')
    .maybeSingle();

  if (circuitCheck?.circuit_breaker_until) {
    const breakerUntil = new Date(circuitCheck.circuit_breaker_until).getTime();
    if (breakerUntil > Date.now()) {
      const waitMinutes = Math.ceil((breakerUntil - Date.now()) / 60000);
      throw new Error(`⏸️ Circuit breaker active. Wait ${waitMinutes} minutes before retrying.`);
    }
  }

  // Step 2: Try to get cached token from PostgreSQL
  if (circuitCheck?.access_token && circuitCheck?.expires_at) {
    const expiresAt = new Date(circuitCheck.expires_at).getTime();
    if (expiresAt > Date.now()) {
      console.log('✅ Using cached Zoho token from PostgreSQL');
      return circuitCheck.access_token;
    }
  }

  // Step 3: Acquire distributed lock to prevent simultaneous refreshes
  const { data: lockAcquired } = await supabaseClient.rpc('pg_try_advisory_lock', { 
    key: BigInt(ADVISORY_LOCK_ID) 
  }).single();

  if (!lockAcquired) {
    console.log('⏳ Another instance is refreshing token, waiting...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retry getting cached token after wait
    const { data: retryToken } = await supabaseClient
      .from('zoho_oauth_tokens')
      .select('access_token, expires_at')
      .maybeSingle();
    
    if (retryToken?.access_token && new Date(retryToken.expires_at).getTime() > Date.now()) {
      console.log('✅ Using refreshed token from another instance');
      return retryToken.access_token;
    }
  }

  try {
    console.log('🔄 Fetching new Zoho access token...');
    
    const response = await fetchWithRetry('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: credentials.ZOHO_REFRESH_TOKEN,
        client_id: credentials.ZOHO_CLIENT_ID,
        client_secret: credentials.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error('❌ Zoho OAuth error:', data);
      
      // Increment failure counter
      const newFailures = (circuitCheck?.consecutive_failures || 0) + 1;
      
      // Activate circuit breaker if max failures reached
      if (newFailures >= MAX_CONSECUTIVE_FAILURES) {
        const breakerUntil = new Date(Date.now() + CIRCUIT_BREAKER_DURATION);
        
        if (circuitCheck?.id) {
          await supabaseClient
            .from('zoho_oauth_tokens')
            .update({
              circuit_breaker_until: breakerUntil.toISOString(),
              consecutive_failures: newFailures,
            })
            .eq('id', circuitCheck.id);
        } else {
          await supabaseClient
            .from('zoho_oauth_tokens')
            .insert({
              access_token: 'CIRCUIT_BREAKER_ACTIVE',
              expires_at: new Date().toISOString(),
              circuit_breaker_until: breakerUntil.toISOString(),
              consecutive_failures: newFailures,
            });
        }
        
        console.error(`🛑 Circuit breaker activated until ${breakerUntil.toISOString()}`);
      } else if (circuitCheck?.id) {
        await supabaseClient
          .from('zoho_oauth_tokens')
          .update({ consecutive_failures: newFailures })
          .eq('id', circuitCheck.id);
      }
      
      throw new Error(`Failed to get Zoho access token: ${JSON.stringify(data)}`);
    }

    // Success: Reset failure counter and save new token
    const expiresAt = new Date(Date.now() + (59 * 60 * 1000)); // 59 minutes
    
    if (circuitCheck?.id) {
      await supabaseClient
        .from('zoho_oauth_tokens')
        .update({
          access_token: data.access_token,
          expires_at: expiresAt.toISOString(),
          circuit_breaker_until: null,
          consecutive_failures: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', circuitCheck.id);
    } else {
      await supabaseClient
        .from('zoho_oauth_tokens')
        .insert({
          access_token: data.access_token,
          expires_at: expiresAt.toISOString(),
          circuit_breaker_until: null,
          consecutive_failures: 0,
        });
    }

    console.log('✅ New Zoho token obtained and cached in PostgreSQL');
    return data.access_token;
  } finally {
    // Always release the lock
    if (lockAcquired) {
      await supabaseClient.rpc('pg_advisory_unlock', { key: BigInt(ADVISORY_LOCK_ID) });
    }
  }
}

interface EmailRequest {
  to: string[];
  subject: string;
  html_content: string;
  from_name?: string;
  campaign_id?: string;
  user_id?: string;
  track_opens?: boolean;
  track_clicks?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZOHO_CLIENT_ID = Deno.env.get('ZOHO_CLIENT_ID');
    const ZOHO_CLIENT_SECRET = Deno.env.get('ZOHO_CLIENT_SECRET');
    const ZOHO_REFRESH_TOKEN = Deno.env.get('ZOHO_REFRESH_TOKEN');
    const ZOHO_ACCOUNT_ID = Deno.env.get('ZOHO_ACCOUNT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_ACCOUNT_ID) {
      throw new Error('Zoho credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const emailRequest: EmailRequest = await req.json();

    // Get Zoho access token with PostgreSQL cache + circuit breaker
    const access_token = await getZohoAccessToken(supabase, {
      ZOHO_CLIENT_ID,
      ZOHO_CLIENT_SECRET,
      ZOHO_REFRESH_TOKEN,
    });

    // Add tracking pixels if enabled
    let htmlContent = emailRequest.html_content;
    
    if (emailRequest.track_opens && emailRequest.campaign_id && emailRequest.user_id) {
      const trackingPixel = `<img src="${SUPABASE_URL}/functions/v1/track-campaign-interaction?campaign_id=${emailRequest.campaign_id}&user_id=${emailRequest.user_id}&type=open" width="1" height="1" style="display:none" />`;
      htmlContent += trackingPixel;
    }

    if (emailRequest.track_clicks && emailRequest.campaign_id && emailRequest.user_id) {
      // Replace links with tracking links
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
      htmlContent = htmlContent.replace(linkRegex, (match, url) => {
        const trackingUrl = `${SUPABASE_URL}/functions/v1/track-campaign-interaction?campaign_id=${emailRequest.campaign_id}&user_id=${emailRequest.user_id}&type=click&redirect=${encodeURIComponent(url)}`;
        return match.replace(url, trackingUrl);
      });
    }

    // Send email via Zoho Mail API with retry
    console.log('📧 Sending email via Zoho Mail API...');
    const emailPayload = {
      fromAddress: emailRequest.from_name ? `${emailRequest.from_name} <noreply@randomapp.fr>` : 'noreply@randomapp.fr',
      toAddress: emailRequest.to.join(','),
      subject: emailRequest.subject,
      content: htmlContent,
    };

    const sendResponse = await fetchWithRetry('https://mail.zoho.com/api/accounts/' + ZOHO_ACCOUNT_ID + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('❌ Zoho Mail API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const sendResult = await sendResponse.json();
    console.log('✅ Email sent successfully');

    // Record in campaign_sends if campaign_id provided
    if (emailRequest.campaign_id && emailRequest.user_id) {
      await supabase.from('crm_campaign_sends').insert({
        campaign_id: emailRequest.campaign_id,
        user_id: emailRequest.user_id,
        metadata: { zoho_message_id: sendResult.data?.messageId },
      });
    }

    // Track email send for warmup monitoring
    try {
      await supabase.from('email_send_tracking').insert({
        sent_at: new Date().toISOString(),
        campaign_id: emailRequest.campaign_id || null,
        recipient_email: emailRequest.to[0],
        status: 'sent'
      });
    } catch (trackError) {
      console.error('⚠️ Failed to track email send (non-blocking):', trackError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: sendResult.data?.messageId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-zoho-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
