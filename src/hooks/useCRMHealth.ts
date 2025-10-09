import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface UserHealth {
  id: string;
  user_id: string;
  health_score: number;
  churn_risk: 'low' | 'medium' | 'high' | 'critical';
  last_activity_at: string;
  total_groups: number;
  total_outings: number;
  days_since_signup: number;
  days_since_last_activity: number;
  avg_days_between_outings: number;
  days_since_last_login: number | null;
  never_logged_in: boolean;
  last_login_at: string | null;
  calculated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useCRMHealth = (
  churnRiskFilter: string | null = null,
  segmentFilter: string | null = null,
  searchQuery: string = '',
  page: number = 1,
  pageSize: number = 50
) => {
  const [healthScores, setHealthScores] = useState<UserHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    avgHealthScore: 0,
    totalUsers: 0,
    criticalRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  });

  const fetchHealthScores = async () => {
    try {
      setLoading(true);
      
      // Build base query with count
      let countQuery = supabase
        .from('crm_user_health')
        .select('*', { count: 'exact', head: true });
      
      let query = supabase
        .from('crm_user_health')
        .select('*')
        .order('health_score', { ascending: true });

      if (churnRiskFilter) {
        query = query.eq('churn_risk', churnRiskFilter);
        countQuery = countQuery.eq('churn_risk', churnRiskFilter);
      }

      // Filter by segment if specified
      let filteredUserIds: string[] | null = null;
      if (segmentFilter) {
        const { data: segmentMembers } = await supabase
          .from('crm_user_segment_memberships')
          .select('user_id')
          .eq('segment_id', segmentFilter);
        
        if (segmentMembers && segmentMembers.length > 0) {
          filteredUserIds = segmentMembers.map(m => m.user_id);
          query = query.in('user_id', filteredUserIds);
          countQuery = countQuery.in('user_id', filteredUserIds);
        }
      }

      // Get total count
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: healthError } = await query;

      if (healthError) throw healthError;

      // Get profiles separately
      const userIds = (data || []).map(h => h.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      let healthWithProfiles = (data || []).map(h => ({
        ...h,
        profile: profilesMap.get(h.user_id)
      }));

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        healthWithProfiles = healthWithProfiles.filter(item => {
          const firstName = item.profile?.first_name?.toLowerCase() || '';
          const lastName = item.profile?.last_name?.toLowerCase() || '';
          const email = item.profile?.email?.toLowerCase() || '';
          return firstName.includes(query) || lastName.includes(query) || email.includes(query);
        });
      }

      setHealthScores(healthWithProfiles as UserHealth[]);

      // Calculate stats
      if (data && data.length > 0) {
        const avgScore = data.reduce((sum, h) => sum + h.health_score, 0) / data.length;
        const riskCounts = data.reduce((acc, h) => {
          acc[h.churn_risk]++;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });

        setStats({
          avgHealthScore: Math.round(avgScore),
          totalUsers: data.length,
          criticalRisk: riskCounts.critical,
          highRisk: riskCounts.high,
          mediumRisk: riskCounts.medium,
          lowRisk: riskCounts.low
        });
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching CRM health scores:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllScores = async () => {
    try {
      const { error } = await supabase.functions.invoke('calculate-all-health-scores');
      if (error) throw error;
      await fetchHealthScores();
    } catch (err) {
      console.error('Error calculating health scores:', err);
      throw err;
    }
  };

  // ✅ OPTIMISATION: Debounce search query (500ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchHealthScores();
  }, [churnRiskFilter, segmentFilter, debouncedSearchQuery, page, pageSize]);

  return { 
    healthScores, 
    stats, 
    loading, 
    error, 
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    refetch: fetchHealthScores, 
    calculateAllScores 
  };
};
