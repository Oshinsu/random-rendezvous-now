import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { campaignId } = await req.json();

    console.log('Starting campaign send for campaign:', campaignId);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('crm_campaigns')
      .select('*, crm_user_segments(*), crm_lifecycle_stages(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    console.log('Campaign found:', campaign.campaign_name);

    // Get target users based on segment or lifecycle stage
    let targetUsers = [];

    if (campaign.target_segment_id) {
      const { data: segmentMembers } = await supabase
        .from('crm_user_segment_memberships')
        .select('user_id, profiles!inner(id, email, first_name, last_name)')
        .eq('segment_id', campaign.target_segment_id);
      
      targetUsers = (segmentMembers || []).map(m => ({
        user_id: m.user_id,
        email: m.profiles.email,
        first_name: m.profiles.first_name,
        last_name: m.profiles.last_name
      }));
    } else if (campaign.target_lifecycle_stage_id) {
      const { data: lifecycleUsers } = await supabase
        .from('crm_user_lifecycle')
        .select('user_id, profiles!inner(id, email, first_name, last_name)')
        .eq('stage_id', campaign.target_lifecycle_stage_id)
        .eq('is_current', true);
      
      targetUsers = (lifecycleUsers || []).map(m => ({
        user_id: m.user_id,
        email: m.profiles.email,
        first_name: m.profiles.first_name,
        last_name: m.profiles.last_name
      }));
    }

    if (targetUsers.length === 0) {
      console.log('No target users found for campaign');
      return new Response(
        JSON.stringify({ message: 'No target users found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending to ${targetUsers.length} users`);

    // Send emails to all target users
    let sentCount = 0;
    const errors = [];

    for (const user of targetUsers) {
      try {
        // Replace template variables
        let htmlContent = campaign.content;
        
        htmlContent = htmlContent
          .replace(/\{\{first_name\}\}/g, user.first_name || 'utilisateur')
          .replace(/\{\{last_name\}\}/g, user.last_name || '');

        // Send email via Zoho
        const { error: sendError } = await supabase.functions.invoke('send-zoho-email', {
          body: {
            to: [user.email],
            subject: campaign.subject,
            html_content: htmlContent,
            campaign_id: campaign.id,
            user_id: user.user_id,
            track_opens: true,
            track_clicks: true
          }
        });

        if (sendError) {
          console.error('Error sending to user:', user.user_id, sendError);
          errors.push({ user_id: user.user_id, error: sendError.message });
        } else {
          sentCount++;
        }
      } catch (error) {
        console.error('Error processing user:', user.user_id, error);
        errors.push({ user_id: user.user_id, error: error.message });
      }
    }

    // Update campaign status
    await supabase
      .from('crm_campaigns')
      .update({ status: 'sent' })
      .eq('id', campaignId);

    console.log(`Campaign sent: ${sentCount}/${targetUsers.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        total: targetUsers.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending campaign:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
