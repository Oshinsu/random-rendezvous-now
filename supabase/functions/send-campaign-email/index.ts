import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      to, 
      subject, 
      html,
      text,
      campaignId,
      userId,
      tags = [],
    } = await req.json();

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and (html or text)' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Random <hello@random.app>',  // Remplacer par votre domaine vérifié
      to: [to],
      subject,
      html,
      text,
      tags: [
        ...tags,
        ...(campaignId ? [{ name: 'campaign_id', value: campaignId }] : []),
        ...(userId ? [{ name: 'user_id', value: userId }] : []),
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      
      // Log failed send
      if (campaignId) {
        await supabase
          .from('email_send_logs')
          .insert({
            campaign_id: campaignId,
            recipient_email: to,
            status: 'failed',
            bounced_reason: (error instanceof Error ? error.message : String(error)),
            metadata: { user_id: userId, error: (error instanceof Error ? error.message : String(error)) },
          });
      }
      
      return new Response(
        JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log successful send in Supabase
    if (campaignId) {
      const { error: logError } = await supabase
        .from('email_send_logs')
        .insert({
          campaign_id: campaignId,
          recipient_email: to,
          resend_id: data.id,
          status: 'sent',
          metadata: { user_id: userId },
        });

      if (logError) {
        console.error('Error logging email send:', logError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        message: 'Email sent successfully' 
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || 'Internal server error' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

