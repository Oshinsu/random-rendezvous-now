
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const channelRef = useRef<any>(null);
  const loadingRef = useRef(false);

  // Fonction pour déduplication des messages (simplifiée)
  const deduplicateMessages = useCallback((messagesList: ChatMessage[]) => {
    const seen = new Set();
    const uniqueMessages = messagesList.filter(msg => {
      if (seen.has(msg.id)) {
        return false;
      }
      seen.add(msg.id);
      return true;
    });

    // Trier par date de création
    return uniqueMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  // Charger les messages existants
  const loadMessages = useCallback(async () => {
    if (!groupId || !user || loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔄 Chargement des messages pour groupe:', groupId);
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100); // Limiter à 100 messages récents

      if (error) {
        console.error('❌ Erreur chargement messages:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Messages bruts chargés:', data.length);
        const deduplicatedMessages = deduplicateMessages(data);
        console.log('✅ Messages après déduplication:', deduplicatedMessages.length);
        setMessages(deduplicatedMessages);
      }
    } catch (error) {
      console.error('❌ Erreur loadMessages:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [groupId, user?.id, deduplicateMessages]);

  // Envoyer un message
  const sendMessage = useCallback(async (messageText: string) => {
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
      
      // Ajouter immédiatement le message à la liste locale pour un feedback instantané
      if (data) {
        setMessages(prev => {
          const newMessages = [...prev, data];
          return deduplicateMessages(newMessages);
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur sendMessage:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [user, groupId, sending, deduplicateMessages]);

  // Configuration realtime simplifiée
  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Charger les messages initiaux
    loadMessages();

    // Nettoyer l'ancienne souscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Configurer la nouvelle souscription realtime
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
            // Vérifier si le message existe déjà
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log('⚠️ Message déjà présent, ignoré:', newMessage.id);
              return prev;
            }
            
            const newMessages = [...prev, newMessage];
            const deduplicatedMessages = deduplicateMessages(newMessages);
            console.log('✅ Nouveau message ajouté. Total:', deduplicatedMessages.length);
            return deduplicatedMessages;
          });
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut souscription realtime:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🛰️ Nettoyage souscription realtime pour groupe:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user?.id, loadMessages, deduplicateMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refreshMessages: loadMessages
  };
};
