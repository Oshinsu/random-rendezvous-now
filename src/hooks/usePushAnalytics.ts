import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PushAnalyticsData {
  permissionRate: number;
  openRate: number;
  totalSent: number;
  activeTokens: number;
  sparklineData: number[];
  percentChange: number;
}

export const usePushAnalytics = (dateRange: 'week' | 'month' | 'all' = 'month') => {
  return useQuery({
    queryKey: ['push-analytics', dateRange],
    queryFn: async (): Promise<PushAnalyticsData> => {
      const daysAgo = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // 1. Permission Acceptance Rate
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeTokens } = await supabase
        .from('user_push_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const permissionRate = totalUsers ? (activeTokens! / totalUsers) * 100 : 0;

      // 2. Open Rate Average from analytics events
      const { data: analyticsData } = await supabase
        .from('notification_analytics')
        .select('open_rate, opened_count')
        .gte('created_at', startDate.toISOString())
        .not('open_rate', 'is', null);

      const avgOpenRate = analyticsData && analyticsData.length > 0
        ? analyticsData.reduce((sum, row) => sum + (row.open_rate || 0), 0) / analyticsData.length
        : 0;

      // 3. Total Sent (count of user_notifications created)
      const { count: totalSent } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // 4. Sparkline data (last 7 days opened notifications)
      const sparklineData: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const { data } = await supabase
          .from('notification_analytics')
          .select('opened_count')
          .gte('created_at', date.toISOString())
          .lt('created_at', new Date(date.getTime() + 86400000).toISOString());
        
        const dayTotal = data ? data.reduce((sum, row) => sum + (row.opened_count || 0), 0) : 0;
        sparklineData.push(dayTotal);
      }

      // 5. Percent change vs previous period
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - daysAgo);
      
      const { count: previousTotal } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', startDate.toISOString());

      const percentChange = previousTotal && previousTotal > 0
        ? ((totalSent! - previousTotal) / previousTotal) * 100
        : 0;

      return {
        permissionRate: Math.round(permissionRate * 10) / 10,
        openRate: Math.round(avgOpenRate * 10) / 10,
        totalSent: totalSent || 0,
        activeTokens: activeTokens || 0,
        sparklineData,
        percentChange: Math.round(percentChange * 10) / 10,
      };
    },
    refetchInterval: 300000, // Refresh every 5min (was 1min)
  });
};
