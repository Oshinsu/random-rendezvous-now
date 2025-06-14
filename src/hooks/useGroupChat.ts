
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
    if (!groupId || !user) {
      console.log('❌ Impossible de charger messages: groupId ou user manquant');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Chargement des messages pour groupe:', groupId);
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur chargement messages:', error);
        throw error;
      }

      console.log('✅ Messages chargés depuis la DB:', data?.length || 0, data);
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
        throw error;
      }

      console.log('✅ Message envoyé avec succès:', data);
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

  // Configuration realtime avec gestion robuste des reconnexions
  useEffect(() => {
    if (!groupId || !user) {
      console.log('❌ Pas de configuration realtime: groupId ou user manquant');
      return;
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Charger les messages initiaux
    loadMessages();

    // Configurer la souscription realtime
    const channel = supabase
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
          console.log('🛰️ Nouveau message reçu via realtime:', payload.new);
          const newMessage = payload.new as ChatMessage;
          
          setMessages(prev => {
            console.log('🔍 [useGroupChat] Messages avant ajout:', prev.length);
            
            // Vérifier si le message existe déjà pour éviter les doublons
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log('⚠️ Message déjà présent, ignoré:', newMessage.id);
              return prev;
            }
            
            const newMessages = [...prev, newMessage];
            console.log('✅ Nouveau message ajouté. Total:', newMessages.length);
            console.log('🔍 [useGroupChat] Nouveau state messages:', newMessages);
            return newMessages;
          });
        }
      )
      .subscribe((status, err) => {
        console.log('🛰️ Statut souscription realtime:', status);
        if (err) {
          console.error('❌ Erreur souscription realtime:', err);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Souscription realtime active pour groupe:', groupId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('⚠️ Problème de connexion realtime, rechargement des messages...');
          // Recharger les messages en cas de problème de connexion
          setTimeout(() => {
            loadMessages();
          }, 2000);
        }
      });

    return () => {
      console.log('🛰️ Nettoyage souscription realtime pour groupe:', groupId);
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id]);

  // Debug: surveiller les changements de messages
  useEffect(() => {
    console.log('🔍 [useGroupChat] Messages state mis à jour:', {
      count: messages.length,
      messages: messages.map(m => ({ id: m.id, content: m.message, timestamp: m.created_at }))
    });
  }, [messages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendSystemMessage,
    refreshMessages: loadMessages
  };
};
