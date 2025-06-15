
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

  // Nettoyage ULTRA agressif lors du changement de groupe
  useEffect(() => {
    if (!groupId || !user) return;

    // Détecter le changement de groupe
    if (previousGroupIdRef.current && previousGroupIdRef.current !== groupId) {
      console.log('🔄 CHANGEMENT DE GROUPE détecté:', {
        ancien: previousGroupIdRef.current,
        nouveau: groupId
      });
      
      // Nettoyage immédiat et complet
      invalidateMessages();
      
      // Attendre un cycle complet avant de recharger
      setTimeout(() => {
        console.log('🔄 Rechargement forcé après nettoyage pour:', groupId);
        refreshMessages();
      }, 200);
    }

    // Mémoriser le groupe actuel
    previousGroupIdRef.current = groupId;
  }, [groupId, user?.id, invalidateMessages, refreshMessages]);

  const sendMessage = async (messageText: string): Promise<boolean> => {
    if (!groupId || !user) {
      console.error('❌ Impossible d\'envoyer un message sans groupe ou utilisateur');
      return false;
    }

    // Vérification STRICTE avant envoi
    if (!messageText.trim()) {
      console.error('❌ Message vide, envoi annulé');
      return false;
    }

    // Vérifier que nous sommes toujours sur le bon groupe
    if (previousGroupIdRef.current !== groupId) {
      console.error('❌ Changement de groupe détecté, envoi annulé');
      return false;
    }

    try {
      console.log('📤 Envoi message pour groupe STRICT:', groupId);
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
