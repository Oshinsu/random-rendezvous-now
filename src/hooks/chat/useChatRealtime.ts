
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
  const channelRef = useRef<any>(null);
  const currentGroupIdRef = useRef<string>('');
  const isActiveRef = useRef<boolean>(true);

  // Keep stable refs for callbacks to avoid resubscribing
  const updateMessagesCacheRef = useRef(updateMessagesCache);
  const invalidateMessagesRef = useRef(invalidateMessages);

  // Update refs when callbacks change without recreating subscription
  useEffect(() => {
    updateMessagesCacheRef.current = updateMessagesCache;
    invalidateMessagesRef.current = invalidateMessages;
  }, [updateMessagesCache, invalidateMessages]);

  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    // Marquer comme actif
    isActiveRef.current = true;

    // ✅ PHASE 3: Réutiliser le canal existant s'il est pour le bon groupe
    const existingChannel = channelRef.current;
    if (existingChannel && currentGroupIdRef.current === groupId) {
      console.log('✅ [PHASE 3] Réutilisation du canal existant', groupId);
      return; // Ne rien faire, le canal est déjà configuré
    }

    // ✅ Nettoyer l'ancien canal UNIQUEMENT si changement de groupe
    if (existingChannel && currentGroupIdRef.current !== groupId) {
      console.log('🔄 [PHASE 3] Changement de groupe, nettoyage ancien canal');
      try {
        supabase.removeChannel(existingChannel);
      } catch (error) {
        logger.warn('Erreur lors de la suppression du canal', error);
      }
      channelRef.current = null;
      
      // Invalider les messages de l'ancien groupe
      invalidateMessagesRef.current();
    }

    logger.realtime('Configuration realtime pour groupe', groupId);
    currentGroupIdRef.current = groupId;

    // ✅ PHASE 3: Canal SANS timestamp pour permettre la réutilisation
    const channelName = `group-messages-${groupId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}` // Filtrage au niveau serveur
        },
        (payload) => {
          // Vérifier si le hook est toujours actif
          if (!isActiveRef.current) {
            logger.debug('Hook inactif, message ignoré');
            return;
          }

          const newMessage = payload.new as ChatMessage;
          
          // TRIPLE vérification ultra stricte
          if (!newMessage || newMessage.group_id !== groupId) {
            logger.error('Message étranger rejeté', {
              messageGroup: newMessage?.group_id,
              expectedGroup: groupId,
              currentGroup: currentGroupIdRef.current,
              messageId: newMessage?.id
            });
            return;
          }

          // Vérifier que c'est toujours le groupe actuel
          if (currentGroupIdRef.current !== groupId) {
            logger.error('Message pour ancien groupe rejeté', {
              messageGroup: newMessage.group_id,
              currentGroup: currentGroupIdRef.current
            });
            return;
          }

          logger.debug('Message validé et accepté', { groupId });
          updateMessagesCache(newMessage);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.realtime('Souscription active', groupId);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Erreur souscription realtime', groupId);
          // 🔧 RECONNECTION: Invalider et retry après 3 secondes
          setTimeout(() => {
            if (isActiveRef.current) {
              logger.info('Tentative de reconnexion...', groupId);
              invalidateMessagesRef.current();
            }
          }, 3000);
        } else if (status === 'TIMED_OUT') {
          logger.warn('Timeout souscription realtime', groupId);
          // 🔧 RECONNECTION: Retry après 5 secondes
          setTimeout(() => {
            if (isActiveRef.current) {
              logger.info('Retry après timeout...', groupId);
              invalidateMessagesRef.current();
            }
          }, 5000);
        } else if (status === 'CLOSED') {
          logger.warn('Canal fermé', groupId);
          if (isActiveRef.current) {
            invalidateMessagesRef.current();
          }
        }
      });

    channelRef.current = channel;

    return () => {
      // Marquer comme inactif
      isActiveRef.current = false;
      
      if (channelRef.current) {
        logger.debug('Nettoyage souscription', groupId);
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          logger.warn('Erreur lors du nettoyage', error);
        }
        channelRef.current = null;
      }
    };
  }, [groupId, user?.id]);

  // Nettoyage final au démontage
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (channelRef.current) {
        logger.debug('Nettoyage final realtime');
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          logger.warn('Erreur nettoyage final', error);
        }
        channelRef.current = null;
      }
      currentGroupIdRef.current = '';
    };
  }, []);
};
