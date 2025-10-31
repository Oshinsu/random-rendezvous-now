import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify OAuth token configuration exists
    const { data: tokenData, error: tokenError } = await supabase
      .from('zoho_oauth_tokens')
      .select('access_token, circuit_breaker_until')
      .single();

    if (tokenError || !tokenData) {
      throw new Error('OAuth token not configured. Consultez ZOHO_INTEGRATION.md pour la configuration.');
    }

    // 2. Check circuit breaker
    if (tokenData.circuit_breaker_until) {
      const breakerTime = new Date(tokenData.circuit_breaker_until);
      if (breakerTime.getTime() > Date.now()) {
        const minutesRemaining = Math.ceil((breakerTime.getTime() - Date.now()) / 60000);
        throw new Error(`Circuit breaker actif. Attendez ${minutesRemaining} minutes de plus.`);
      }
    }

    // 3. Resume paused queues
    const { error: updateError } = await supabase
      .from('campaign_email_queue')
      .update({ status: 'pending' })
      .eq('status', 'paused');

    if (updateError) {
      throw updateError;
    }

    // 4. Reschedule CRON job
    const { error: cronError } = await supabase.rpc('schedule_campaign_queue_cron');
    if (cronError) {
      console.error('Error rescheduling CRON:', cronError);
      throw new Error(`Échec de la réactivation du CRON: ${cronError.message}`);
    }

    console.log('✅ Campaign queue resumed and CRON reactivated');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Queue reprise et CRON réactivé' 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error resuming queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
