
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

  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    console.log('🛰️ Configuration realtime optimisée pour groupe:', groupId);
    
    // Nettoyer l'ancienne souscription
    if (channelRef.current) {
      console.log('🧹 Nettoyage de l\'ancienne souscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Configurer la nouvelle souscription SPÉCIFIQUE à ce groupe avec options optimisées
    const channel = supabase
      .channel(`group-chat-${groupId}`, {
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
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Vérifier que le message appartient bien à ce groupe
          if (newMessage.group_id !== groupId) {
            console.log('⚠️ Message pour un autre groupe, ignoré');
            return;
          }

          // Filtrer les messages système moins importants en temps réel aussi
          if (newMessage.is_system) {
            const isImportantSystemMessage = newMessage.message.includes('Rendez-vous au') || 
                                           newMessage.message.includes('bar assigné') ||
                                           newMessage.message.includes('groupe complet');
            
            if (!isImportantSystemMessage) {
              console.log('⚠️ Message système non important, ignoré');
              return;
            }
          }

          console.log('🛰️ Nouveau message reçu en temps réel pour groupe:', groupId);
          
          // Mise à jour immédiate du cache
          updateMessagesCache(newMessage);

          // Forcer une invalidation pour s'assurer que les données sont à jour
          invalidateMessages();
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut souscription realtime pour groupe', groupId, ':', status);
        
        // Gérer les reconnexions automatiques
        if (status === 'CHANNEL_ERROR') {
          console.log('❌ Erreur de canal, tentative de reconnexion...');
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.subscribe();
            }
          }, 2000);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription realtime active pour le groupe', groupId);
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
    };
  }, [groupId, user, updateMessagesCache, invalidateMessages]);
};
