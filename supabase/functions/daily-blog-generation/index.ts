import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno Cron: Execute every day at 9:00 AM Paris time
Deno.cron("daily_blog_generation", "0 9 * * *", async () => {
  console.log("🤖 [CRON] Daily blog generation triggered at", new Date().toISOString());
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Check if schedule is active and due
    const { data: schedule, error: scheduleError } = await supabase
      .from('blog_generation_schedule')
      .select('*')
      .single();

    if (scheduleError) {
      console.error("❌ [CRON] Error fetching schedule:", scheduleError);
      return;
    }

    if (!schedule.is_active) {
      console.log("⏸️ [CRON] Schedule is inactive, skipping generation");
      return;
    }

    const now = new Date();
    const nextGen = schedule.next_generation_at ? new Date(schedule.next_generation_at) : null;

    if (nextGen && nextGen > now) {
      console.log("⏰ [CRON] Not due yet. Next generation at:", nextGen.toISOString());
      return;
    }

    console.log("✅ [CRON] Schedule is active and due. Invoking generate-seo-article...");

    // Invoke the article generation function
    const { data, error } = await supabase.functions.invoke('generate-seo-article');

    if (error) {
      console.error("❌ [CRON] Error invoking generate-seo-article:", error);
      return;
    }

    console.log("🎉 [CRON] Article generated successfully:", data);

  } catch (error) {
    console.error("💥 [CRON] Unexpected error in daily blog generation:", error);
  }
});

// HTTP handler for manual triggers or health checks
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log("📞 [HTTP] Manual blog generation triggered");

    // Check schedule
    const { data: schedule } = await supabase
      .from('blog_generation_schedule')
      .select('*')
      .single();

    if (!schedule?.is_active) {
      return new Response(
        JSON.stringify({ error: 'Blog generation schedule is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invoke generation
    const { data, error } = await supabase.functions.invoke('generate-seo-article');

    if (error) {
      console.error("❌ [HTTP] Error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("💥 [HTTP] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
