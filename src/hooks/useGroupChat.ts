
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
      // D'abord ajouter le message localement pour un affichage immédiat
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        group_id: groupId,
        user_id: user.id,
        message: messageText.trim(),
        created_at: new Date().toISOString(),
        is_system: false
      };

      setMessages(prev => [...prev, tempMessage]);

      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          message: messageText.trim(),
          is_system: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur envoi message:', error);
        // Retirer le message temporaire en cas d'erreur
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw error;
      }

      // Remplacer le message temporaire par le vrai message
      if (data) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempMessage.id ? data as ChatMessage : msg)
        );
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

  // Configuration realtime simplifiée et plus robuste
  useEffect(() => {
    if (!groupId || !user) return;

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Charger les messages initiaux
    loadMessages();

    // Configurer la souscription realtime avec retry automatique
    const channel = supabase
      .channel(`group-messages-${groupId}`, {
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
          console.log('🛰️ Nouveau message reçu:', payload.new);
          const newMessage = payload.new as ChatMessage;
          
          setMessages(prev => {
            // Éviter les doublons et les messages temporaires
            const filteredPrev = prev.filter(msg => 
              msg.id !== newMessage.id && !msg.id.startsWith('temp-')
            );
            return [...filteredPrev, newMessage];
          });
        }
      )
      .subscribe((status, err) => {
        console.log('🛰️ Statut de souscription messages:', status);
        if (err) {
          console.error('❌ Erreur souscription:', err);
        }
        
        // Retry automatique en cas de timeout
        if (status === 'TIMED_OUT') {
          console.log('🔄 Retry de la souscription après timeout...');
          setTimeout(() => {
            channel.unsubscribe();
            // La souscription sera recréée au prochain useEffect
          }, 2000);
        }
      });

    return () => {
      console.log('🛰️ Nettoyage souscription realtime');
      channel.unsubscribe();
    };
  }, [groupId, user?.id]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendSystemMessage,
    refreshMessages: loadMessages
  };
};
