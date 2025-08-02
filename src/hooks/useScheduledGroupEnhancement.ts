import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScheduledGroup } from '@/services/scheduledGroupService';

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

    const channel = supabase
      .channel(`group-${groupId}-participants`)
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
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return {
    groupMembers,
    loading,
    refetchMembers: fetchGroupMembers
  };
};