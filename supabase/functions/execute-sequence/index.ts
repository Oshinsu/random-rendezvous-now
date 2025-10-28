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

    const { sequence_id, user_id } = await req.json();

    // Fetch sequence and steps
    const { data: sequence, error: seqError } = await supabaseClient
      .from('crm_campaign_sequences')
      .select(`
        *,
        steps:crm_campaign_sequence_steps(
          *,
          campaign:crm_campaigns(*)
        )
      `)
      .eq('id', sequence_id)
      .single();

    if (seqError || !sequence) {
      throw new Error('Sequence not found');
    }

    if (!sequence.is_active) {
      throw new Error('Sequence is not active');
    }

    // Sort steps by order
    const steps = (sequence.steps || []).sort((a: any, b: any) => a.step_order - b.step_order);

    if (steps.length === 0) {
      throw new Error('No steps in sequence');
    }

    // Execute steps with cumulative delays
    const results = [];
    let cumulativeDelay = 0;

    for (const step of steps) {
      cumulativeDelay += step.delay_hours;
      
      // Calculate send time
      const sendAt = new Date();
      sendAt.setHours(sendAt.getHours() + cumulativeDelay);

      // Create scheduled campaign send record
      const { data: campaignSend, error: sendError } = await supabaseClient
        .from('crm_campaign_sends')
        .insert({
          campaign_id: step.campaign_id,
          user_id: user_id,
          sent_at: sendAt.toISOString(),
          metadata: {
            sequence_id,
            step_order: step.step_order,
            scheduled: true
          }
        })
        .select()
        .single();

      if (sendError) {
        console.error(`Error scheduling step ${step.step_order}:`, sendError);
        results.push({
          step_order: step.step_order,
          status: 'error',
          error: sendError.message
        });
      } else {
        results.push({
          step_order: step.step_order,
          status: 'scheduled',
          send_at: sendAt.toISOString(),
          campaign_id: step.campaign_id
        });
      }
    }

    return new Response(
      JSON.stringify({
        sequence_id,
        user_id,
        steps_scheduled: results.filter(r => r.status === 'scheduled').length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error executing sequence:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});