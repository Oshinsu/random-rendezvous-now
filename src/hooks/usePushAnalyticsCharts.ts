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
      console.log(`📊 Fetching analytics for ${dateRange}...`);
      
      // ✅ SOTA 2025: Single edge function call instead of 60+ sequential queries
      const { data, error } = await supabase.functions.invoke('get-notification-analytics', {
        body: { dateRange },
      });

      if (error) {
        console.error('❌ Failed to fetch analytics:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ Analytics request failed:', data.error);
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      console.log(data.cached ? '✅ Using cached data' : '✅ Fresh data computed');
      return data.data as ChartData;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 60000, // Consider data fresh for 1 minute
    retry: 2,
  });
};
