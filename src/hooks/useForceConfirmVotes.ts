import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ForceConfirmVotesData {
  votesCount: number;
  requiredVotes: number;
  hasVoted: boolean;
  canConfirm: boolean;
  loading: boolean;
}

export const useForceConfirmVotes = (groupId: string | undefined, currentParticipants: number) => {
  const { user } = useAuth();
  const [data, setData] = useState<ForceConfirmVotesData>({
    votesCount: 0,
    requiredVotes: currentParticipants,
    hasVoted: false,
    canConfirm: false,
    loading: true,
  });

  const fetchVotes = useCallback(async () => {
    if (!groupId || !user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: votes, error } = await supabase
        .from('group_force_confirm_votes')
        .select('user_id')
        .eq('group_id', groupId)
        .gt('voted_at', oneHourAgo);

      if (error) {
        console.error('Error fetching votes:', error);
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const votesArray = (votes || []) as Array<{ user_id: string }>;
      const votesCount = votesArray.length;
      const hasVoted = votesArray.some(v => v.user_id === user.id);
      const canConfirm = votesCount >= currentParticipants;

      console.log('🗳️ [VOTES] Mise à jour:', { votesCount, requiredVotes: currentParticipants, hasVoted, canConfirm });

      setData({
        votesCount,
        requiredVotes: currentParticipants,
        hasVoted,
        canConfirm,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching votes:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [groupId, user, currentParticipants]);

  useEffect(() => {
    fetchVotes();

    if (!groupId) return;

    console.log('🗳️ [REALTIME] Souscription aux votes pour groupe:', groupId);

    // Realtime pour détecter les nouveaux votes immédiatement
    const channel = supabase
      .channel(`votes-${groupId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'group_force_confirm_votes',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log('🗳️ [REALTIME] Vote modifié:', payload);
          fetchVotes();
        }
      )
      .subscribe();

    // Polling de secours toutes les 10 secondes
    const pollInterval = setInterval(() => {
      console.log('🔄 [POLLING] Rafraîchissement des votes...');
      fetchVotes();
    }, 10000);

    return () => {
      console.log('🗳️ [REALTIME] Désinscription des votes pour groupe:', groupId);
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [groupId, fetchVotes]);

  return { ...data, refetch: fetchVotes };
};
