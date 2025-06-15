
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

    // Nettoyer l'ancienne souscription seulement si on change de groupe
    if (channelRef.current && currentGroupIdRef.current !== groupId) {
      console.log('🧹 Nettoyage souscription pour changement de groupe');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Ne pas recréer le canal s'il existe déjà pour ce groupe
    if (channelRef.current && currentGroupIdRef.current === groupId) {
      return;
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    currentGroupIdRef.current = groupId;

    const channelName = `group-messages-${groupId}-${user.id}`;
    
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
          
          // Vérification stricte du groupe
          if (newMessage.group_id !== groupId) {
            console.error('🚨 Message étranger rejeté:', newMessage.group_id, 'vs', groupId);
            return;
          }

          console.log('✅ Nouveau message reçu en realtime');
          updateMessagesCache(newMessage);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription realtime active pour:', groupId);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('🛰️ Nettoyage souscription realtime');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      currentGroupIdRef.current = '';
    };
  }, [groupId, user?.id]); // Dépendances minimales
};
