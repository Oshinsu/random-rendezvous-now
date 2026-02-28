import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TimelineData {
  time_bucket: string;
  groups_created: number;
  groups_confirmed: number;
  groups_completed: number;
  avg_participants: number;
  avg_hours_to_confirm: number;
}

interface GeographicData {
  location_name: string;
  group_count: number;
  avg_participants: number;
  success_count: number;
  success_rate: number;
  unique_bars: number;
  avg_latitude: number;
  avg_longitude: number;
}

interface HeatmapData {
  day_of_week: number;
  hour_of_day: number;
  group_count: number;
  avg_participants: number;
  confirmed_count: number;
  conversion_rate: number;
}

interface FunnelData {
  stage: string;
  stage_order: number;
  count: number;
  avg_hours_in_stage: number;
  previous_count: number;
  drop_off_rate: number;
}

interface AdminGroupsAnalytics {
  timeline: TimelineData[];
  geographic: GeographicData[];
  heatmap: HeatmapData[];
  funnel: FunnelData[];
}

export const useAdminGroupsAnalytics = () => {
  // Timeline data (refetch every 2min)
  const { data: timeline, isLoading: timelineLoading, refetch: refetchTimeline } = useQuery({
    queryKey: ['admin-groups-timeline'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_groups_timeline', { days_back: 7 }) as any;
      if (error) throw error;
      return data as TimelineData[];
    },
    refetchInterval: 120000, // was 30s
    staleTime: 60000,
  });

  // Geographic distribution (refetch every 2min)
  const { data: geographic, isLoading: geoLoading, refetch: refetchGeographic } = useQuery({
    queryKey: ['admin-groups-geographic'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_groups_geographic', { top_limit: 20 }) as any;
      if (error) throw error;
      return data as GeographicData[];
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });

  // Temporal heatmap (refetch every 5min)
  const { data: heatmap, isLoading: heatmapLoading, refetch: refetchHeatmap } = useQuery({
    queryKey: ['admin-groups-heatmap'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_groups_heatmap') as any;
      if (error) throw error;
      return data as HeatmapData[];
    },
    refetchInterval: 300000,
    staleTime: 120000,
  });

  // Funnel analysis (refetch every 5min)
  const { data: funnel, isLoading: funnelLoading, refetch: refetchFunnel } = useQuery({
    queryKey: ['admin-groups-funnel'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_groups_funnel') as any;
      if (error) throw error;
      return data as FunnelData[];
    },
    refetchInterval: 300000, // was 60s
    staleTime: 120000,
  });

  const refreshAnalytics = () => {
    refetchTimeline();
    refetchGeographic();
    refetchHeatmap();
    refetchFunnel();
  };

  return {
    analytics: {
      timeline: timeline || [],
      geographic: geographic || [],
      heatmap: heatmap || [],
      funnel: funnel || [],
    } as AdminGroupsAnalytics,
    loading: timelineLoading || geoLoading || heatmapLoading || funnelLoading,
    refreshAnalytics,
  };
};
