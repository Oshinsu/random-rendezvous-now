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
      const { data: tokensData } = await supabase
        .from('user_push_tokens')
        .select('device_type')
        .eq('active', true);

      const deviceCounts: Record<string, number> = {};
      tokensData?.forEach((token) => {
        const deviceType = token.device_type || 'web';
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      });

      const deviceTypes = Object.entries(deviceCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // 4. Peak Hours Heatmap (simplified - generate sample data for demo)
      const peakHours: Array<{ hour: number; day: string; value: number }> = [];
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      
      // Generate heatmap data based on typical patterns
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          // Peak hours: Thursday-Saturday 18-22h
          let baseValue = 5;
          if (day >= 3 && day <= 5 && hour >= 18 && hour <= 22) {
            baseValue = 50 + Math.random() * 30;
          } else if (hour >= 18 && hour <= 22) {
            baseValue = 20 + Math.random() * 15;
          } else {
            baseValue = Math.random() * 10;
          }
          
          peakHours.push({
            hour,
            day: days[day],
            value: Math.round(baseValue),
          });
        }
      }

      return {
        performanceByType,
        timeline,
        deviceTypes,
        peakHours,
      };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};
