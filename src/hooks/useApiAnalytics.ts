import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ApiRequest {
  id: string;
  api_name: string;
  endpoint: string;
  request_type: string;
  status_code: number;
  response_time_ms: number;
  cost_usd: number;
  error_message?: string;
  metadata?: any;
  created_at: string;
  user_id?: string;
  group_id?: string;
}

interface ApiStats {
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  errorCount: number;
  errorRate: number;
  dailyRequests: number;
  requestsGrowth: number;
  costBreakdown: {
    search: number;
    details: number;
    photos: number;
  };
}

interface ApiAnalytics {
  requests: ApiRequest[];
  stats: ApiStats;
}

type TimePeriod = 'day' | 'week' | 'month';

export const useApiAnalytics = (period: TimePeriod = 'day') => {
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getDateRange();
      
      // Fetch API requests for the period
      const { data: requests, error: requestsError } = await supabase
        .from('api_requests_log')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(500);

      if (requestsError) throw requestsError;

      // Fetch today's requests for quota tracking
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayRequests, error: todayError } = await supabase
        .from('api_requests_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      if (todayError) throw todayError;

      // Fetch yesterday's requests for growth calculation
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayStart);
      
      const { data: yesterdayRequestsData, error: yesterdayError } = await supabase
        .from('api_requests_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString());

      if (yesterdayError) throw yesterdayError;

      // Calculate statistics
      const totalRequests = requests?.length || 0;
      const totalCost = requests?.reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0;
      const errorCount = requests?.filter(req => req.status_code >= 400).length || 0;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      
      const averageResponseTime = totalRequests > 0 
        ? Math.round((requests?.reduce((sum, req) => sum + (req.response_time_ms || 0), 0) || 0) / totalRequests)
        : 0;

      const dailyRequests = todayRequests?.length || 0;
      const yesterdayRequestsCount = yesterdayRequestsData?.length || 0;
      const requestsGrowth = yesterdayRequestsCount > 0 
        ? Math.round(((dailyRequests - yesterdayRequestsCount) / yesterdayRequestsCount) * 100)
        : 0;

      // Cost breakdown by request type
      const costBreakdown = {
        search: requests?.filter(r => r.request_type === 'search').reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0,
        details: requests?.filter(r => r.request_type === 'details').reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0,
        photos: requests?.filter(r => r.request_type === 'photos').reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0,
      };

      const stats: ApiStats = {
        totalRequests,
        totalCost,
        averageResponseTime,
        errorCount,
        errorRate,
        dailyRequests,
        requestsGrowth,
        costBreakdown
      };

      setAnalytics({
        requests: requests || [],
        stats
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analytics');
      console.error('Error fetching API analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
};