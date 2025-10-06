import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CRMAnalytics {
  totalUsers: number;
  activeUsers: number;
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
    totalCampaigns: number;
    activeCampaigns: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  topSegments: Array<{
    segment_name: string;
    user_count: number;
    avg_health: number;
  }>;
}

export const useCRMAnalytics = () => {
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active users (last 30 days)
      const { count: activeUsers } = await supabase
        .from('group_participants')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Health scores
      const { data: healthData } = await supabase
        .from('crm_user_health')
        .select('health_score, churn_risk');

      const avgHealthScore = healthData && healthData.length > 0
        ? Math.round(healthData.reduce((sum, h) => sum + h.health_score, 0) / healthData.length)
        : 0;

      const churnRisk = healthData?.reduce((acc, h) => {
        acc[h.churn_risk]++;
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0 }) || { critical: 0, high: 0, medium: 0, low: 0 };

      // Funnel stats
      const { count: signups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activated } = await supabase
        .from('group_participants')
        .select('user_id', { count: 'exact', head: true });

      const { count: firstOuting } = await supabase
        .from('user_outings_history')
        .select('user_id', { count: 'exact', head: true });

      const { count: regular } = await supabase
        .from('crm_user_health')
        .select('*', { count: 'exact', head: true })
        .gte('total_outings', 3);

      const conversionRate = signups ? Math.round((firstOuting || 0) / signups * 100) : 0;

      // Campaign stats
      const { count: totalCampaigns } = await supabase
        .from('crm_campaigns')
        .select('*', { count: 'exact', head: true });

      const { count: activeCampaigns } = await supabase
        .from('crm_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: sends } = await supabase
        .from('crm_campaign_sends')
        .select('opened_at, clicked_at');

      const totalSent = sends?.length || 0;
      const avgOpenRate = totalSent > 0 
        ? Math.round((sends?.filter(s => s.opened_at).length || 0) / totalSent * 100)
        : 0;
      const avgClickRate = totalSent > 0
        ? Math.round((sends?.filter(s => s.clicked_at).length || 0) / totalSent * 100)
        : 0;

      // Top segments
      const { data: segments } = await supabase
        .from('crm_user_segments')
        .select('id, segment_name');

      const topSegments = await Promise.all(
        (segments || []).map(async (segment) => {
          const { data: members } = await supabase
            .from('crm_user_segment_memberships')
            .select('user_id')
            .eq('segment_id', segment.id);

          let avgHealth = 0;
          if (members && members.length > 0) {
            const { data: healthScores } = await supabase
              .from('crm_user_health')
              .select('health_score')
              .in('user_id', members.map(m => m.user_id));

            avgHealth = healthScores && healthScores.length > 0
              ? Math.round(healthScores.reduce((sum, h) => sum + h.health_score, 0) / healthScores.length)
              : 0;
          }

          return {
            segment_name: segment.segment_name,
            user_count: members?.length || 0,
            avg_health: avgHealth
          };
        })
      );

      setAnalytics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        avgHealthScore,
        churnRisk,
        funnelStats: {
          signups: signups || 0,
          activated: activated || 0,
          firstOuting: firstOuting || 0,
          regular: regular || 0,
          conversionRate
        },
        campaignStats: {
          totalCampaigns: totalCampaigns || 0,
          activeCampaigns: activeCampaigns || 0,
          totalSent,
          avgOpenRate,
          avgClickRate
        },
        topSegments: topSegments.sort((a, b) => b.user_count - a.user_count).slice(0, 5)
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching CRM analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return { analytics, loading, error, refetch: fetchAnalytics };
};
