import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read all campaign queues (not expired)
    const { data: queues, error } = await supabase
      .from('campaign_email_queue')
      .select('id, campaign_id, processed, total, failed, status, created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching queues:', error);
      throw error;
    }

    // Format response to match hook expectations
    const formattedQueues = (queues || []).map(q => ({
      campaignId: q.campaign_id,
      processed: q.processed,
      total: q.total,
      failed: q.failed,
      status: q.status,
      created_at: new Date(q.created_at).getTime()
    }));

    return new Response(
      JSON.stringify({ queues: formattedQueues }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error reading queues:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
