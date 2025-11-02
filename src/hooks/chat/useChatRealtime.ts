
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage } from '@/types/chat';
import { logger } from '@/utils/logger';

export const useChatRealtime = (
  groupId: string, 
  updateMessagesCache: (message: ChatMessage) => void,
  invalidateMessages: () => void
) => {
  const { user } = useAuth();
  
  // Refs pour les callbacks avec stabilité garantie
  const updateMessagesCacheRef = useRef(updateMessagesCache);
  const invalidateMessagesRef = useRef(invalidateMessages);
  
  // Mise à jour des refs quand les callbacks changent
  useEffect(() => {
    updateMessagesCacheRef.current = updateMessagesCache;
    invalidateMessagesRef.current = invalidateMessages;
  }, [updateMessagesCache, invalidateMessages]);

  // ✅ SOTA 2025: Gestion UNIQUE du cycle de vie Supabase
  useEffect(() => {
    if (!groupId || !user) {
      logger.warn('Pas de souscription Realtime', { groupId, user: !!user });
      return;
    }

    logger.realtime('Configuration realtime pour groupe', groupId);

    // ✅ SOTA: Nom unique pour chaque souscription
    const channelName = `group-messages-${groupId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // ✅ Validation stricte
          if (newMessage?.group_id && newMessage.group_id === groupId) {
            logger.realtime('Nouveau message reçu', {
              groupId: newMessage.group_id,
              messageId: newMessage.id
            });
            updateMessagesCacheRef.current(newMessage);
          } else {
            logger.warn('Message ignoré (mauvais groupe)', {
              messageGroupId: newMessage?.group_id,
              expectedGroupId: groupId
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.realtime('Souscription Realtime active', groupId);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Erreur souscription Realtime', { groupId, status });
          setTimeout(() => invalidateMessagesRef.current(), 3000);
        } else if (status === 'TIMED_OUT') {
          logger.warn('Timeout souscription Realtime', groupId);
          setTimeout(() => invalidateMessagesRef.current(), 5000);
        } else if (status === 'CLOSED') {
          logger.warn('Canal Realtime fermé', groupId);
        }
      });

    return () => {
      logger.debug('Nettoyage Realtime hook', groupId);
      // ✅ SOTA: unsubscribe AVANT removeChannel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id]);
};
