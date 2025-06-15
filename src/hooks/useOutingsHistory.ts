
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OutingHistory {
  id: string;
  group_id: string;
  bar_name: string;
  bar_address: string;
  meeting_time: string;
  completed_at: string;
  participants_count: number;
  bar_latitude?: number;
  bar_longitude?: number;
  created_at: string;
}

export const useOutingsHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['outings-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('🔍 [useOutingsHistory] Fetching outings history for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_outings_history')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('❌ [useOutingsHistory] Error fetching outings history:', error);
        throw error;
      }

      console.log('✅ [useOutingsHistory] Fetched outings history:', data);
      return data as OutingHistory[];
    },
    enabled: !!user?.id,
  });
};
