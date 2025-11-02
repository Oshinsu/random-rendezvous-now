import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedScheduledGroup } from '@/services/unifiedScheduledGroupService';

export const useScheduledGroupEnhancement = (groupId: string) => {
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroupMembers = async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const { data: participants, error } = await supabase
        .from('group_participants')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (error) {
        console.error('Error fetching group members:', error);
        return;
      }

      setGroupMembers(participants || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupMembers();
    }
  }, [groupId]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!groupId) return;

    // Unique channel name to prevent duplicate subscriptions
    const channelName = `group-${groupId}-participants-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_participants',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchGroupMembers();
        }
      )
      .subscribe();

    return () => {
      // ✅ SOTA 2025: unsubscribe avant removeChannel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return {
    groupMembers,
    loading,
    refetchMembers: fetchGroupMembers
  };
};