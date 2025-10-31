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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting queue processor...');

    // Get all pending/sending campaigns from database
    const { data: queues, error: fetchError } = await supabase
      .from('campaign_email_queue')
      .select('*')
      .in('status', ['pending', 'sending'])
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching queues:', fetchError);
      throw fetchError;
    }

    if (!queues || queues.length === 0) {
      console.log('✅ No campaigns to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalProcessed = 0;

    for (const campaign of queues) {
      // Skip if already completed
      if (campaign.processed >= campaign.total) {
        console.log(`✅ Campaign ${campaign.campaign_id} already completed`);
        await supabase
          .from('campaign_email_queue')
          .update({ status: 'completed' })
          .eq('id', campaign.id);
        continue;
      }

      console.log(`📧 Processing campaign ${campaign.campaign_id}: ${campaign.processed}/${campaign.total}`);

      // Update status to 'sending'
      if (campaign.status === 'pending') {
        await supabase
          .from('campaign_email_queue')
          .update({ status: 'sending' })
          .eq('id', campaign.id);
      }

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
          const subject = campaign.campaign_data.subject
            .replace(/{{first_name}}/g, user.firstName || 'là');
          
          const content = campaign.campaign_data.content
            .replace(/{{first_name}}/g, user.firstName || 'là');

          // Invoke send-zoho-email
          const emailResponse = await supabase.functions.invoke('send-zoho-email', {
            body: {
              to: user.email,
              subject,
              htmlContent: content,
              trackOpens: true,
              trackClicks: true,
              campaignId: campaign.campaign_id,
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

      // Update campaign progress in database
      const newProcessed = campaign.processed + usersToSend.length;
      const newFailed = campaign.failed + batchFailed;
      const finalStatus = newProcessed >= campaign.total ? 'completed' : 'sending';
      
      await supabase
        .from('campaign_email_queue')
        .update({
          processed: newProcessed,
          failed: newFailed,
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      totalProcessed += usersToSend.length;

      console.log(`📊 Batch complete: ${batchSuccess} success, ${batchFailed} failed`);

      // If campaign completed, update campaign status
      if (finalStatus === 'completed') {
        await supabase
          .from('crm_campaigns')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', campaign.campaign_id);

        console.log(`🎉 Campaign ${campaign.campaign_id} completed!`);
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
