import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserCredits {
  total_credits: number;
  credits_used: number;
  credits_available: number;
}

export const useUserCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCredits(data);
      } else if (error?.code === 'PGRST116' || !data) {
        // Aucun crédit encore, initialiser à 0
        setCredits({ total_credits: 0, credits_used: 0, credits_available: 0 });
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setCredits({ total_credits: 0, credits_used: 0, credits_available: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  return { credits, loading, refetch: fetchCredits };
};
