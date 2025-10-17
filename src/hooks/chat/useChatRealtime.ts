
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage } from '@/types/chat';

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

    // Nettoyage BRUTAL de l'ancienne souscription
    if (channelRef.current) {
      console.log('🧹 SUPPRESSION BRUTALE de l\'ancienne souscription');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Erreur lors de la suppression du canal:', error);
      }
      channelRef.current = null;
    }

    // Détecter changement de groupe et nettoyer
    if (currentGroupIdRef.current && currentGroupIdRef.current !== groupId) {
      console.log('🧹 CHANGEMENT DE GROUPE - nettoyage immédiat du cache');
      invalidateMessagesRef.current();
    }

    console.log('🛰️ Configuration STRICTE realtime pour groupe:', groupId);
    currentGroupIdRef.current = groupId;

    // Canal avec timestamp pour garantir l'unicité
    const channelName = `strict-group-${groupId}-${user.id}-${Date.now()}-${Math.random()}`;
    
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
            console.log('🚫 Hook inactif, message ignoré');
            return;
          }

          const newMessage = payload.new as ChatMessage;
          
          // TRIPLE vérification ultra stricte
          if (!newMessage || newMessage.group_id !== groupId) {
            console.error('🚨 Message ÉTRANGER REJETÉ:', {
              messageGroup: newMessage?.group_id,
              expectedGroup: groupId,
              currentGroup: currentGroupIdRef.current,
              messageId: newMessage?.id
            });
            return;
          }

          // Vérifier que c'est toujours le groupe actuel
          if (currentGroupIdRef.current !== groupId) {
            console.error('🚨 Message pour ANCIEN groupe rejeté:', {
              messageGroup: newMessage.group_id,
              currentGroup: currentGroupIdRef.current
            });
            return;
          }

          console.log('✅ Message VALIDÉ et accepté pour groupe:', groupId);
          updateMessagesCache(newMessage);

          // 🎯 Détecter les messages système de bar assignment et dispatcher un event
          if (newMessage.is_system && 
              (newMessage.message.includes('BAR_ASSIGNMENT') || 
               newMessage.message.includes('bar assigné') ||
               newMessage.message.includes('Rendez-vous au'))) {
            console.log('🍺 Bar assignment détecté, dispatch event de refetch');
            window.dispatchEvent(new CustomEvent('group:bar-assigned', { 
              detail: { groupId } 
            }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription STRICTE active pour:', groupId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur souscription STRICTE pour:', groupId);
        }
      });

    channelRef.current = channel;

    return () => {
      // Marquer comme inactif
      isActiveRef.current = false;
      
      if (channelRef.current) {
        console.log('🛰️ Nettoyage souscription STRICTE pour:', groupId);
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('Erreur lors du nettoyage:', error);
        }
        channelRef.current = null;
      }
    };
  }, [groupId, user?.id]);

  // Nettoyage final BRUTAL au démontage
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (channelRef.current) {
        console.log('🛰️ Nettoyage FINAL BRUTAL');
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('Erreur nettoyage final:', error);
        }
        channelRef.current = null;
      }
      currentGroupIdRef.current = '';
    };
  }, []);
};
