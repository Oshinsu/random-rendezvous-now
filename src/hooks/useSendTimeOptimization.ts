import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SendTimeOptimization {
  recommended_hour: number;
  recommended_day: number;
  estimated_open_rate: number;
  confidence: 'low' | 'medium' | 'high';
  data_points: number;
}

export const useSendTimeOptimization = (segmentId?: string, userId?: string) => {
  return useQuery({
    queryKey: ['send-time-optimization', segmentId, userId],
    queryFn: async () => {
      if (!segmentId && !userId) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke('optimize-send-time', {
        body: { segment_id: segmentId, user_id: userId }
      });

      if (error) throw error;
      return data as SendTimeOptimization;
    },
    enabled: !!(segmentId || userId),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
};