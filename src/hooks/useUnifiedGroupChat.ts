
import { useEffect, useRef } from 'react';
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
  const previousGroupIdRef = useRef<string>('');

  const {
    messages,
    loading,
    refreshMessages,
    updateMessagesCache,
    invalidateMessages
  } = useChatMessages(groupId);

  const sendMessageMutation = useChatMutation(groupId, updateMessagesCache);

  useChatRealtime(groupId, updateMessagesCache, invalidateMessages);

  // Clean group change handling without excessive logging
  useEffect(() => {
    if (!groupId || !user) return;

    const isGroupChange = previousGroupIdRef.current && previousGroupIdRef.current !== groupId;

    // Always remember current group immediately
    previousGroupIdRef.current = groupId;

    if (isGroupChange) {
      // Clean invalidation
      invalidateMessages();
      
      // Debounced reload
      const timeoutId = setTimeout(() => {
        refreshMessages();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [groupId, user?.id, invalidateMessages, refreshMessages]);

  const sendMessage = async (messageText: string): Promise<boolean> => {
    if (!groupId || !user || !messageText.trim()) {
      return false;
    }

    // Verify group consistency
    if (previousGroupIdRef.current !== groupId) {
      return false;
    }

    try {
      await sendMessageMutation.mutateAsync(messageText);
      return true;
    } catch (error) {
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
