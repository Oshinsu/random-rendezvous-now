import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📨 Lifecycle automation triggered with payload:', JSON.stringify(body));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      userId, 
      lifecycleStageId, 
      previousStageId,
      segmentId,
      healthScore,
      threshold,
      daysInactive,
      daysInactiveExact,
      neverLoggedIn,
      totalLogins,
      triggerType,
      source = 'unknown'
    } = body;

    if (!userId || !triggerType) {
      throw new Error('Missing required parameters: userId and triggerType');
    }

    console.log(`🔍 Searching rules for trigger type: ${triggerType}, source: ${source}`);

    // Find matching automation rules
    const { data: rules, error: rulesError } = await supabase
      .from('crm_automation_rules')
      .select('*, campaign:crm_campaigns(id, campaign_name, content, subject, channels, template_data)')
      .eq('is_active', true)
      .eq('trigger_type', triggerType)
      .order('priority', { ascending: false });

    if (rulesError) {
      console.error('❌ Error fetching automation rules:', rulesError);
      throw rulesError;
    }

    console.log(`📋 Found ${rules?.length || 0} active rules for trigger type: ${triggerType}`);

    const triggeredRules: any[] = [];
    const scheduledSends: any[] = [];

    for (const rule of rules || []) {
      console.log(`🔎 Evaluating rule: "${rule.rule_name}" (priority: ${rule.priority})`);
      
      const condition = rule.trigger_condition || {};
      let matchesConditions = false;

      // Evaluate conditions based on trigger type
      switch (triggerType) {
        case 'lifecycle_change':
          matchesConditions = 
            (condition.to_stage_id && condition.to_stage_id === lifecycleStageId) ||
            (condition.from_stage_id && condition.from_stage_id === previousStageId);
          console.log(`  Lifecycle: to_stage=${condition.to_stage_id}, from_stage=${condition.from_stage_id}, matches=${matchesConditions}`);
          break;

        case 'segment_entry':
          matchesConditions = condition.segment_id === segmentId;
          console.log(`  Segment: expected=${condition.segment_id}, actual=${segmentId}, matches=${matchesConditions}`);
          break;

        case 'health_threshold':
          if (healthScore !== undefined && threshold !== undefined) {
            matchesConditions = healthScore < threshold;
            console.log(`  Health: score=${healthScore}, threshold=${threshold}, matches=${matchesConditions}`);
          }
          break;

        case 'inactivity':
          if (daysInactiveExact !== undefined) {
            // Match exact days for specific rules
            const expectedDays = condition.days_inactive != null
              ? condition.days_inactive
              : condition.hours_since_signup != null
                ? Math.ceil(condition.hours_since_signup / 24)
                : 7;
            
            // Additional checks for specific rules
            const matchesNeverLoggedIn = condition.never_logged_in === undefined || 
                                        condition.never_logged_in === neverLoggedIn;
            const matchesLoginCount = condition.max_logins === undefined || 
                                     (totalLogins !== undefined && totalLogins < condition.max_logins);
            
            matchesConditions = daysInactiveExact === expectedDays && 
                              matchesNeverLoggedIn && 
                              matchesLoginCount;
            
            console.log(`  Inactivity: expected=${expectedDays}d, actual=${daysInactiveExact}d, neverLoggedIn=${neverLoggedIn}, matches=${matchesConditions}`);
          }
          break;

        default:
          console.log(`⚠️ Unknown trigger type: ${triggerType}`);
      }

      if (matchesConditions) {
        console.log(`✅ Rule "${rule.rule_name}" matches conditions`);
        
        // Check if user has unsubscribed
        const { data: unsubscribeCheck } = await supabase
          .from('crm_unsubscribes')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (unsubscribeCheck) {
          console.log(`⏭️ User ${userId} has unsubscribed, skipping rule`);
          
          // Log execution even if skipped
          await supabase.from('crm_automation_executions').insert({
            rule_id: rule.id,
            user_id: userId,
            trigger_type: triggerType,
            campaign_sent: false,
            send_status: 'skipped_unsubscribed',
            metadata: { source, unsubscribed: true }
          });
          
          continue;
        }

        triggeredRules.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          campaignId: rule.campaign_id,
          delayMinutes: rule.delay_minutes
        });

        if (rule.campaign_id && rule.campaign) {
          // Schedule or send campaign
          if (rule.delay_minutes > 0) {
            console.log(`⏰ Scheduling campaign with ${rule.delay_minutes} minute delay`);
            
            const scheduledFor = new Date(Date.now() + rule.delay_minutes * 60 * 1000);
            
            // Insert into crm_scheduled_sends table
            const { data: scheduledSend, error: scheduleError } = await supabase
              .from('crm_scheduled_sends')
              .insert({
                user_id: userId,
                rule_id: rule.id,
                campaign_id: rule.campaign_id,
                scheduled_for: scheduledFor.toISOString(),
                metadata: {
                  trigger_type: triggerType,
                  source,
                  original_trigger_data: body
                }
              })
              .select()
              .single();

            if (scheduleError) {
              console.error(`❌ Error scheduling send:`, scheduleError);
              
              // Log failed scheduling
              await supabase.from('crm_automation_executions').insert({
                rule_id: rule.id,
                user_id: userId,
                trigger_type: triggerType,
                campaign_sent: false,
                campaign_id: rule.campaign_id,
                send_status: 'schedule_failed',
                error_message: scheduleError.message,
                metadata: { source }
              });
            } else {
              console.log(`✅ Campaign scheduled for ${scheduledFor.toISOString()}`);
              scheduledSends.push({
                userId,
                campaignId: rule.campaign_id,
                sendAt: scheduledFor.toISOString(),
                scheduledSendId: scheduledSend.id
              });

              // Log execution
              await supabase.from('crm_automation_executions').insert({
                rule_id: rule.id,
                user_id: userId,
                trigger_type: triggerType,
                campaign_sent: false,
                campaign_id: rule.campaign_id,
                send_status: 'scheduled',
                delay_applied_minutes: rule.delay_minutes,
                scheduled_send_id: scheduledSend.id,
                metadata: { source, scheduled_for: scheduledFor.toISOString() }
              });
            }
          } else {
            // Send immediately
            console.log(`📤 Triggering immediate campaign send: ${rule.campaign.campaign_name}`);
            const { error: sendError } = await supabase.functions.invoke('send-lifecycle-campaign', {
              body: {
                campaignId: rule.campaign_id,
                specificUserId: userId,
                source: `lifecycle-automation-${source}`
              }
            });

            if (sendError) {
              console.error(`❌ Error sending campaign:`, sendError);
              
              // Log failed execution
              await supabase.from('crm_automation_executions').insert({
                rule_id: rule.id,
                user_id: userId,
                trigger_type: triggerType,
                campaign_sent: false,
                campaign_id: rule.campaign_id,
                send_status: 'failed',
                channels: rule.campaign.channels || [],
                error_message: sendError.message,
                metadata: { source }
              });
            } else {
              console.log(`✅ Campaign sent successfully`);
              
              // Log successful execution
              await supabase.from('crm_automation_executions').insert({
                rule_id: rule.id,
                user_id: userId,
                trigger_type: triggerType,
                campaign_sent: true,
                campaign_id: rule.campaign_id,
                send_status: 'sent',
                channels: rule.campaign.channels || [],
                metadata: { source }
              });
            }
          }
        } else {
          console.log(`⚠️ Rule has no campaign configured, skipping send`);
          
          // Log execution without campaign
          await supabase.from('crm_automation_executions').insert({
            rule_id: rule.id,
            user_id: userId,
            trigger_type: triggerType,
            campaign_sent: false,
            send_status: 'no_campaign',
            metadata: { source }
          });
        }
      } else {
        console.log(`⏭️ Rule "${rule.rule_name}" does not match conditions`);
      }
    }

    console.log(`✅ Automation complete: ${triggeredRules.length} rules triggered, ${scheduledSends.length} scheduled`);

    // ============================================================================
    // AUTO-TRIGGER SEQUENCES (SOTA Oct 2025 - Priority 2)
    // Source: HubSpot Workflows Automation Guide 2025
    // Reference: Marketo Engagement Programs Best Practices
    // ============================================================================
    const triggeredSequences = [];
    
    // Vérifier si l'utilisateur doit entrer dans une séquence automatique
    const { data: autoSequences, error: seqError } = await supabase
      .from('crm_campaign_sequences')
      .select('*, crm_sequence_steps(*)')
      .eq('is_active', true)
      .eq('trigger_type', triggerType);

    if (!seqError && autoSequences && autoSequences.length > 0) {
      console.log(`🔄 Found ${autoSequences.length} sequences to auto-trigger for ${triggerType}`);
      
      for (const sequence of autoSequences) {
        try {
          // Vérifier si l'utilisateur correspond au segment
          if (sequence.target_segment_id) {
            const { data: inSegment } = await supabase
              .from('crm_user_segment_memberships')
              .select('user_id')
              .eq('segment_id', sequence.target_segment_id)
              .eq('user_id', userId)
              .maybeSingle();

            if (!inSegment) {
              console.log(`⏭️ User ${userId} not in target segment ${sequence.target_segment_id}`);
              continue;
            }
          }

          // Exécuter la séquence
          console.log(`🚀 Auto-triggering sequence: ${sequence.sequence_name}`);
          const { data: executeResult, error: executeError } = await supabase.functions.invoke(
            'execute-sequence',
            {
              body: { sequenceId: sequence.id, userId }
            }
          );

          if (executeError) {
            console.error(`❌ Failed to trigger sequence ${sequence.id}:`, executeError);
            continue;
          }

          triggeredSequences.push({
            sequence_id: sequence.id,
            sequence_name: sequence.sequence_name,
            steps_scheduled: sequence.crm_sequence_steps?.length || 0
          });

          console.log(`✅ Auto-triggered sequence ${sequence.sequence_name} for user ${userId}`);
        } catch (error) {
          console.error(`❌ Error triggering sequence ${sequence.id}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        triggeredRulesCount: triggeredRules.length,
        triggeredRules,
        scheduledSends,
        sequencesTriggered: triggeredSequences.length,
        triggeredSequences
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in lifecycle-automations:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)), success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});