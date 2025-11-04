import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SOTA 2025: Daily sync edge function
 * Agrège les données de user_notifications vers notification_analytics
 * pour alimenter les dashboards d'analytics en temps réel
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting daily notification analytics sync...');

    // Get yesterday's date range (00:00 to 23:59)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date(yesterday);
    today.setHours(23, 59, 59, 999);

    const startDate = yesterday.toISOString();
    const endDate = today.toISOString();

    console.log(`📅 Processing date range: ${startDate} to ${endDate}`);

    // Get all notification types sent yesterday
    const { data: notificationTypes, error: typesError } = await supabase
      .from('user_notifications')
      .select('type')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (typesError) {
      console.error('❌ Error fetching notification types:', typesError);
      throw typesError;
    }

    const uniqueTypes = [...new Set(notificationTypes?.map((n) => n.type) || [])];
    console.log(`📊 Found ${uniqueTypes.length} notification types to process:`, uniqueTypes);

    let totalProcessed = 0;

    // Process each notification type
    for (const notifType of uniqueTypes) {
      console.log(`\n📈 Processing type: ${notifType}`);

      // Count total sent
      const { count: totalSent, error: sentError } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', notifType)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (sentError) {
        console.error(`❌ Error counting sent for ${notifType}:`, sentError);
        continue;
      }

      // Count opened (read_at IS NOT NULL)
      const { count: totalOpened, error: openedError } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', notifType)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('read_at', 'is', null);

      if (openedError) {
        console.error(`❌ Error counting opened for ${notifType}:`, openedError);
        continue;
      }

      // Calculate open rate
      const openRate = totalSent && totalSent > 0 ? (totalOpened || 0) / totalSent * 100 : 0;

      console.log(`  ✅ Sent: ${totalSent}, Opened: ${totalOpened}, Open Rate: ${openRate.toFixed(2)}%`);

      // Insert or update analytics record
      const { error: upsertError } = await supabase
        .from('notification_analytics')
        .upsert({
          notification_type: notifType,
          event_type: notifType,
          successful_sends: totalSent || 0,
          opened_count: totalOpened || 0,
          open_rate: Math.round(openRate * 10) / 10, // Round to 1 decimal
          clicked_count: 0, // Will be populated by track_notification_click
          converted_count: 0, // Will be populated by track_notification_conversion
          click_rate: 0,
          conversion_rate: 0,
          created_at: startDate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'notification_type,created_at',
        });

      if (upsertError) {
        console.error(`❌ Error upserting analytics for ${notifType}:`, upsertError);
      } else {
        totalProcessed++;
        console.log(`  ✅ Analytics record created/updated for ${notifType}`);
      }
    }

    console.log(`\n🎉 Sync complete! Processed ${totalProcessed}/${uniqueTypes.length} notification types`);

    // Invalidate analytics cache to force refresh
    console.log('🗑️ Invalidating analytics cache...');
    const { error: cacheDeleteError } = await supabase
      .from('notification_analytics_cache')
      .delete()
      .like('cache_key', 'push_analytics_charts_%');

    if (cacheDeleteError) {
      console.error('⚠️ Failed to invalidate cache:', cacheDeleteError);
    } else {
      console.log('✅ Analytics cache invalidated');
    }

    // Cleanup expired cache entries
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_analytics_cache');
    if (!cleanupError) {
      console.log('✅ Expired cache entries cleaned up');
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        total: uniqueTypes.length,
        dateRange: { start: startDate, end: endDate },
        cacheInvalidated: !cacheDeleteError,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fatal error in sync-notification-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
