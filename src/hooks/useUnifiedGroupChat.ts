
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatMessages } from './chat/useChatMessages';
import { useChatMutation } from './chat/useChatMutation';
import { useChatRealtime } from './chat/useChatRealtime';

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_system: boolean;
  sender_name?: string;
  reactions?: any;
}

export const useUnifiedGroupChat = (groupId: string) => {
  const { user } = useAuth();

  const {
    messages,
    loading,
    refreshMessages,
    updateMessagesCache,
    invalidateMessages
  } = useChatMessages(groupId);

  const sendMessageMutation = useChatMutation(groupId, updateMessagesCache);

  useChatRealtime(groupId, updateMessagesCache, invalidateMessages);

  // Nettoyer COMPLÈTEMENT et recharger quand on change de groupe
  useEffect(() => {
    if (groupId && user) {
      console.log('🔄 Changement de groupe détecté - NETTOYAGE COMPLET pour:', groupId);
      
      // Invalidation IMMÉDIATE et COMPLÈTE
      invalidateMessages();
      
      // Rechargement forcé après un court délai
      setTimeout(() => {
        console.log('🔄 Rechargement forcé des messages pour groupe:', groupId);
        refreshMessages();
      }, 200);
    }
  }, [groupId, user?.id, invalidateMessages, refreshMessages]);

  const sendMessage = async (messageText: string): Promise<boolean> => {
    if (!groupId || !user) {
      console.error('❌ Impossible d\'envoyer un message sans groupe ou utilisateur');
      return false;
    }

    try {
      console.log('📤 Envoi message STRICT pour groupe:', groupId);
      await sendMessageMutation.mutateAsync(messageText);
      return true;
    } catch (error) {
      console.error('❌ Erreur sendMessage:', error);
      return false;
    }
  };

  return {
    messages,
    loading,
    sending: sendMessageMutation.isPending,
    sendMessage,
    refreshMessages
  };
};
