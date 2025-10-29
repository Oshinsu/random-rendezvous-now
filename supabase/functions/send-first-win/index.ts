/**
 * PHASE 3.2: FIRST WIN CELEBRATION NOTIFICATION
 * 
 * Edge Function to send celebration notification after user's first completed outing
 * Triggered automatically when user completes their 1st group
 * 
 * Research SOTA 2025: Milestone celebrations = +28% retention, +40% 2nd action completion
 * Source: Reforge, MoEngage lifecycle best practices October 2025
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎊 [FIRST WIN] Starting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id and bar_name from request
    const { user_id, bar_name } = await req.json();

    if (!user_id || !bar_name) {
      throw new Error('Missing user_id or bar_name in request body');
    }

    console.log(`🎉 Sending first win notification to user: ${user_id}`);

    // Verify this is indeed their first outing
    const { count, error: countError } = await supabase
      .from('user_outings_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (countError) {
      throw new Error(`Failed to count outings: ${countError.message}`);
    }

    if (count !== 1) {
      console.log(`⚠️ User has ${count} outings, not their first. Skipping.`);
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'Not first outing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for first_name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    const firstName = profile.first_name || 'toi';

    // Gen Z Random tone: "🎊 GG ! T'as déblocqué : Aventurier·e"
    const title = '🎊 GG ! T\'as déblocqué : Aventurier·e';
    const body = `Ta première sortie au ${bar_name} était ouf ? Partage ton expérience pour gagner des crédits ! 🌟`;

    // Call send-push-notification edge function
    const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_ids: [user_id],
        title,
        body,
        type: 'first_win',
        action_url: `${supabaseUrl.replace('.supabase.co', '.app')}/groups?share=true`,
        image: `${supabaseUrl.replace('.supabase.co', '.app')}/notif-first-win.png`,
        icon: `${supabaseUrl.replace('.supabase.co', '.app')}/notification-icon.png`,
        actions: [
          { action: 'share', title: 'Partager mon expérience' },
          { action: 'close', title: 'Plus tard' },
        ],
        data: {
          type: 'first_win',
          user_id,
          bar_name,
        },
      },
    });

    if (sendError) {
      throw new Error(`Failed to send first win notification: ${sendError.message}`);
    }

    console.log('✅ First win notification sent successfully');

    return new Response(
      JSON.stringify({
        status: 'success',
        user_id,
        bar_name,
        notification_sent: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
