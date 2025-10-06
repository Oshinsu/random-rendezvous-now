import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CohortData {
  cohort_month: string;
  total_signups: number;
  activated_users: number;
  first_outing_users: number;
  regular_users: number;
  avg_ltv: number;
  retention_rate: number;
}

interface AnalyticsData {
  activeUsers: number;
  totalUsers: number;
  avgHealthScore: number;
  churnRisk: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  funnelStats: {
    signups: number;
    activated: number;
    firstOuting: number;
    regular: number;
    conversionRate: number;
  };
  campaignStats: {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    activeCampaigns: number;
  };
  cohorts: CohortData[];
}

export const useCRMAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCohortAnalysis = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (!users) return;

      // Get all outings history
      const { data: outings } = await supabase
        .from('user_outings_history')
        .select('user_id, completed_at');

      // Get group participations
      const { data: participations } = await supabase
        .from('group_participants')
        .select('user_id, joined_at, last_seen');

      // Get health scores
      const { data: healthData } = await supabase
        .from('crm_user_health')
        .select('health_score, churn_risk');

      // Get campaign stats
      const { data: campaignSends } = await supabase
        .from('crm_campaign_sends')
        .select('opened_at, clicked_at');

      const { data: campaignsActive } = await supabase
        .from('crm_campaigns')
        .select('id, status')
        .in('status', ['draft', 'scheduled', 'active']);

      // Calculate active users (activity in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = participations?.filter(p => 
        new Date(p.last_seen) > sevenDaysAgo
      ).length || 0;

      // Calculate health score stats
      const avgHealthScore = healthData && healthData.length > 0
        ? Math.round(healthData.reduce((sum, h) => sum + h.health_score, 0) / healthData.length)
        : 50;

      const churnRisk = {
        critical: healthData?.filter(h => h.churn_risk === 'critical').length || 0,
        high: healthData?.filter(h => h.churn_risk === 'high').length || 0,
        medium: healthData?.filter(h => h.churn_risk === 'medium').length || 0,
        low: healthData?.filter(h => h.churn_risk === 'low').length || 0,
      };

      // Calculate funnel stats
      const uniqueUserIds = new Set(participations?.map(p => p.user_id) || []);
      const uniqueOutingUsers = new Set(outings?.map(o => o.user_id) || []);
      
      const funnelStats = {
        signups: users.length,
        activated: uniqueUserIds.size,
        firstOuting: uniqueOutingUsers.size,
        regular: outings?.reduce((acc, _, idx, arr) => {
          const userOutings = arr.filter(o => o.user_id === arr[idx].user_id);
          return userOutings.length >= 3 ? acc + 1 : acc;
        }, 0) || 0,
        conversionRate: users.length > 0 
          ? Math.round((uniqueOutingUsers.size / users.length) * 100) 
          : 0
      };

      // Calculate campaign stats
      const totalSent = campaignSends?.length || 0;
      const opened = campaignSends?.filter(s => s.opened_at).length || 0;
      const clicked = campaignSends?.filter(s => s.clicked_at).length || 0;

      const campaignStats = {
        totalSent,
        avgOpenRate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
        avgClickRate: totalSent > 0 ? Math.round((clicked / totalSent) * 100) : 0,
        activeCampaigns: campaignsActive?.length || 0,
      };

      // Calculate cohort data
      const cohortMap = new Map<string, CohortData>();

      users.forEach(user => {
        const cohortMonth = new Date(user.created_at).toISOString().slice(0, 7);
        
        if (!cohortMap.has(cohortMonth)) {
          cohortMap.set(cohortMonth, {
            cohort_month: cohortMonth,
            total_signups: 0,
            activated_users: 0,
            first_outing_users: 0,
            regular_users: 0,
            avg_ltv: 0,
            retention_rate: 0
          });
        }

        const cohort = cohortMap.get(cohortMonth)!;
        cohort.total_signups++;

        const hasParticipated = participations?.some(p => p.user_id === user.id);
        if (hasParticipated) cohort.activated_users++;

        const userOutings = outings?.filter(o => o.user_id === user.id) || [];
        if (userOutings.length > 0) cohort.first_outing_users++;
        if (userOutings.length >= 3) cohort.regular_users++;

        cohort.avg_ltv += userOutings.length * 25;
      });

      const cohortArray = Array.from(cohortMap.values()).map(cohort => ({
        ...cohort,
        avg_ltv: cohort.total_signups > 0 ? Math.round(cohort.avg_ltv / cohort.total_signups) : 0,
        retention_rate: cohort.total_signups > 0 
          ? Math.round((cohort.regular_users / cohort.total_signups) * 100) 
          : 0
      }));

      setAnalytics({
        activeUsers,
        totalUsers: users.length,
        avgHealthScore,
        churnRisk,
        funnelStats,
        campaignStats,
        cohorts: cohortArray
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohortAnalysis();
  }, []);

  return { 
    analytics, 
    loading, 
    refetch: fetchCohortAnalysis 
  };
};
