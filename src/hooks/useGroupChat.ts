
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
  const lastSystemMessageRef = useRef<string>('');

  // Fonction pour déduplication des messages
  const deduplicateMessages = useCallback((messagesList: ChatMessage[]) => {
    const seen = new Set();
    const uniqueMessages = messagesList.filter(msg => {
      // Pour les messages système, on vérifie aussi le contenu pour éviter les doublons
      const key = msg.is_system ? `${msg.message}_${msg.created_at}` : msg.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Trier par date de création
    return uniqueMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  // Fonction pour nettoyer les messages anciens et redondants
  const cleanupMessages = useCallback((messagesList: ChatMessage[]) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Garder les messages récents et limiter les messages système répétitifs
    const cleanedMessages = messagesList.filter(msg => {
      const msgDate = new Date(msg.created_at);
      
      // Garder tous les messages récents (moins de 24h)
      if (msgDate > oneDayAgo) {
        return true;
      }
      
      // Pour les anciens messages, garder seulement les non-système
      return !msg.is_system;
    });

    // Limiter le nombre total de messages pour éviter l'accumulation
    return cleanedMessages.slice(-50); // Garder les 50 derniers messages
  }, []);

  // Charger les messages existants avec debouncing
  const loadMessages = useCallback(async () => {
    if (!groupId || !user || loadingRef.current) {
      console.log('❌ Impossible de charger messages: conditions non remplies');
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
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur chargement messages:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Messages bruts chargés:', data.length);
        const deduplicatedMessages = deduplicateMessages(data);
        const cleanedMessages = cleanupMessages(deduplicatedMessages);
        console.log('✅ Messages finaux après nettoyage:', cleanedMessages.length);
        setMessages(cleanedMessages);
      }
    } catch (error) {
      console.error('❌ Erreur loadMessages:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [groupId, user?.id, deduplicateMessages, cleanupMessages]);

  // Envoyer un message avec vérification anti-spam
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
      return true;
    } catch (error) {
      console.error('❌ Erreur sendMessage:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [user, groupId, sending]);

  // Envoyer un message système avec protection anti-spam
  const sendSystemMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return false;

    // Vérifier si le même message système a été envoyé récemment
    if (lastSystemMessageRef.current === messageText) {
      console.log('⚠️ Message système identique ignoré (anti-spam):', messageText);
      return false;
    }

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000',
          message: messageText.trim(),
          is_system: true
        });

      if (error) {
        console.error('❌ Erreur envoi message système:', error);
        throw error;
      }

      // Mémoriser le dernier message système pour éviter les doublons
      lastSystemMessageRef.current = messageText;
      
      // Reset de la protection après 30 secondes
      setTimeout(() => {
        if (lastSystemMessageRef.current === messageText) {
          lastSystemMessageRef.current = '';
        }
      }, 30000);

      console.log('✅ Message système envoyé avec protection anti-spam');
      return true;
    } catch (error) {
      console.error('❌ Erreur sendSystemMessage:', error);
      return false;
    }
  }, [groupId]);

  // Configuration realtime améliorée avec debouncing
  useEffect(() => {
    if (!groupId || !user) {
      console.log('❌ Pas de configuration realtime: groupId ou user manquant');
      return;
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Charger les messages initiaux
    loadMessages();

    // Nettoyer l'ancienne souscription si elle existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Configurer la nouvelle souscription realtime avec debouncing amélioré
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
          
          // Debouncing : attendre un peu avant d'ajouter le message
          setTimeout(() => {
            setMessages(prev => {
              // Vérifier si le message existe déjà
              const messageExists = prev.some(msg => msg.id === newMessage.id);
              if (messageExists) {
                console.log('⚠️ Message déjà présent, ignoré:', newMessage.id);
                return prev;
              }
              
              const newMessages = [...prev, newMessage];
              const deduplicatedMessages = deduplicateMessages(newMessages);
              const cleanedMessages = cleanupMessages(deduplicatedMessages);
              
              console.log('✅ Nouveau message ajouté après nettoyage. Total:', cleanedMessages.length);
              return cleanedMessages;
            });
          }, 100); // Debouncing de 100ms
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
          // Recharger les messages en cas de problème avec debouncing
          setTimeout(() => {
            loadMessages();
          }, 3000); // Augmenté à 3 secondes
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🛰️ Nettoyage souscription realtime pour groupe:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user?.id, loadMessages, deduplicateMessages, cleanupMessages]);

  // Nettoyage périodique des messages (toutes les 5 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setMessages(prev => {
        const cleaned = cleanupMessages(prev);
        if (cleaned.length !== prev.length) {
          console.log('🧹 Nettoyage automatique:', prev.length, '->', cleaned.length);
        }
        return cleaned;
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [cleanupMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendSystemMessage,
    refreshMessages: loadMessages
  };
};
