import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, users, campaignData }: QueueRequest = await req.json();

    console.log(`📥 Queuing ${users.length} emails for campaign ${campaignId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store in database with 24h expiry
    const { data: queueData, error: queueError } = await supabase
      .from('campaign_email_queue')
      .insert({
        campaign_id: campaignId,
        users: users,
        campaign_data: campaignData,
        processed: 0,
        total: users.length,
        failed: 0,
        status: 'pending'
      })
      .select()
      .single();

    if (queueError) {
      console.error('❌ Error creating queue:', queueError);
      throw queueError;
    }

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
        queueId: queueData.id,
        message: `${users.length} emails mis en queue`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error queuing emails:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
