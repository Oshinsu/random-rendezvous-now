
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
  bar_place_id?: string;
  user_rating?: number;
  user_review?: string;
  rated_at?: string;
  created_at: string;
}

export const useOutingsHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['outings-history', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('🔍 [useOutingsHistory] No user ID, returning empty array');
        return [];
      }
      
      console.log('🔍 [useOutingsHistory] Fetching outings history for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('user_outings_history')
          .select('id, bar_name, bar_address, meeting_time, participants_count, completed_at, user_rating, user_review')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('❌ [useOutingsHistory] Supabase error:', error);
          throw new Error(`Failed to fetch outings history: ${error.message}`);
        }

        console.log(`✅ [useOutingsHistory] Fetched ${data?.length || 0} outings for user ${user.id}`);
        
        // Log some debug info about the data structure
        if (data && data.length > 0) {
          console.log('📊 [useOutingsHistory] Sample outing:', data[0]);
        }
        
        return (data || []) as OutingHistory[];
      } catch (err) {
        console.error('❌ [useOutingsHistory] Unexpected error:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
