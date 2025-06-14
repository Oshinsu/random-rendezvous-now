
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_system: boolean;
  sender_name?: string;
}

export const useGroupChat = (groupId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Charger les messages existants
  const loadMessages = async () => {
    if (!groupId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur chargement messages:', error);
        throw error;
      }

      console.log('✅ Messages chargés:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      console.error('❌ Erreur loadMessages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message
  const sendMessage = async (messageText: string) => {
    if (!user || !messageText.trim() || sending) return false;

    setSending(true);
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          message: messageText.trim(),
          is_system: false
        });

      if (error) {
        console.error('❌ Erreur envoi message:', error);
        throw error;
      }

      console.log('✅ Message envoyé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur sendMessage:', error);
      return false;
    } finally {
      setSending(false);
    }
  };

  // Envoyer un message système (pour les notifications automatiques)
  const sendSystemMessage = async (messageText: string) => {
    if (!messageText.trim()) return false;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID factice pour les messages système
          message: messageText.trim(),
          is_system: true
        });

      if (error) {
        console.error('❌ Erreur envoi message système:', error);
        throw error;
      }

      console.log('✅ Message système envoyé');
      return true;
    } catch (error) {
      console.error('❌ Erreur sendSystemMessage:', error);
      return false;
    }
  };

  // Configuration realtime améliorée
  useEffect(() => {
    if (!groupId || !user) return;

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Charger les messages initiaux
    loadMessages();

    // Configurer la souscription realtime pour les messages ET les changements de participants
    const messagesChannel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('🛰️ Nouveau message reçu:', payload.new);
          const newMessage = payload.new as ChatMessage;
          
          setMessages(prev => {
            // Éviter les doublons
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut de souscription messages:', status);
      });

    // Canal séparé pour les changements de participants (pour déclencher les messages système)
    const participantsChannel = supabase
      .channel(`group-participants-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_participants',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('🛰️ Changement de participant détecté:', payload);
          // Recharger les messages pour voir les nouveaux messages système
          setTimeout(() => {
            loadMessages();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut de souscription participants:', status);
      });

    return () => {
      console.log('🛰️ Nettoyage souscriptions realtime');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [groupId, user]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendSystemMessage,
    refreshMessages: loadMessages
  };
};
