import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  calculated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useCRMHealth = (churnRiskFilter?: string) => {
  const [healthScores, setHealthScores] = useState<UserHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    avgHealthScore: 0,
    criticalRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  });

  const fetchHealthScores = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('crm_user_health')
        .select('*')
        .order('health_score', { ascending: true });

      if (churnRiskFilter) {
        query = query.eq('churn_risk', churnRiskFilter);
      }

      const { data, error: healthError } = await query;

      if (healthError) throw healthError;

      // Get profiles separately
      const userIds = (data || []).map(h => h.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const healthWithProfiles = (data || []).map(h => ({
        ...h,
        profile: profilesMap.get(h.user_id)
      }));

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

  useEffect(() => {
    fetchHealthScores();
  }, [churnRiskFilter]);

  return { healthScores, stats, loading, error, refetch: fetchHealthScores, calculateAllScores };
};
