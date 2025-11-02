import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

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

    const channelName = `presence:${groupId}-${Date.now()}-${Math.random()}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: user.id }
      }
    });
    
    let heartbeatInterval: NodeJS.Timeout | null = null;

    // Sync event : mise à jour de la liste complète
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<OnlineMember>();
      const members = Object.values(state).flatMap(presences => presences);
      setOnlineMembers(members);
      logger.debug('Presence sync', { membersCount: members.length });
    });

    // Join event : nouvel arrivant
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((presence: any) => {
        if (presence.user_id !== user.id) {
          logger.info('Membre rejoint', { name: presence.user_name });
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
          }).catch(err => logger.error('Erreur push notification', err));
        }
      });
    });

    // Leave event : quelqu'un quitte
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        if (presence.user_id !== user.id) {
          logger.info('Membre parti', { name: presence.user_name });
          toast.info(`${presence.user_name} s'est déconnecté·e`);
        }
      });
    });

    // S'inscrire et tracker sa présence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        logger.realtime('Presence souscription active', groupId);
        
        const userPresence = {
          user_id: user.id,
          user_name: user.email?.split('@')[0] || 'Anonyme',
          joined_at: new Date().toISOString()
        };
        
        await channel.track(userPresence);
        
        // 🔧 HEARTBEAT: Maintenir la présence active toutes les 15 secondes
        heartbeatInterval = setInterval(() => {
          channel.track(userPresence).catch(error => {
            logger.warn('Erreur heartbeat presence', error);
          });
        }, 15000);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Erreur presence channel', groupId);
      } else if (status === 'CLOSED') {
        logger.warn('Presence channel fermé', groupId);
      }
    });

    return () => {
      // ✅ SOTA 2025: Cleanup dans le bon ordre
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      channel.untrack(); // 1. Untrack presence
      channel.unsubscribe(); // 2. Unsubscribe
      supabase.removeChannel(channel); // 3. Remove channel
      logger.debug('Nettoyage presence', groupId);
    };
  }, [groupId, user?.id, user?.email]);

  return { onlineMembers };
};
