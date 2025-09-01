import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ComprehensiveAdminStats {
  total_users: number;
  total_profiles: number;
  waiting_groups: number;
  confirmed_groups: number;
  completed_groups: number;
  cancelled_groups: number;
  scheduled_groups: number;
  total_messages: number;
  system_messages: number;
  total_outings: number;
  groups_today: number;
  signups_today: number;
  active_participants: number;
  avg_group_size: number;
  top_bars: Array<{ bar_name: string; visits: number }>;
}

export const useComprehensiveAdminStats = () => {
  const [stats, setStats] = useState<ComprehensiveAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_comprehensive_admin_stats');
      
      if (error) throw error;
      
      setStats(data as unknown as ComprehensiveAdminStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching comprehensive admin stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};