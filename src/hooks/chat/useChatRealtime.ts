
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

  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    // Nettoyage immédiat et complet de l'ancienne souscription
    if (channelRef.current) {
      console.log('🧹 Nettoyage immédiat de l\'ancienne souscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Si on change de groupe, nettoyer le cache
    if (currentGroupIdRef.current && currentGroupIdRef.current !== groupId) {
      console.log('🧹 Changement de groupe détecté, nettoyage du cache');
      invalidateMessages();
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    currentGroupIdRef.current = groupId;

    // Canal unique et spécifique pour ce groupe et cet utilisateur
    const channelName = `group-messages-strict-${groupId}-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}` // Filtrage au niveau de la souscription
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Triple vérification du groupe
          if (newMessage.group_id !== groupId) {
            console.error('🚨 Message étranger rejeté en realtime:', {
              messageGroup: newMessage.group_id,
              expectedGroup: groupId,
              messageId: newMessage.id
            });
            return;
          }

          // Vérifier que c'est bien le groupe actuel
          if (currentGroupIdRef.current !== groupId) {
            console.error('🚨 Message pour ancien groupe rejeté:', {
              messageGroup: newMessage.group_id,
              currentGroup: currentGroupIdRef.current
            });
            return;
          }

          console.log('✅ Nouveau message reçu en realtime pour groupe:', groupId);
          updateMessagesCache(newMessage);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription realtime active pour:', groupId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erreur de souscription realtime pour:', groupId);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('🛰️ Nettoyage souscription realtime pour:', groupId);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user?.id]); // Dépendances strictes

  // Nettoyage final au démontage du composant
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        console.log('🛰️ Nettoyage final au démontage');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      currentGroupIdRef.current = '';
    };
  }, []);
};
