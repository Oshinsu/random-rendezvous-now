/**
 * PHASE 3.3: PEAK HOURS FOMO NOTIFICATION
 * 
 * Edge Function to send FOMO notifications during peak hours (Thu-Sat, 18h-20h)
 * Triggers users who haven't created a group in 7+ days
 * 
 * Research SOTA 2025: FOMO notifications during peak hours = +35% group creation rate
 * Source: Braze, MoEngage best practices October 2025
 * 
 * Schedule: Runs every hour Thu-Sat 18h-20h via cron job
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔥 [PEAK HOURS FOMO] Starting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if it's peak hours
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sunday, 4=Thursday, 5=Friday, 6=Saturday
    const hour = now.getUTCHours() + 1; // Adjust for Paris timezone (UTC+1)

    // Only run Thursday-Saturday, 18h-20h
    if (![4, 5, 6].includes(day) || hour < 18 || hour > 20) {
      console.log(`⏰ Not peak hours (Day: ${day}, Hour: ${hour}). Skipping.`);
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'Not peak hours' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Peak hours detected (Day: ${day}, Hour: ${hour})`);

    // Step 1: Get active groups count for FOMO data
    const { count: activeGroupsCount, error: countError } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting')
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 min

    if (countError) {
      throw new Error(`Failed to count active groups: ${countError.message}`);
    }

    console.log(`📊 ${activeGroupsCount} active groups in last 30 minutes`);

    // Step 2: Find eligible users (inactive 7+ days, push enabled)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: eligibleUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, email')
      .lt('updated_at', sevenDaysAgo) // Haven't updated profile in 7 days (proxy for activity)
      .limit(100); // Max 100 per run to avoid rate limiting

    if (usersError) {
      throw new Error(`Failed to fetch eligible users: ${usersError.message}`);
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('⚠️ No eligible users found');
      return new Response(
        JSON.stringify({ status: 'success', sent: 0, reason: 'No eligible users' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 Found ${eligibleUsers.length} eligible users`);

    // Step 3: Filter users who haven't received this notification in LAST 7 DAYS
    // ✅ SOTA 2025: Frequency Capping (max 1 fois par semaine)
    const { data: recentNotifs, error: notifsError } = await supabase
      .from('notification_throttle')
      .select('user_id')
      .in('user_id', eligibleUsers.map(u => u.id))
      .eq('notification_type', 'peak_hours_fomo')
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // ✅ 7 jours au lieu de 24h

    const alreadyNotifiedIds = new Set(recentNotifs?.map(n => n.user_id) || []);
    let usersToNotify = eligibleUsers.filter(u => !alreadyNotifiedIds.has(u.id));

    console.log(`📤 Sending to ${usersToNotify.length} users (${alreadyNotifiedIds.size} already notified this week)`);

    // ✅ NOUVEAU: Step 3.5 - Filter by IDF location (Contextual Relevance)
    const IDF_BOUNDS = {
      lat_min: 48.1, lat_max: 49.2,
      lng_min: 1.4, lng_max: 3.5,
    };

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, location_lat, location_lng')
      .in('id', usersToNotify.map(u => u.id));

    if (profiles) {
      const idfUserIds = new Set(
        profiles.filter(p => 
          p.location_lat >= IDF_BOUNDS.lat_min &&
          p.location_lat <= IDF_BOUNDS.lat_max &&
          p.location_lng >= IDF_BOUNDS.lng_min &&
          p.location_lng <= IDF_BOUNDS.lng_max
        ).map(p => p.id)
      );

      usersToNotify = usersToNotify.filter(u => idfUserIds.has(u.id));
      console.log(`📍 ${usersToNotify.length} users in IDF (${profiles.length - idfUserIds.size} outside IDF filtered)`);
    }

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ status: 'success', sent: 0, reason: 'No users in IDF or already notified this week' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Send FOMO notifications
    let successCount = 0;

    for (const user of usersToNotify) {
      try {
        // Gen Z Random tone: "🔥 {{active_count}} groupes actifs RN !"
        const title = activeGroupsCount && activeGroupsCount > 0
          ? `🔥 ${activeGroupsCount} groupes actifs RN !`
          : `🔥 Ça bouge grave ce soir !`;

        const body = `Yo ${user.first_name || 'toi'}, c'est le moment parfait pour sortir — crée ton groupe 🍹`;

        // Call send-push-notification edge function
        const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            user_ids: [user.id],
            title,
            body,
            type: 'peak_hours_fomo',
            action_url: `${supabaseUrl.replace('.supabase.co', '.app')}/dashboard`,
            image: `${supabaseUrl.replace('.supabase.co', '.app')}/notif-fomo-peak.png`,
            icon: `${supabaseUrl.replace('.supabase.co', '.app')}/notification-icon.png`,
            data: {
              type: 'peak_hours_fomo',
              active_groups_count: activeGroupsCount || 0,
              timestamp: now.toISOString(),
            },
          },
        });

        if (sendError) {
          console.error(`❌ Failed to send to ${user.email}:`, sendError);
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error sending to ${user.email}:`, error);
      }
    }

    console.log(`✅ FOMO notifications sent: ${successCount}/${usersToNotify.length}`);

    return new Response(
      JSON.stringify({
        status: 'success',
        sent: successCount,
        eligible_users: usersToNotify.length,
        active_groups: activeGroupsCount || 0,
        peak_hour: hour,
        day_of_week: day,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
