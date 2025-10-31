import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const kv = await Deno.openKv();
    const queues: any[] = [];

    // Read all campaign queues
    const iterator = kv.list({ prefix: ['campaign_queue'] });
    
    for await (const entry of iterator) {
      const queueData = entry.value as any;
      queues.push({
        campaignId: queueData.campaignId,
        processed: queueData.processed,
        total: queueData.total,
        failed: queueData.failed,
        status: queueData.status,
        created_at: queueData.created_at
      });
    }

    return new Response(
      JSON.stringify({ queues }),
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
