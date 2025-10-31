import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 5; // Send 5 emails per batch (respects 10 OAuth/min limit)
const ZOHO_HOURLY_LIMIT = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const kv = await Deno.openKv();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting queue processor...');

    // Get all pending campaigns from queue
    const iterator = kv.list({ prefix: ['campaign_queue'] });
    let totalProcessed = 0;

    for await (const entry of iterator) {
      const campaign = entry.value as any;
      
      // Skip if already completed
      if (campaign.processed >= campaign.total) {
        console.log(`✅ Campaign ${campaign.campaignId} already completed`);
        await kv.delete(entry.key);
        continue;
      }

      console.log(`📧 Processing campaign ${campaign.campaignId}: ${campaign.processed}/${campaign.total}`);

      // Get next batch of users to send
      const usersToSend = campaign.users.slice(
        campaign.processed, 
        campaign.processed + BATCH_SIZE
      );

      let batchSuccess = 0;
      let batchFailed = 0;

      // Send emails in batch
      for (const user of usersToSend) {
        try {
          // Replace template variables
          const subject = campaign.campaignData.subject
            .replace(/{{first_name}}/g, user.firstName || 'là');
          
          const content = campaign.campaignData.content
            .replace(/{{first_name}}/g, user.firstName || 'là');

          // Invoke send-zoho-email
          const emailResponse = await supabase.functions.invoke('send-zoho-email', {
            body: {
              to: user.email,
              subject,
              htmlContent: content,
              trackOpens: true,
              trackClicks: true,
              campaignId: campaign.campaignId,
              userId: user.userId
            }
          });

          if (emailResponse.error) {
            console.error(`❌ Failed to send email to ${user.email}:`, emailResponse.error);
            batchFailed++;
          } else {
            console.log(`✅ Email sent to ${user.email}`);
            batchSuccess++;
          }

          // Small delay between emails to avoid rate limits
          await new Promise(r => setTimeout(r, 200));

        } catch (error: any) {
          console.error(`❌ Error sending to ${user.email}:`, error.message);
          batchFailed++;
        }
      }

      // Update campaign progress in KV
      campaign.processed += usersToSend.length;
      campaign.failed += batchFailed;
      campaign.status = campaign.processed >= campaign.total ? 'completed' : 'sending';
      
      await kv.set(entry.key, campaign);
      totalProcessed += usersToSend.length;

      console.log(`📊 Batch complete: ${batchSuccess} success, ${batchFailed} failed`);

      // If campaign completed, update DB and clean up
      if (campaign.processed >= campaign.total) {
        await supabase
          .from('crm_campaigns')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', campaign.campaignId);

        console.log(`🎉 Campaign ${campaign.campaignId} completed!`);
        
        // Keep in KV for 1 hour for monitoring, then auto-delete
        await kv.set(entry.key, campaign, { expireIn: 3600000 });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: totalProcessed,
        message: `Processed ${totalProcessed} emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Queue processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
