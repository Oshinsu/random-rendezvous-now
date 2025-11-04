import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SOTA 2025: Hourly stats update for notification_types_config
 * Met à jour total_sent_30d, open_rate, last_sent_at pour chaque type
 * pour afficher les vraies metrics dans NotificationControlCenter
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting notification config stats update...');

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    // Get all notification types from config
    const { data: notificationTypes, error: typesError } = await supabase
      .from('notification_types_config')
      .select('type');

    if (typesError) {
      console.error('❌ Error fetching notification types config:', typesError);
      throw typesError;
    }

    console.log(`📊 Processing ${notificationTypes?.length || 0} notification types`);

    let totalUpdated = 0;

    // Process each notification type
    for (const notifTypeConfig of notificationTypes || []) {
      const notifType = notifTypeConfig.type;
      console.log(`\n📈 Processing type: ${notifType}`);

      // Count total sent in last 30 days
      const { count: totalSent30d, error: sentError } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', notifType)
        .gte('created_at', startDate);

      if (sentError) {
        console.error(`❌ Error counting sent for ${notifType}:`, sentError);
        continue;
      }

      // Count opened in last 30 days
      const { count: totalOpened30d, error: openedError } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', notifType)
        .gte('created_at', startDate)
        .not('read_at', 'is', null);

      if (openedError) {
        console.error(`❌ Error counting opened for ${notifType}:`, openedError);
        continue;
      }

      // Calculate open rate
      const openRate = totalSent30d && totalSent30d > 0 ? (totalOpened30d || 0) / totalSent30d * 100 : 0;

      // Get last sent timestamp
      const { data: lastSentData, error: lastSentError } = await supabase
        .from('user_notifications')
        .select('created_at')
        .eq('type', notifType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastSentError && lastSentError.code !== 'PGRST116') {
        console.error(`❌ Error fetching last sent for ${notifType}:`, lastSentError);
      }

      const lastSentAt = lastSentData?.created_at || null;

      console.log(`  ✅ Sent (30d): ${totalSent30d}, Opened (30d): ${totalOpened30d}, Open Rate: ${openRate.toFixed(2)}%, Last Sent: ${lastSentAt || 'Never'}`);

      // Update notification_types_config
      const { error: updateError } = await supabase
        .from('notification_types_config')
        .update({
          total_sent_30d: totalSent30d || 0,
          open_rate: Math.round(openRate * 10) / 10, // Round to 1 decimal
          last_sent_at: lastSentAt,
          updated_at: new Date().toISOString(),
        })
        .eq('type', notifType);

      if (updateError) {
        console.error(`❌ Error updating config for ${notifType}:`, updateError);
      } else {
        totalUpdated++;
        console.log(`  ✅ Config updated for ${notifType}`);
      }
    }

    console.log(`\n🎉 Update complete! Updated ${totalUpdated}/${notificationTypes?.length || 0} notification types`);

    // Invalidate related cache entries
    console.log('🗑️ Invalidating overview stats cache...');
    const { error: cacheDeleteError } = await supabase
      .from('notification_analytics_cache')
      .delete()
      .or('cache_key.like.push_overview_%,cache_key.like.notification_types_%');

    if (!cacheDeleteError) {
      console.log('✅ Overview stats cache invalidated');
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: totalUpdated,
        total: notificationTypes?.length || 0,
        cacheInvalidated: !cacheDeleteError,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fatal error in update-notification-config-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
