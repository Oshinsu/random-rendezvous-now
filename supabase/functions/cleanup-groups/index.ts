import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 [CLEANUP] Starting cleanup-groups edge function');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Record<string, unknown> = {
      invoked_at: new Date().toISOString(),
    };

    // 1) Transition confirmed groups to completed (45min window)
    {
      const { data, error } = await supabase.rpc('transition_groups_to_completed');
      if (error) {
        console.error('❌ [CLEANUP] transition_groups_to_completed error:', error.message);
        results.transition_error = error.message;
      } else {
        console.log('✅ [CLEANUP] transition_groups_to_completed completed');
        results.transition_result = data ?? null;
      }
    }

    // 2) Activate scheduled groups that are due
    {
      const { data, error } = await supabase.rpc('activate_ready_scheduled_groups');
      if (error) {
        console.error('❌ [CLEANUP] activate_ready_scheduled_groups error:', error.message);
        results.activate_error = error.message;
      } else {
        console.log(`✅ [CLEANUP] Activated ${data || 0} scheduled groups`);
        results.activated_groups = data || 0;
      }
    }

    // 3) Repair missing outings history
    {
      const { data, error } = await supabase.rpc('repair_missing_outings_history');
      if (error) {
        console.error('❌ [CLEANUP] repair_missing_outings_history error:', error.message);
        results.repair_error = error.message;
      } else {
        console.log(`✅ [CLEANUP] Repaired ${data || 0} missing outings history rows`);
        results.repair_count = data || 0;
      }
    }

    // 4) Perform safe dissolve/cleanup (participants, empty groups, counters, etc.)
    {
      const { data, error } = await supabase.rpc('dissolve_old_groups');
      if (error) {
        console.error('❌ [CLEANUP] dissolve_old_groups error:', error.message);
        results.dissolve_error = error.message;
      } else {
        console.log('✅ [CLEANUP] dissolve_old_groups executed successfully');
        results.dissolve_result = data ?? null;
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ [CLEANUP] Unexpected error:', error?.message || error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
