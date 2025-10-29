/**
 * PHASE 3.1: WELCOME FUN NOTIFICATION
 * 
 * Edge Function to send welcome notification to new users (J0)
 * Triggered via webhook after user signup
 * 
 * Research SOTA 2025: Welcome notification within 5 minutes = +45% first action completion
 * Source: MoEngage, Braze lifecycle best practices October 2025
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
    console.log('👋 [WELCOME FUN] Starting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id from request
    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('Missing user_id in request body');
    }

    console.log(`👤 Sending welcome notification to user: ${user_id}`);

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

    // Gen Z Random tone: "Bienvenue dans la Random fam ! 🎲✨"
    const title = 'Bienvenue dans la Random fam ! 🎲✨';
    const body = `Salut ${firstName}, t'es prêt·e pour ta première aventure ? Crée ton groupe en 30 secondes 🚀`;

    // Call send-push-notification edge function
    const { data, error: sendError } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_ids: [user_id],
        title,
        body,
        type: 'welcome_fun',
        action_url: `${supabaseUrl.replace('.supabase.co', '.app')}/dashboard`,
        image: `${supabaseUrl.replace('.supabase.co', '.app')}/notif-welcome.png`,
        icon: `${supabaseUrl.replace('.supabase.co', '.app')}/notification-icon.png`,
        data: {
          type: 'welcome_fun',
          user_id,
        },
      },
    });

    if (sendError) {
      throw new Error(`Failed to send welcome notification: ${sendError.message}`);
    }

    console.log('✅ Welcome notification sent successfully');

    return new Response(
      JSON.stringify({
        status: 'success',
        user_id,
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
