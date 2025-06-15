
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const {
    messages,
    loading,
    refreshMessages,
    updateMessagesCache,
    invalidateMessages
  } = useChatMessages(groupId);

  const sendMessageMutation = useChatMutation(groupId, updateMessagesCache);

  useChatRealtime(groupId, updateMessagesCache, invalidateMessages);

  // Nettoyer le cache quand on change de groupe avec invalidation immédiate
  useEffect(() => {
    if (groupId) {
      console.log('🔄 Nouveau groupe détecté, invalidation immédiate du cache:', groupId);
      invalidateMessages();
      refreshMessages();
    }
  }, [groupId, invalidateMessages, refreshMessages]);

  const sendMessage = async (messageText: string): Promise<boolean> => {
    try {
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
