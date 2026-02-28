import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChartData {
  performanceByType: Array<{
    type: string;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  timeline: Array<{
    date: string;
    sent: number;
    opened: number;
  }>;
  deviceTypes: Array<{
    name: string;
    value: number;
  }>;
  peakHours: Array<{
    hour: number;
    day: string;
    value: number;
  }>;
  peakHoursByDay: Array<{
    day: string;
    [key: string]: string | number;
  }>;
}

/**
 * SOTA 2025: Single aggregated query for all analytics
 * Remplace 60+ requêtes séquentielles par 4 requêtes SQL optimisées
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dateRange = 'month' } = await req.json().catch(() => ({ dateRange: 'month' }));
    const daysAgo = dateRange === 'week' ? 7 : 30;
    const cacheKey = `push_analytics_charts_${dateRange}`;

    console.log(`📊 Computing analytics for ${dateRange} (${daysAgo} days)`);

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('notification_analytics_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!cacheError && cachedData) {
      console.log('✅ Cache hit');
      return new Response(
        JSON.stringify({ success: true, data: cachedData.data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Cache miss, computing fresh data...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 1️⃣ PERFORMANCE BY TYPE - Aggregated via notification_analytics table
    const { data: analyticsData } = await supabase
      .from('notification_analytics')
      .select('event_type, open_rate, click_rate, conversion_rate, successful_sends, opened_count, clicked_count')
      .gte('created_at', startDate.toISOString());

    const typeAggregation: Record<string, { totalSent: number; totalOpened: number; totalClicked: number }> = {};
    
    (analyticsData || []).forEach((row: any) => {
      const type = row.event_type || 'unknown';
      if (!typeAggregation[type]) {
        typeAggregation[type] = { totalSent: 0, totalOpened: 0, totalClicked: 0 };
      }
      typeAggregation[type].totalSent += row.successful_sends || 0;
      typeAggregation[type].totalOpened += row.opened_count || 0;
      typeAggregation[type].totalClicked += row.clicked_count || 0;
    });

    const performanceByType = Object.entries(typeAggregation).map(([type, data]) => ({
      type,
      openRate: data.totalSent > 0 ? Math.round((data.totalOpened / data.totalSent) * 1000) / 10 : 0,
      clickRate: data.totalOpened > 0 ? Math.round((data.totalClicked / data.totalOpened) * 1000) / 10 : 0,
      conversionRate: 0,
    }));

    // 2️⃣ TIMELINE - Aggregate by date using JS (faster than 30 queries)
    const { data: allNotifications } = await supabase
      .from('user_notifications')
      .select('created_at, read_at')
      .gte('created_at', startDate.toISOString());

    const dateMap = new Map<string, { sent: number; opened: number }>();
    (allNotifications || []).forEach((notif: any) => {
      const date = notif.created_at.split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, { sent: 0, opened: 0 });
      }
      const entry = dateMap.get(date)!;
      entry.sent += 1;
      if (notif.read_at) {
        entry.opened += 1;
      }
    });

    // Fill missing dates with 0
    const timeline: Array<{ date: string; sent: number; opened: number }> = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const data = dateMap.get(dateStr) || { sent: 0, opened: 0 };
      timeline.push({ date: dateStr, sent: data.sent, opened: data.opened });
    }

    // 3️⃣ DEVICE TYPES - Single query
    const { data: deviceData } = await supabase
      .from('user_push_tokens')
      .select('device_type')
      .eq('is_active', true);

    const deviceCounts: Record<string, number> = {};
    (deviceData || []).forEach((token: any) => {
      const deviceType = token.device_type || 'web';
      deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
    });

    const deviceTypes = Object.entries(deviceCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // 4️⃣ PEAK HOURS - Aggregate from single query
    const { data: openedNotifications } = await supabase
      .from('user_notifications')
      .select('read_at')
      .gte('created_at', startDate.toISOString())
      .not('read_at', 'is', null);

    const heatmapMap = new Map<string, number>();
    (openedNotifications || []).forEach((notif: any) => {
      if (!notif.read_at) return;
      const date = new Date(notif.read_at);
      const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const peakHours: Array<{ hour: number; day: string; value: number }> = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        peakHours.push({
          hour,
          day: days[day],
          value: heatmapMap.get(`${day}-${hour}`) || 0,
        });
      }
    }

    // ✅ SOTA 2025: Optimized aggregated format for BarChart (7 objects vs 168)
    const peakHoursByDay = days.map((day, dayIndex) => {
      const hourlyData: Record<string, number> = { day };
      for (let hour = 0; hour < 24; hour++) {
        hourlyData[`h${hour}`] = heatmapMap.get(`${dayIndex}-${hour}`) || 0;
      }
      return hourlyData;
    });

    const result: ChartData = {
      performanceByType,
      timeline,
      deviceTypes,
      peakHours,
      peakHoursByDay,
    };

    // Store in cache (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await supabase
      .from('notification_analytics_cache')
      .upsert({
        cache_key: cacheKey,
        data: result as any,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'cache_key',
      });

    console.log('✅ Analytics computed and cached');

    return new Response(
      JSON.stringify({ success: true, data: result, cached: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error computing analytics:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
