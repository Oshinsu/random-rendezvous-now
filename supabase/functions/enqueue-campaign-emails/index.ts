import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueRequest {
  campaignId: string;
  users: Array<{
    userId: string;
    email: string;
    firstName: string;
  }>;
  campaignData: {
    subject: string;
    content: string;
    channels: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const kv = await Deno.openKv();
    const { campaignId, users, campaignData }: QueueRequest = await req.json();

    console.log(`📥 Queuing ${users.length} emails for campaign ${campaignId}`);

    // Store in KV with 24h TTL
    const queueData = {
      campaignId,
      users,
      campaignData,
      processed: 0,
      total: users.length,
      failed: 0,
      created_at: Date.now(),
      status: 'pending'
    };

    await kv.set(['campaign_queue', campaignId], queueData, { 
      expireIn: 86400000 // 24h TTL
    });

    // Initialize Supabase client for status update
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update campaign status to 'sending'
    await supabase
      .from('crm_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    console.log(`✅ Queued ${users.length} emails for campaign ${campaignId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        queued: users.length,
        campaignId,
        message: `${users.length} emails mis en queue`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error queuing emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
