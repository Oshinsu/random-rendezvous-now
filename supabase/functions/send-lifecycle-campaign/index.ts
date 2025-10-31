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

    const { campaignId, specificUserId, source = 'manual' } = await req.json();

    console.log(`Starting campaign send for campaign: ${campaignId}, specificUserId: ${specificUserId}, source: ${source}`);

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

    // Get channels (default to email if not set)
    const channels = campaign.channels || ['email'];
    console.log('Campaign channels:', channels);

    // Get target users based on segment or lifecycle stage (or specific user)
    let targetUsers = [];

    if (specificUserId) {
      const { data: specificUser } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', specificUserId)
        .single();
      
      if (specificUser) {
        targetUsers = [{
          user_id: specificUser.id,
          email: specificUser.email,
          first_name: specificUser.first_name,
          last_name: specificUser.last_name
        }];
      }
    } else if (campaign.target_segment_id) {
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
      return new Response(
        JSON.stringify({ message: 'No target users found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${targetUsers.length} target users`);

    // NEW: Use queue system for large campaigns (>10 users)
    if (targetUsers.length > 10) {
      console.log('📥 Large campaign detected, using queue system');
      
      const { error: queueError } = await supabase.functions.invoke('enqueue-campaign-emails', {
        body: {
          campaignId: campaign.id,
          users: targetUsers.map(u => ({
            userId: u.user_id,
            email: u.email,
            firstName: u.first_name
          })),
          campaignData: {
            subject: campaign.subject || campaign.campaign_name,
            content: campaign.content,
            channels: channels
          }
        }
      });

      if (queueError) {
        throw new Error(`Failed to queue emails: ${queueError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          campaign_id: campaign.id,
          total: targetUsers.length,
          queued: true,
          message: `${targetUsers.length} emails mis en queue (5 emails/min)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OLD: Direct send for small campaigns (<=10 users)
    console.log('📤 Small campaign, sending directly');
    
    let sentCount = 0;
    let emailsSent = 0;
    let notificationsSent = 0;
    const errors = [];

    for (const user of targetUsers) {
      try {
        let content = campaign.content;
        let subject = campaign.subject || '';
        
        content = content
          .replace(/\{\{first_name\}\}/g, user.first_name || 'utilisateur')
          .replace(/\{\{last_name\}\}/g, user.last_name || '');
        
        subject = subject
          .replace(/\{\{first_name\}\}/g, user.first_name || 'utilisateur')
          .replace(/\{\{last_name\}\}/g, user.last_name || '');

        if (channels.includes('email')) {
          const { error: sendError } = await supabase.functions.invoke('send-zoho-email', {
            body: {
              to: user.email,
              subject: subject,
              htmlContent: content,
              trackOpens: true,
              trackClicks: true,
              campaignId: campaign.id,
              userId: user.user_id
            }
          });

          if (sendError) {
            errors.push({ user_id: user.user_id, channel: 'email', error: sendError.message });
          } else {
            emailsSent++;
          }
        }

        if (channels.includes('in_app')) {
          const plainTextBody = content.replace(/<[^>]*>/g, '').substring(0, 200);
          
          const { error: notifError } = await supabase.rpc('create_in_app_notification', {
            target_user_id: user.user_id,
            notif_type: 'campaign',
            notif_title: subject,
            notif_body: plainTextBody,
            notif_data: {
              campaign_id: campaign.id,
              campaign_name: campaign.campaign_name
            },
            notif_icon: 'https://api.iconify.design/mdi:email-newsletter.svg'
          });

          if (notifError) {
            errors.push({ user_id: user.user_id, channel: 'in_app', error: notifError.message });
          } else {
            notificationsSent++;
          }
        }

        sentCount++;
        await new Promise(r => setTimeout(r, 300));
      } catch (error) {
        errors.push({ user_id: user.user_id, error: error.message });
      }
    }

    await supabase
      .from('crm_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        total: targetUsers.length,
        emailsSent,
        notificationsSent,
        channels,
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
