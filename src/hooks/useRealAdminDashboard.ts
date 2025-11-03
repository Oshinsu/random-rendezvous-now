import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserGrowth {
  date: string;
  new_users: number;
  total_users: number;
}

interface HourlyActivity {
  hour: string;
  waiting_groups: number;
  confirmed_groups: number;
  completed_groups: number;
  active_users: number;
  avg_group_size: number;
}

interface BarPerformance {
  bar_name: string;
  total_visits: number;
  days_active: number;
  avg_group_size: number;
  last_visit: string;
}

interface ConversionFunnel {
  stage: string;
  stage_order: number;
  count: number;
  conversion_rate: number;
}

interface ApiCosts {
  date: string;
  total_requests: number;
  total_cost: number;
  avg_response_time: number;
  errors: number;
}

export const useRealAdminDashboard = () => {
  // User Growth (7 days)
  const { data: userGrowth, isLoading: loadingGrowth } = useQuery({
    queryKey: ['admin-user-growth'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_growth' as any);
      if (error) throw error;
      return (data || []) as UserGrowth[];
    },
    refetchInterval: 60000,
  });

  // Hourly Activity (24h)
  const { data: hourlyActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['admin-hourly-activity'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_hourly_activity' as any);
      if (error) throw error;
      return (data || []) as HourlyActivity[];
    },
    refetchInterval: 30000,
  });

  // Bar Performance (30 days)
  const { data: barPerformance, isLoading: loadingBars } = useQuery({
    queryKey: ['admin-bar-performance'],
    queryFn: async () => {
      const { data, error} = await supabase.rpc('get_admin_bar_performance' as any);
      if (error) throw error;
      return (data || []) as BarPerformance[];
    },
    refetchInterval: 300000,
  });

  // Conversion Funnel
  const { data: conversionFunnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ['admin-conversion-funnel'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_conversion_funnel' as any);
      if (error) throw error;
      return (data || []) as ConversionFunnel[];
    },
    refetchInterval: 120000,
  });

  // API Costs (7 days)
  const { data: apiCosts, isLoading: loadingCosts } = useQuery({
    queryKey: ['admin-api-costs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_api_costs' as any);
      if (error) throw error;
      return (data || []) as ApiCosts[];
    },
    refetchInterval: 300000,
  });

  // Comprehensive stats (from existing hook)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-comprehensive-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_comprehensive_admin_stats');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Manual refresh function
  const refreshViews = async () => {
    try {
      await supabase.rpc('refresh_admin_dashboard_views' as any);
    } catch (error) {
      console.error('Error refreshing dashboard views:', error);
    }
  };

  return {
    userGrowth: userGrowth || [],
    hourlyActivity: hourlyActivity || [],
    barPerformance: barPerformance || [],
    conversionFunnel: conversionFunnel || [],
    apiCosts: apiCosts || [],
    stats: stats || null,
    isLoading: loadingGrowth || loadingActivity || loadingBars || loadingFunnel || loadingCosts || loadingStats,
    refreshViews,
  };
};
