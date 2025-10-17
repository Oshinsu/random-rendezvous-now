import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { crmEventBus } from '@/utils/crmEventBus';

interface CRMOverviewData {
  totalUsers: number;
  activeUsers: number;
  avgHealthScore: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  conversionRate: number;
}

export const useCRMOverview = () => {
  const [data, setData] = useState<CRMOverviewData>({
    totalUsers: 0,
    activeUsers: 0,
    avgHealthScore: 0,
    criticalRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get health scores data
      const { data: healthData, error: healthError } = await supabase
        .from('crm_user_health')
        .select('health_score, churn_risk, days_since_last_login, total_outings');

      if (healthError) throw healthError;

      // Calculate stats
      const avgScore = healthData && healthData.length > 0
        ? Math.round(healthData.reduce((sum, h) => sum + h.health_score, 0) / healthData.length)
        : 0;

      const riskCounts = (healthData || []).reduce((acc, h) => {
        acc[h.churn_risk] = (acc[h.churn_risk] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Active users = users connected in last 30 days OR with at least 1 outing
      const activeCount = (healthData || []).filter(
        h => (h.days_since_last_login !== null && h.days_since_last_login <= 30) || h.total_outings >= 1
      ).length;

      // Calculate conversion rate (users with at least 1 outing / total users)
      const { count: usersWithOutings } = await supabase
        .from('crm_user_health')
        .select('*', { count: 'exact', head: true })
        .gt('total_outings', 0);

      const conversionRate = totalUsers && totalUsers > 0
        ? Math.round(((usersWithOutings || 0) / totalUsers) * 100)
        : 0;

      setData({
        totalUsers: totalUsers || 0,
        activeUsers: activeCount,
        avgHealthScore: avgScore,
        criticalRisk: riskCounts['critical'] || 0,
        highRisk: riskCounts['high'] || 0,
        mediumRisk: riskCounts['medium'] || 0,
        lowRisk: riskCounts['low'] || 0,
        conversionRate
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching CRM overview:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    // Subscribe to CRM events
    const unsubscribe1 = crmEventBus.subscribe('health-scores-updated', fetchOverview);
    const unsubscribe2 = crmEventBus.subscribe('segments-updated', fetchOverview);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  return { data, loading, error, refetch: fetchOverview };
};
