import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get Zoho access token
    console.log('Getting Zoho access token...');
    const tokenResponse = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get Zoho access token: ${errorText}`);
    }

    const { access_token } = await tokenResponse.json();

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

    // Send email via Zoho Mail API
    console.log('Sending email via Zoho Mail API...');
    const emailPayload = {
      fromAddress: `noreply@randomapp.fr`,
      toAddress: emailRequest.to.join(','),
      subject: emailRequest.subject,
      content: htmlContent,
      mailFormat: 'html',
      accountId: ZOHO_ACCOUNT_ID,
    };

    const sendResponse = await fetch('https://mail.zoho.eu/api/accounts/' + ZOHO_ACCOUNT_ID + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Zoho API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const sendResult = await sendResponse.json();
    console.log('Email sent successfully:', sendResult);

    // Record in campaign_sends if campaign_id provided
    if (emailRequest.campaign_id && emailRequest.user_id) {
      await supabase.from('crm_campaign_sends').insert({
        campaign_id: emailRequest.campaign_id,
        user_id: emailRequest.user_id,
        metadata: { zoho_message_id: sendResult.data?.messageId },
      });
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
