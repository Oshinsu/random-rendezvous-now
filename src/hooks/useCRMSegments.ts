import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Segment {
  id: string;
  segment_key: string;
  segment_name: string;
  description: string;
  color: string;
  user_count?: number;
}

export const useCRMSegments = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      
      // Get all segments
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('crm_user_segments')
        .select('*')
        .order('segment_name');

      if (segmentsError) throw segmentsError;

      // Get user counts for each segment
      const segmentsWithCounts = await Promise.all(
        (segmentsData || []).map(async (segment) => {
          const { count } = await supabase
            .from('crm_user_segment_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('segment_id', segment.id);

          return {
            ...segment,
            user_count: count || 0
          };
        })
      );

      setSegments(segmentsWithCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching CRM segments:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  return { segments, loading, error, refetch: fetchSegments };
};
