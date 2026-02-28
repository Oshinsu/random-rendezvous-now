import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Unschedule the CRON job
    const { error: cronError } = await supabase.rpc('unschedule_campaign_queue_cron');
    if (cronError) {
      console.log('⚠️ CRON unschedule warning:', cronError);
    } else {
      console.log('✅ CRON job unscheduled');
    }

    // 2. Pause all sending queues
    const { error: updateError } = await supabase
      .from('campaign_email_queue')
      .update({ status: 'paused' })
      .eq('status', 'sending');

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Campaign queue paused successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Queue paused successfully' 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error pausing queue:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
