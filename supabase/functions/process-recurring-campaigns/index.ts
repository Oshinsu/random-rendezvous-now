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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch recurring campaigns
    const { data: recurringCampaigns, error: fetchError } = await supabaseClient
      .from('crm_campaigns')
      .select('*')
      .eq('is_recurring', true)
      .eq('status', 'active');

    if (fetchError) {
      throw fetchError;
    }

    const results = [];
    const now = new Date();

    for (const campaign of recurringCampaigns || []) {
      try {
        const pattern = campaign.recurrence_pattern as any;
        if (!pattern) continue;

        // Calculate next send date based on pattern
        let nextSendDate = new Date();
        
        if (pattern.frequency === 'daily') {
          nextSendDate.setDate(nextSendDate.getDate() + 1);
          nextSendDate.setHours(pattern.hour || 17, 0, 0, 0);
        } else if (pattern.frequency === 'weekly') {
          const targetDay = pattern.day || 4; // Default Thursday
          const currentDay = nextSendDate.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
          nextSendDate.setDate(nextSendDate.getDate() + daysUntilTarget);
          nextSendDate.setHours(pattern.hour || 17, 0, 0, 0);
        } else if (pattern.frequency === 'monthly') {
          const targetDate = pattern.date || 1;
          nextSendDate.setMonth(nextSendDate.getMonth() + 1);
          nextSendDate.setDate(targetDate);
          nextSendDate.setHours(pattern.hour || 17, 0, 0, 0);
        }

        // Check if we need to create a new instance
        const { data: existingScheduled } = await supabaseClient
          .from('crm_campaigns')
          .select('id')
          .eq('status', 'scheduled')
          .gte('send_at', now.toISOString())
          .like('campaign_name', `${campaign.campaign_name}%`)
          .single();

        if (!existingScheduled) {
          // Create new campaign instance
          const newCampaign = {
            campaign_name: `${campaign.campaign_name} - ${nextSendDate.toLocaleDateString('fr-FR')}`,
            campaign_type: campaign.campaign_type,
            trigger_type: campaign.trigger_type,
            target_segment_id: campaign.target_segment_id,
            target_lifecycle_stage_id: campaign.target_lifecycle_stage_id,
            subject: campaign.subject,
            content: campaign.content,
            channels: campaign.channels,
            status: 'scheduled',
            send_at: nextSendDate.toISOString(),
            template_data: {
              ...campaign.template_data,
              parent_recurring_campaign_id: campaign.id
            }
          };

          const { data: created, error: createError } = await supabaseClient
            .from('crm_campaigns')
            .insert(newCampaign)
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          results.push({
            parent_campaign_id: campaign.id,
            new_campaign_id: created.id,
            send_at: nextSendDate.toISOString(),
            status: 'created'
          });
        } else {
          results.push({
            parent_campaign_id: campaign.id,
            status: 'already_scheduled'
          });
        }
      } catch (error) {
        console.error(`Error processing recurring campaign ${campaign.id}:`, error);
        results.push({
          parent_campaign_id: campaign.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: recurringCampaigns?.length || 0,
        created: results.filter(r => r.status === 'created').length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error processing recurring campaigns:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});