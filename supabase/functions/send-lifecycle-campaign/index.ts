import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, user_ids, zapier_webhook_url } = await req.json();

    if (!campaign_id) {
      throw new Error('campaign_id is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Sending lifecycle campaign:', campaign_id);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('crm_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError) throw campaignError;

    let targetUsers = user_ids;

    // If no specific users, get users from segment or lifecycle stage
    if (!targetUsers || targetUsers.length === 0) {
      if (campaign.target_segment_id) {
        const { data: memberships } = await supabaseClient
          .from('crm_user_segment_memberships')
          .select('user_id')
          .eq('segment_id', campaign.target_segment_id);
        
        targetUsers = memberships?.map(m => m.user_id) || [];
      } else if (campaign.target_lifecycle_stage_id) {
        const { data: lifecycles } = await supabaseClient
          .from('crm_user_lifecycle')
          .select('user_id')
          .eq('stage_id', campaign.target_lifecycle_stage_id)
          .eq('is_current', true);
        
        targetUsers = lifecycles?.map(l => l.user_id) || [];
      }
    }

    if (!targetUsers || targetUsers.length === 0) {
      throw new Error('No target users found for campaign');
    }

    console.log(`Sending campaign to ${targetUsers.length} users`);

    let sent = 0;
    let failed = 0;

    // Send to each user
    for (const userId of targetUsers) {
      try {
        // Get user profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .single();

        // Record the send
        const { error: sendError } = await supabaseClient
          .from('crm_campaign_sends')
          .insert({
            campaign_id,
            user_id: userId,
            sent_at: new Date().toISOString(),
            metadata: {
              campaign_name: campaign.campaign_name,
              campaign_type: campaign.campaign_type,
              user_email: profile?.email
            }
          });

        if (sendError && !sendError.message.includes('duplicate key')) {
          console.error('Error recording send:', sendError);
        }

        // If Zapier webhook provided, trigger it
        if (zapier_webhook_url) {
          try {
            await fetch(zapier_webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaign_id,
                campaign_name: campaign.campaign_name,
                user_id: userId,
                user_email: profile?.email,
                user_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
                subject: campaign.subject,
                content: campaign.content,
                timestamp: new Date().toISOString()
              })
            });
          } catch (zapierError) {
            console.error('Zapier webhook error:', zapierError);
          }
        }

        sent++;
      } catch (err) {
        console.error(`Failed to send to user ${userId}:`, err);
        failed++;
      }
    }

    // Update campaign status if all sent
    if (sent > 0) {
      await supabaseClient
        .from('crm_campaigns')
        .update({ status: 'active' })
        .eq('id', campaign_id);
    }

    console.log(`Campaign complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id,
        sent,
        failed,
        total: targetUsers.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in send-lifecycle-campaign:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
