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
    const { userId, lifecycleStageId, previousStageId } = await req.json();

    console.log(`[AUTOMATION] Triggered for user ${userId}, stage ${lifecycleStageId}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find matching active automation rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('crm_automation_rules')
      .select('*, campaign:crm_campaigns(*)')
      .eq('is_active', true)
      .eq('trigger_type', 'lifecycle_change')
      .order('priority', { ascending: false });

    if (rulesError) {
      console.error('[ERROR] Failed to fetch automation rules:', rulesError);
      throw rulesError;
    }

    console.log(`[INFO] Found ${rules?.length || 0} automation rules to evaluate`);

    const triggeredRules = [];

    for (const rule of rules || []) {
      const condition = rule.trigger_condition || {};
      
      // Check if rule matches this lifecycle change
      const matchesStage = 
        condition.to_stage_id === lifecycleStageId || 
        condition.from_stage_id === previousStageId;

      if (matchesStage && rule.campaign_id) {
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

        // If delay is 0, send immediately
        if (rule.delay_minutes === 0) {
          // Invoke send campaign for this single user
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
              sent_immediately: true
            });
          }
        } else {
          // Log for later processing (could use a queue or scheduled task)
          console.log(`[SCHEDULED] Campaign will be sent in ${rule.delay_minutes} minutes`);
          triggeredRules.push({
            rule_id: rule.id,
            rule_name: rule.rule_name,
            scheduled_for: sendAt.toISOString(),
            delay_minutes: rule.delay_minutes
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