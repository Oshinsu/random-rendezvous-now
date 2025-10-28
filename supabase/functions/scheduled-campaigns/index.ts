import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[CRON] Checking for scheduled campaigns to send...');

    // Get campaigns that are scheduled and should be sent now
    const now = new Date().toISOString();
    const { data: campaigns, error: fetchError } = await supabaseClient
      .from('crm_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('send_at', now);

    if (fetchError) {
      console.error('[ERROR] Failed to fetch scheduled campaigns:', fetchError);
      throw fetchError;
    }

    console.log(`[INFO] Found ${campaigns?.length || 0} campaigns to send`);

    const results = [];

    for (const campaign of campaigns || []) {
      console.log(`[INFO] Processing campaign: ${campaign.campaign_name} (${campaign.id})`);

      try {
        // Update status to 'active' before sending
        await supabaseClient
          .from('crm_campaigns')
          .update({ status: 'active' })
          .eq('id', campaign.id);

        // Invoke send-lifecycle-campaign
        const { data: sendResult, error: sendError } = await supabaseClient.functions.invoke(
          'send-lifecycle-campaign',
          { body: { campaignId: campaign.id } }
        );

        if (sendError) {
          console.error(`[ERROR] Failed to send campaign ${campaign.id}:`, sendError);
          // Revert status to scheduled on error
          await supabaseClient
            .from('crm_campaigns')
            .update({ status: 'scheduled' })
            .eq('id', campaign.id);
          
          results.push({
            campaign_id: campaign.id,
            success: false,
            error: sendError.message
          });
        } else {
          console.log(`[SUCCESS] Campaign ${campaign.id} sent successfully:`, sendResult);
          // Update status to completed
          await supabaseClient
            .from('crm_campaigns')
            .update({ status: 'completed' })
            .eq('id', campaign.id);
          
          results.push({
            campaign_id: campaign.id,
            success: true,
            sent: sendResult?.sent || 0
          });
        }
      } catch (error) {
        console.error(`[ERROR] Exception while processing campaign ${campaign.id}:`, error);
        results.push({
          campaign_id: campaign.id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: campaigns?.length || 0,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[FATAL ERROR]:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});