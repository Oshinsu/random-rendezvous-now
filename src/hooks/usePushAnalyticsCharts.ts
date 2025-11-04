import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChartData {
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
}

export const usePushAnalyticsCharts = (dateRange: 'week' | 'month' = 'month') => {
  return useQuery({
    queryKey: ['push-analytics-charts', dateRange],
    queryFn: async (): Promise<ChartData> => {
      const cacheKey = `push_analytics_charts_${dateRange}`;
      
      // 1. Check cache first (SOTA 2025: Performance optimization)
      const { data: cachedData, error: cacheError } = await supabase
        .from('notification_analytics_cache')
        .select('data, expires_at')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!cacheError && cachedData) {
        console.log('✅ Using cached analytics data for', dateRange);
        return cachedData.data as unknown as ChartData;
      }

      console.log('🔄 Cache miss, computing fresh analytics for', dateRange);
      
      const daysAgo = dateRange === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // 1. Performance by Type (using event_type and joining with user_notifications)
      const { data: analyticsData } = await supabase
        .from('notification_analytics')
        .select('event_type, open_rate, click_rate, conversion_rate')
        .gte('created_at', startDate.toISOString());

      const typeAggregation: Record<string, { openSum: number; clickSum: number; conversionSum: number; count: number }> = {};
      
      analyticsData?.forEach((row) => {
        const type = row.event_type || 'unknown';
        if (!typeAggregation[type]) {
          typeAggregation[type] = { openSum: 0, clickSum: 0, conversionSum: 0, count: 0 };
        }
        typeAggregation[type].openSum += row.open_rate || 0;
        typeAggregation[type].clickSum += row.click_rate || 0;
        typeAggregation[type].conversionSum += row.conversion_rate || 0;
        typeAggregation[type].count += 1;
      });

      const performanceByType = Object.entries(typeAggregation).map(([type, data]) => ({
        type,
        openRate: data.count > 0 ? Math.round(data.openSum / data.count * 10) / 10 : 0,
        clickRate: data.count > 0 ? Math.round(data.clickSum / data.count * 10) / 10 : 0,
        conversionRate: data.count > 0 ? Math.round(data.conversionSum / data.count * 10) / 10 : 0,
      }));

      // 2. Timeline (last 30 days)
      const timeline: Array<{ date: string; sent: number; opened: number }> = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Count notifications sent
        const { count: sent } = await supabase
          .from('user_notifications')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', new Date(date.getTime() + 86400000).toISOString());
        
        // Count notifications opened (read_at is not null)
        const { count: opened } = await supabase
          .from('user_notifications')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', new Date(date.getTime() + 86400000).toISOString())
          .not('read_at', 'is', null);
        
        timeline.push({ date: dateStr, sent: sent || 0, opened: opened || 0 });
      }

      // 3. Device Types
      // @ts-ignore TS2589: Supabase type inference issue - See https://github.com/supabase/supabase-js/issues/1372
      const tokensResponse = await supabase
        .from('user_push_tokens')
        .select('device_type')
        .eq('is_active', true);
      
      const tokensData = tokensResponse.data as Array<{ device_type: string | null }> | null;

      const deviceCounts: Record<string, number> = {};
      tokensData?.forEach((token) => {
        const deviceType = token.device_type || 'web';
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      });

      const deviceTypes = Object.entries(deviceCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // 4. Peak Hours Heatmap (based on OPENS, not sends)
      const peakHours: Array<{ hour: number; day: string; value: number }> = [];
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      
      // Fetch all OPENED notifications in range to calculate peak hours
      const { data: notifData } = await supabase
        .from('user_notifications')
        .select('read_at')
        .gte('created_at', startDate.toISOString())
        .not('read_at', 'is', null); // Only opened notifications

      // Aggregate by day of week and hour (using read_at, not created_at)
      const heatmapData: Record<string, number> = {};
      notifData?.forEach((notif) => {
        if (!notif.read_at) return;
        const date = new Date(notif.read_at);
        const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;
        heatmapData[key] = (heatmapData[key] || 0) + 1;
      });

      // Convert to chart format
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          peakHours.push({
            hour,
            day: days[day],
            value: heatmapData[key] || 0,
          });
        }
      }

      const result: ChartData = {
        performanceByType,
        timeline,
        deviceTypes,
        peakHours,
      };

      // 2. Store in cache (expires in 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await supabase
        .from('notification_analytics_cache')
        .upsert({
          cache_key: cacheKey,
          data: result as any,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'cache_key',
        });

      console.log('✅ Analytics cached until', expiresAt.toISOString());

      return result;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 60000, // Consider data fresh for 1 minute
  });
};
