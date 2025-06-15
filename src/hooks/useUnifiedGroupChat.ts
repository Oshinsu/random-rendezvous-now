
import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';

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
  const channelRef = useRef<any>(null);

  // Query pour récupérer SEULEMENT les messages de CE groupe
  const { 
    data: messages = [], 
    isLoading: loading,
    refetch: refreshMessages 
  } = useQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!groupId || !user) {
        return [];
      }

      console.log('🔄 Chargement des messages pour groupe:', groupId);
      
      try {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
          .limit(50); // Réduire la limite pour de meilleures performances

        if (error) {
          ErrorHandler.logError('FETCH_MESSAGES', error);
          if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
            toast({
              title: 'Accès refusé',
              description: 'Vous n\'avez pas accès aux messages de ce groupe.',
              variant: 'destructive'
            });
          } else {
            const appError = ErrorHandler.handleSupabaseError(error);
            ErrorHandler.showErrorToast(appError);
          }
          return [];
        }

        // Filtrer pour réduire les messages système
        const filteredMessages = (data || []).filter(msg => {
          // Garder tous les messages des utilisateurs
          if (!msg.is_system) return true;
          
          // Pour les messages système, ne garder que les plus importants
          return msg.message.includes('Rendez-vous au') || 
                 msg.message.includes('bar assigné') ||
                 msg.message.includes('groupe complet');
        });

        console.log('✅ Messages chargés et filtrés:', filteredMessages.length);
        return filteredMessages;
      } catch (error) {
        ErrorHandler.logError('FETCH_MESSAGES', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }
    },
    enabled: !!groupId && !!user,
    refetchInterval: 15000, // Réduire la fréquence de refetch
    staleTime: 10000,
  });

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string): Promise<ChatMessage> => {
      if (!user || !messageText.trim()) {
        throw new Error('Message invalide');
      }

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
        ErrorHandler.logError('SEND_MESSAGE', error);
        
        if (error.message.includes('Message cannot be empty')) {
          throw new Error('Le message ne peut pas être vide.');
        } else if (error.message.includes('Message too long')) {
          throw new Error('Le message est trop long (maximum 500 caractères).');
        } else if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
          throw new Error('Vous n\'avez pas le droit d\'envoyer des messages dans ce groupe.');
        } else {
          const appError = ErrorHandler.handleSupabaseError(error);
          throw appError;
        }
      }

      return data;
    },
    onSuccess: (newMessage) => {
      console.log('✅ Message envoyé au groupe:', groupId);
      
      // Mettre à jour optimistiquement le cache pour CE groupe seulement
      queryClient.setQueryData(['groupMessages', groupId], (oldMessages: ChatMessage[] = []) => {
        const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return oldMessages;
        }
        return [...oldMessages, newMessage];
      });
    },
    onError: (error) => {
      ErrorHandler.logError('SEND_MESSAGE_MUTATION', error);
      toast({
        title: 'Erreur d\'envoi',
        description: error.message || 'Impossible d\'envoyer le message.',
        variant: 'destructive'
      });
    }
  });

  // Configuration realtime spécifique au groupe avec cleanup automatique
  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Nettoyer l'ancienne souscription
    if (channelRef.current) {
      console.log('🧹 Nettoyage de l\'ancienne souscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Configurer la nouvelle souscription SPÉCIFIQUE à ce groupe
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}` // IMPORTANT: Filtrer par groupe
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Vérifier que le message appartient bien à ce groupe
          if (newMessage.group_id !== groupId) {
            console.log('⚠️ Message pour un autre groupe, ignoré');
            return;
          }

          // Filtrer les messages système moins importants en temps réel aussi
          if (newMessage.is_system) {
            const isImportantSystemMessage = newMessage.message.includes('Rendez-vous au') || 
                                           newMessage.message.includes('bar assigné') ||
                                           newMessage.message.includes('groupe complet');
            
            if (!isImportantSystemMessage) {
              console.log('⚠️ Message système non important, ignoré');
              return;
            }
          }

          console.log('🛰️ Nouveau message reçu pour groupe:', groupId);
          
          queryClient.setQueryData(['groupMessages', groupId], (oldMessages: ChatMessage[] = []) => {
            const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              return oldMessages;
            }
            return [...oldMessages, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut souscription realtime pour groupe', groupId, ':', status);
      });

    channelRef.current = channel;

    // Fonction de nettoyage
    return () => {
      console.log('🛰️ Nettoyage souscription realtime pour groupe:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user, queryClient]);

  // Nettoyer le cache quand on change de groupe
  useEffect(() => {
    if (groupId) {
      console.log('🔄 Nouveau groupe détecté, réinitialisation du cache:', groupId);
      // Invalider et refetch les messages pour ce nouveau groupe
      queryClient.invalidateQueries({ queryKey: ['groupMessages', groupId] });
    }
  }, [groupId, queryClient]);

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
