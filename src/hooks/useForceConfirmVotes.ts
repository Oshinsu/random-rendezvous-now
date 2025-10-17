import { useState, useEffect } from 'react';
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

  const fetchVotes = async () => {
    if (!groupId || !user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Récupérer tous les votes valides (< 1 heure) via RPC personnalisé
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      // Utiliser une requête SQL directe via edge function ou raw SQL
      const { data: votes, error, count } = await supabase
        .from('group_force_confirm_votes' as any)
        .select('user_id', { count: 'exact' })
        .eq('group_id', groupId)
        .gt('voted_at', oneHourAgo);

      if (error) {
        console.error('Error fetching votes:', error);
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const votesArray = (votes || []) as unknown as Array<{ user_id: string }>;
      const votesCount = votesArray.length;
      const hasVoted = votesArray.some(v => v.user_id === user.id);
      const canConfirm = votesCount >= currentParticipants;

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
  };

  useEffect(() => {
    fetchVotes();

    if (!groupId) return;

    // S'abonner aux changements en temps réel
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
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, currentParticipants]);

  return { ...data, refetch: fetchVotes };
};
