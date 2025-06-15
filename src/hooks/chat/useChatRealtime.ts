
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

    console.log('🛰️ Configuration realtime pour groupe SPÉCIFIQUE:', groupId);
    
    // Nettoyer l'ancienne souscription si elle existe
    if (channelRef.current) {
      console.log('🧹 Nettoyage de l\'ancienne souscription realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Mettre à jour la référence du groupe actuel
    currentGroupIdRef.current = groupId;

    // Créer un canal UNIQUE et SPÉCIFIQUE à ce groupe
    const uniqueChannelName = `group-messages-${groupId}-${user.id}`;
    
    const channel = supabase
      .channel(uniqueChannelName, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}` // FILTRAGE STRICT par groupe
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          console.log('🛰️ Message reçu en temps réel:', {
            messageGroupId: newMessage.group_id,
            currentGroupId: currentGroupIdRef.current,
            groupId: groupId
          });

          // TRIPLE VÉRIFICATION que le message appartient au bon groupe
          if (newMessage.group_id !== groupId || 
              newMessage.group_id !== currentGroupIdRef.current) {
            console.log('⚠️ Message pour un autre groupe, REJETÉ:', {
              messageGroup: newMessage.group_id,
              expectedGroup: groupId,
              currentGroup: currentGroupIdRef.current
            });
            return;
          }

          // Filtrer les messages système non importants
          if (newMessage.is_system) {
            const isImportantSystemMessage = newMessage.message.includes('Rendez-vous au') || 
                                           newMessage.message.includes('bar assigné') ||
                                           newMessage.message.includes('groupe complet');
            
            if (!isImportantSystemMessage) {
              console.log('⚠️ Message système non important, ignoré');
              return;
            }
          }

          console.log('✅ Message valide reçu pour le groupe:', groupId);
          
          // Mise à jour du cache SEULEMENT pour ce groupe
          updateMessagesCache(newMessage);
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut souscription realtime groupe', groupId, ':', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription realtime ACTIVE pour groupe:', groupId);
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.log('❌ Erreur canal realtime pour groupe:', groupId);
        }
      });

    channelRef.current = channel;

    // Fonction de nettoyage
    return () => {
      console.log('🛰️ Nettoyage souscription realtime pour groupe:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      currentGroupIdRef.current = '';
    };
  }, [groupId, user?.id, updateMessagesCache]); // Ajouter user.id comme dépendance
};
