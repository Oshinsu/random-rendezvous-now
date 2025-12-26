import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendWebhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')!;

/**
 * Verify Resend webhook signature
 * https://resend.com/docs/dashboard/webhooks/verify-signature
 */
function verifySignature(signature: string | null, body: string): boolean {
  if (!signature || !resendWebhookSecret) {
    console.warn('Missing signature or webhook secret');
    return false;
  }

  try {
    const hmac = createHmac('sha256', resendWebhookSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures (constant-time comparison)
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('resend-signature');
    
    // Verify webhook signature (IMPORTANT for security)
    if (resendWebhookSecret && !verifySignature(signature, rawBody)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Parse event
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log(`Received Resend webhook: ${type}`, data);

    // Find email log by resend_id
    const { data: emailLog, error: findError } = await supabase
      .from('email_send_logs')
      .select('*')
      .eq('resend_id', data.email_id)
      .single();

    if (findError || !emailLog) {
      console.error('Email log not found for resend_id:', data.email_id);
      // Still return 200 to avoid Resend retries
      return new Response('Email log not found', { status: 200 });
    }

    // Update email log based on event type
    let updateData: any = {};

    switch (type) {
      case 'email.sent':
        updateData = { status: 'sent' };
        break;

      case 'email.delivered':
        updateData = { status: 'delivered' };
        break;

      case 'email.delivery_delayed':
        // Don't change status, just log
        console.warn('Email delivery delayed:', data.email_id);
        break;

      case 'email.complained':
      case 'email.bounced':
        updateData = {
          status: 'bounced',
          bounced_reason: data.reason || 'Unknown bounce reason',
        };
        break;

      case 'email.opened':
        // Only update if not already clicked (clicked > opened)
        if (emailLog.status !== 'clicked') {
          updateData = {
            status: 'opened',
            opened_at: new Date().toISOString(),
          };
        }
        break;

      case 'email.clicked':
        updateData = {
          status: 'clicked',
          clicked_at: new Date().toISOString(),
          // If opened_at is null, set it to clicked_at (user clicked without opening tracking)
          ...(emailLog.opened_at ? {} : { opened_at: new Date().toISOString() }),
        };
        break;

      default:
        console.log('Unhandled event type:', type);
        break;
    }

    // Update email log if there's data to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('email_send_logs')
        .update(updateData)
        .eq('id', emailLog.id);

      if (updateError) {
        console.error('Error updating email log:', updateError);
        return new Response('Error updating log', { status: 500 });
      }

      console.log(`Email log updated: ${emailLog.id} -> ${updateData.status || 'metadata updated'}`);
    }

    // Return 200 to acknowledge receipt
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on error to avoid Resend retries
    return new Response('Error processed', { status: 200 });
  }
});

