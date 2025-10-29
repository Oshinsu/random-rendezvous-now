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
    const { 
      userId, 
      lifecycleStageId, 
      previousStageId, 
      triggerType = 'lifecycle_change',
      healthScore,
      segmentId,
      daysInactive
    } = await req.json();

    console.log(`[AUTOMATION] Triggered for user ${userId}, type: ${triggerType}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find matching active automation rules based on trigger type
    let query = supabaseClient
      .from('crm_automation_rules')
      .select('*, campaign:crm_campaigns(*)')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Filter by trigger type if provided
    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    const { data: rules, error: rulesError } = await query;

    if (rulesError) {
      console.error('[ERROR] Failed to fetch automation rules:', rulesError);
      throw rulesError;
    }

    console.log(`[INFO] Found ${rules?.length || 0} automation rules to evaluate for ${triggerType}`);

    const triggeredRules = [];

    for (const rule of rules || []) {
      const condition = rule.trigger_condition || {};
      let ruleMatches = false;

      // Evaluate rule based on trigger type
      switch (rule.trigger_type) {
        case 'lifecycle_change':
          ruleMatches = 
            condition.to_stage_id === lifecycleStageId || 
            condition.from_stage_id === previousStageId ||
            condition.lifecycle_event; // Generic lifecycle events
          break;

        case 'segment_entry':
          ruleMatches = condition.segment_id === segmentId;
          break;

        case 'health_threshold':
          if (healthScore !== undefined) {
            const threshold = condition.health_score_below || 30;
            ruleMatches = healthScore < threshold;
          }
          break;

        case 'inactivity':
          if (daysInactive !== undefined) {
            const requiredDays = condition.days_inactive || condition.hours_since_signup ? 
              Math.ceil((condition.hours_since_signup || 0) / 24) : 7;
            ruleMatches = daysInactive >= requiredDays;
          }
          break;

        default:
          console.log(`[WARN] Unknown trigger type: ${rule.trigger_type}`);
      }

      if (ruleMatches) {
        console.log(`[MATCH] Rule "${rule.rule_name}" matched for user ${userId}`);

        // Schedule the campaign send (with delay if specified)
        const sendAt = new Date();
        sendAt.setMinutes(sendAt.getMinutes() + (rule.delay_minutes || 0));

        // Check unsubscribes
        const { data: unsubscribes } = await supabaseClient
          .from('crm_unsubscribes')
          .select('channel')
          .eq('user_id', userId)
          .in('channel', ['email', 'in_app', 'all']);

        if (unsubscribes && unsubscribes.length > 0) {
          console.log(`[SKIP] User ${userId} has unsubscribed, skipping automation`);
          continue;
        }

        // Get action from condition (new SOTA approach)
        const action = condition.action || 'send_lifecycle_campaign';
        const channels = condition.channels || ['email'];
        const template = condition.template;

        console.log(`[ACTION] Executing ${action} for user ${userId} via ${channels.join(', ')}`);

        // If delay is 0, send immediately
        if (rule.delay_minutes === 0) {
          // If campaign_id exists, use it, otherwise generate dynamic campaign from rule
          if (rule.campaign_id) {
            const { error: sendError } = await supabaseClient.functions.invoke(
              'send-lifecycle-campaign',
              { 
                body: { 
                  campaignId: rule.campaign_id,
                  targetUserIds: [userId]
                } 
              }
            );

            if (sendError) {
              console.error(`[ERROR] Failed to send campaign:`, sendError);
            } else {
              console.log(`[SUCCESS] Campaign sent immediately to user ${userId}`);
              triggeredRules.push({
                rule_id: rule.id,
                rule_name: rule.rule_name,
                sent_immediately: true,
                channels,
                template
              });
            }
          } else {
            // Create dynamic campaign from rule conditions
            console.log(`[INFO] Creating dynamic campaign from rule ${rule.rule_name}`);
            triggeredRules.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              action,
              channels,
              template,
              status: 'dynamic_campaign_required'
            });
          }
        } else {
          // Log for later processing (could use a queue or scheduled task)
          console.log(`[SCHEDULED] Campaign will be sent in ${rule.delay_minutes} minutes`);
          triggeredRules.push({
            rule_id: rule.id,
            rule_name: rule.rule_name,
            scheduled_for: sendAt.toISOString(),
            delay_minutes: rule.delay_minutes,
            channels,
            template,
            campaign_id: rule.campaign_id
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        triggered_rules: triggeredRules.length,
        rules: triggeredRules
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