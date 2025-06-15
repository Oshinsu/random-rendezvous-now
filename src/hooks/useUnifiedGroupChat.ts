
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

  // Nettoyer et recharger quand on change de groupe
  useEffect(() => {
    if (groupId && user) {
      console.log('🔄 Changement de groupe détecté, nettoyage du cache pour:', groupId);
      // Invalidation immédiate pour s'assurer qu'on part d'une base propre
      invalidateMessages();
      // Rechargement forcé des messages du nouveau groupe
      setTimeout(() => {
        refreshMessages();
      }, 100);
    }
  }, [groupId, user?.id, invalidateMessages, refreshMessages]);

  const sendMessage = async (messageText: string): Promise<boolean> => {
    if (!groupId || !user) {
      console.error('❌ Impossible d\'envoyer un message sans groupe ou utilisateur');
      return false;
    }

    try {
      console.log('📤 Envoi message pour groupe:', groupId);
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
