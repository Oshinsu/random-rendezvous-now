import { useQuery } from '@tanstack/react-query';
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

export const useCRMCohortsDB = () => {
  return useQuery({
    queryKey: ['crm-cohorts-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_cohort_analysis')
        .select('*')
        .order('cohort_month', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as CohortData[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
