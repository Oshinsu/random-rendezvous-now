import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'member_joined' | 'group_full' | 'bar_assigned';
  user_email: string;
  group_id: string;
  new_member_name?: string;
  current_count?: number;
  bar_name?: string;
  bar_address?: string;
  meeting_time?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZOHO_CLIENT_ID = Deno.env.get('ZOHO_CLIENT_ID');
    const ZOHO_CLIENT_SECRET = Deno.env.get('ZOHO_CLIENT_SECRET');
    const ZOHO_REFRESH_TOKEN = Deno.env.get('ZOHO_REFRESH_TOKEN');
    const ZOHO_FROM_EMAIL = Deno.env.get('ZOHO_FROM_EMAIL') || 'notifications@random.app';

    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
      console.error('❌ Missing Zoho credentials');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: EmailRequest = await req.json();
    const { type, user_email, group_id, new_member_name, current_count, bar_name, bar_address, meeting_time } = body;

    console.log(`📧 Sending ${type} email to ${user_email}`);

    // Get Zoho access token
    const tokenResponse = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Zoho access token');
    }

    const { access_token } = await tokenResponse.json();

    // Build email based on type
    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'member_joined':
        subject = '👋 Quelqu\'un vient de rejoindre !';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Ça se remplit 🔥</h1>
            <p style="font-size: 16px;"><strong>${new_member_name || 'Un·e aventurier·e'}</strong> vient de rejoindre ton groupe.</p>
            <p style="font-size: 16px;">Vous êtes maintenant <strong>${current_count || '?'}/5</strong> !</p>
            <a href="https://random.app/groups?group_id=${group_id}" 
               style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 16px;">
              💬 Discuter avec le groupe
            </a>
          </div>
        `;
        break;

      case 'group_full':
        subject = '🎉 Groupe complet, let\'s go !';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">C'est parti ! 🚀</h1>
            <p style="font-size: 16px;">Ton groupe de 5 aventurier·e·s est au complet.</p>
            <p style="font-size: 16px;">Le bar va être assigné dans quelques instants — patience 🙏</p>
            <a href="https://random.app/groups?group_id=${group_id}" 
               style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 16px;">
              🔍 Voir mon groupe
            </a>
          </div>
        `;
        break;

      case 'bar_assigned':
        subject = `🍸 RDV au ${bar_name} !`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Ton bar est prêt ! 🔥</h1>
            <h2 style="color: #333;">📍 ${bar_name}</h2>
            <p style="font-size: 16px; color: #666;">${bar_address}</p>
            <p style="font-size: 18px; margin: 20px 0;">🕐 RDV à <strong>${meeting_time}</strong></p>
            <div style="margin-top: 20px;">
              <a href="https://maps.google.com/?q=${encodeURIComponent(bar_address || '')}" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; margin-right: 10px;">
                🗺️ Ouvrir l'itinéraire
              </a>
              <a href="https://random.app/groups?group_id=${group_id}" 
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px;">
                💬 Voir les détails
              </a>
            </div>
          </div>
        `;
        break;
    }

    // Send email via Zoho
    const emailResponse = await fetch('https://api.zeptomail.eu/v1.1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-enczapikey ${access_token}`
      },
      body: JSON.stringify({
        from: { address: ZOHO_FROM_EMAIL },
        to: [{ email_address: { address: user_email } }],
        subject,
        htmlbody: htmlContent
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ Zoho email failed:', errorText);
      throw new Error(`Email send failed: ${errorText}`);
    }

    console.log(`✅ Email ${type} sent to ${user_email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in send-group-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
