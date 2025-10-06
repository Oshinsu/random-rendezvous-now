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
    const { campaign_id, user_id, interaction_type } = await req.json();

    if (!campaign_id || !user_id || !interaction_type) {
      throw new Error('campaign_id, user_id, and interaction_type are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Tracking ${interaction_type} for campaign ${campaign_id}, user ${user_id}`);

    // Update the campaign send record
    const updateData: any = {};
    
    if (interaction_type === 'open') {
      updateData.opened_at = new Date().toISOString();
    } else if (interaction_type === 'click') {
      updateData.clicked_at = new Date().toISOString();
    } else if (interaction_type === 'convert') {
      updateData.converted_at = new Date().toISOString();
    } else if (interaction_type === 'unsubscribe') {
      updateData.unsubscribed = true;
    }

    const { error } = await supabaseClient
      .from('crm_campaign_sends')
      .update(updateData)
      .eq('campaign_id', campaign_id)
      .eq('user_id', user_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in track-campaign-interaction:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
