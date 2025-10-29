import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnlineMember {
  user_id: string;
  user_name: string;
  joined_at: string;
}

export const useChatPresence = (groupId: string) => {
  const { user } = useAuth();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);

  useEffect(() => {
    if (!groupId || !user) return;

    const channelName = `presence:${groupId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id }
      }
    });

    // Sync event : mise à jour de la liste complète
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<OnlineMember>();
      const members = Object.values(state).flatMap(presences => presences);
      setOnlineMembers(members);
    });

    // Join event : nouvel arrivant
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((presence: any) => {
        if (presence.user_id !== user.id) {
          // Notification in-app (ton Random : fun, Gen Z)
          toast.success(`👋 ${presence.user_name} vient de rejoindre !`);
          
          // Push notification (ton Random)
          supabase.functions.invoke('send-push-notification', {
            body: {
              user_ids: [user.id],
              title: '👋 Quelqu\'un arrive !',
              body: `${presence.user_name} vient de rejoindre ton groupe 🔥`,
              type: 'group_member_joined',
              action_url: `/groups?group_id=${groupId}`,
              data: {
                group_id: groupId,
                member_id: presence.user_id
              }
            }
          }).catch(err => console.error('Push notification error:', err));
        }
      });
    });

    // Leave event : quelqu'un quitte
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        if (presence.user_id !== user.id) {
          toast.info(`${presence.user_name} s'est déconnecté·e`);
        }
      });
    });

    // S'inscrire et tracker sa présence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Anonyme',
          joined_at: new Date().toISOString()
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, user?.email]);

  return { onlineMembers };
};
