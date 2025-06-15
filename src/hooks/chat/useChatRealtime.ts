
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage } from '@/types/chat';

export const useChatRealtime = (
  groupId: string, 
  updateMessagesCache: (message: ChatMessage) => void,
  invalidateMessages: () => void
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const currentGroupIdRef = useRef<string>('');

  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    console.log('🛰️ Configuration realtime ULTRA-STRICT pour groupe:', groupId);
    
    // Nettoyer l'ancienne souscription si elle existe
    if (channelRef.current) {
      console.log('🧹 Nettoyage de l\'ancienne souscription realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Mettre à jour la référence du groupe actuel
    currentGroupIdRef.current = groupId;

    // Créer un canal ULTRA-UNIQUE pour ce groupe ET cet utilisateur
    const ultraUniqueChannelName = `group-messages-STRICT-${groupId}-user-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(ultraUniqueChannelName, {
        config: {
          broadcast: { self: false },
          presence: { key: `${user.id}-${groupId}` }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}` // FILTRAGE ULTRA-STRICT par groupe
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          console.log('🛰️ Message reçu en temps réel - VÉRIFICATION ULTRA-STRICTE:', {
            messageId: newMessage.id,
            messageGroupId: newMessage.group_id,
            currentGroupId: currentGroupIdRef.current,
            expectedGroupId: groupId,
            messageText: newMessage.message.substring(0, 50)
          });

          // QUADRUPLE VÉRIFICATION que le message appartient EXACTEMENT au bon groupe
          if (newMessage.group_id !== groupId || 
              newMessage.group_id !== currentGroupIdRef.current ||
              currentGroupIdRef.current !== groupId) {
            console.error('🚨 MESSAGE ÉTRANGER DÉTECTÉ ET REJETÉ EN REALTIME:', {
              messageGroup: newMessage.group_id,
              expectedGroup: groupId,
              currentGroup: currentGroupIdRef.current,
              messageId: newMessage.id
            });
            return;
          }

          console.log('✅ Message VALIDÉ reçu pour le groupe:', groupId);
          
          // Mise à jour du cache SEULEMENT pour ce groupe
          updateMessagesCache(newMessage);
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut souscription realtime ULTRA-STRICT groupe', groupId, ':', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription realtime ULTRA-ACTIVE pour groupe:', groupId);
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur canal realtime pour groupe:', groupId);
        }
      });

    channelRef.current = channel;

    // Fonction de nettoyage
    return () => {
      console.log('🛰️ Nettoyage souscription realtime ULTRA-STRICT pour groupe:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      currentGroupIdRef.current = '';
    };
  }, [groupId, user?.id, updateMessagesCache]); // Dépendances strictes
};
