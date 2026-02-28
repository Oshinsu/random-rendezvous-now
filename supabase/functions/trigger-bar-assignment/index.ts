import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 [TRIGGER-BAR-ASSIGNMENT] Request received');
    
    const { group_id } = await req.json();
    
    if (!group_id) {
      console.error('❌ Missing group_id');
      return new Response(
        JSON.stringify({ error: 'Missing group_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📍 [TRIGGER-BAR-ASSIGNMENT] Processing group: ${group_id}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch group data including status and participant count
    const { data: groupData, error: fetchError } = await supabase
      .from('groups')
      .select('latitude, longitude, bar_place_id, status, current_participants, max_participants')
      .eq('id', group_id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching group:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Group not found', details: fetchError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (groupData.bar_place_id) {
      console.log('⏭️ Bar already assigned, skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'Bar already assigned' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Guard: only assign bar when group is confirmed and full
    if (groupData.status !== 'confirmed') {
      console.log(`⏭️ Group status is '${groupData.status}', skipping bar assignment`);
      return new Response(
        JSON.stringify({ success: true, message: `Group not confirmed (status: ${groupData.status})` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((groupData.current_participants ?? 0) < (groupData.max_participants ?? 5)) {
      console.log(`⏭️ Group not full (${groupData.current_participants}/${groupData.max_participants}), skipping`);
      return new Response(
        JSON.stringify({ success: true, message: 'Group not full yet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!groupData.latitude || !groupData.longitude) {
      console.error('❌ Missing coordinates');
      return new Response(
        JSON.stringify({ error: 'Missing coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🚀 [TRIGGER-BAR-ASSIGNMENT] Invoking simple-auto-assign-bar for group ${group_id}`);

    // Call the bar assignment function
    const { data, error } = await supabase.functions.invoke('simple-auto-assign-bar', {
      body: {
        group_id,
        latitude: groupData.latitude,
        longitude: groupData.longitude
      }
    });

    if (error) {
      console.error('❌ Error calling simple-auto-assign-bar:', error);
      return new Response(
        JSON.stringify({ error: 'Bar assignment failed', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [TRIGGER-BAR-ASSIGNMENT] Bar assigned successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [TRIGGER-BAR-ASSIGNMENT] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
