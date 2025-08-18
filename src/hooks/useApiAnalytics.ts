import { useState, useEffect } from 'react';

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
      
      // Create representative mock data based on Edge Function activity
      // This simulates what would be found in the function_edge_logs analytics
      const mockRequests: ApiRequest[] = [
        {
          id: '1',
          api_name: 'simple-bar-search',
          endpoint: '/functions/v1/simple-bar-search',
          request_type: 'search',
          status_code: 200,
          response_time_ms: 850,
          cost_usd: 0.017,
          created_at: new Date().toISOString(),
        },
        {
          id: '2', 
          api_name: 'simple-auto-assign-bar',
          endpoint: '/functions/v1/simple-auto-assign-bar',
          request_type: 'assignment',
          status_code: 200,
          response_time_ms: 1200,
          cost_usd: 0.017,
          created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        },
        {
          id: '3',
          api_name: 'simple-bar-search',
          endpoint: '/functions/v1/simple-bar-search',
          request_type: 'search',
          status_code: 200,
          response_time_ms: 720,
          cost_usd: 0.017,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1h ago
        },
        {
          id: '4',
          api_name: 'simple-auto-assign-bar',
          endpoint: '/functions/v1/simple-auto-assign-bar',
          request_type: 'assignment',
          status_code: 500,
          response_time_ms: 2400,
          cost_usd: 0.0,
          error_message: 'Internal server error',
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2h ago
        }
      ];
      
      // Filter based on period
      const { startDate } = getDateRange();
      const startTime = new Date(startDate).getTime();
      const requests = mockRequests.filter(r => new Date(r.created_at).getTime() >= startTime);
      
      // Get today's data
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayRequests = requests.filter(r => new Date(r.created_at) >= todayStart);
      
      // Get yesterday's data  
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayStart);
      const yesterdayRequests = requests.filter(r => {
        const date = new Date(r.created_at);
        return date >= yesterdayStart && date < yesterdayEnd;
      });

      // Calculate statistics
      const totalRequests = requests?.length || 0;
      const totalCost = requests?.reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0;
      const errorCount = requests?.filter(req => req.status_code >= 400).length || 0;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      
      const averageResponseTime = totalRequests > 0 
        ? Math.round((requests?.reduce((sum, req) => sum + (req.response_time_ms || 0), 0) || 0) / totalRequests)
        : 0;

      const dailyRequests = todayRequests?.length || 0;
      const yesterdayRequestsCount = yesterdayRequests?.length || 0;
      const requestsGrowth = yesterdayRequestsCount > 0 
        ? Math.round(((dailyRequests - yesterdayRequestsCount) / yesterdayRequestsCount) * 100)
        : dailyRequests > 0 ? 100 : 0;

      // Cost breakdown by request type
      const costBreakdown = {
        search: requests?.filter(r => r.request_type === 'search').reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0,
        details: requests?.filter(r => r.request_type === 'assignment').reduce((sum, req) => sum + (req.cost_usd || 0), 0) || 0,
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