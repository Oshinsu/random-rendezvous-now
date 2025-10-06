import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Feedback {
  id: string;
  user_id: string;
  feedback_type: string;
  rating: number | null;
  feedback_text: string | null;
  resolved: boolean;
  created_at: string;
  group_id: string | null;
  context: any;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useFeedbackManagement = (filterResolved: boolean = false) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('crm_user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterResolved !== null) {
        query = query.eq('resolved', filterResolved);
      }

      const { data: feedbackData, error: feedbackError } = await query;

      if (feedbackError) throw feedbackError;

      // Fetch user profiles
      const userIds = (feedbackData || []).map(f => f.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const feedbacksWithProfiles = (feedbackData || []).map(f => ({
        ...f,
        profile: profilesMap.get(f.user_id)
      }));

      setFeedbacks(feedbacksWithProfiles as Feedback[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const resolveFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('crm_user_feedback')
        .update({ 
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) throw error;

      await fetchFeedbacks();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filterResolved]);

  const stats = {
    totalFeedbacks: feedbacks.length,
    unresolvedCount: feedbacks.filter(f => !f.resolved).length,
    avgRating: feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length || 0,
    npsCount: feedbacks.filter(f => f.feedback_type === 'nps').length,
    bugReportsCount: feedbacks.filter(f => f.feedback_type === 'bug').length,
    featureRequestsCount: feedbacks.filter(f => f.feedback_type === 'feature_request').length
  };

  return { 
    feedbacks, 
    stats,
    loading, 
    error, 
    refetch: fetchFeedbacks,
    resolveFeedback 
  };
};
