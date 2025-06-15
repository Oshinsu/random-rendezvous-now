
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

  // Query pour récupérer les messages avec validation de sécurité
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
          .limit(100);

        if (error) {
          ErrorHandler.logError('FETCH_MESSAGES', error);
          // Gestion spécifique des erreurs de sécurité RLS
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

        console.log('✅ Messages chargés:', data.length);
        return data || [];
      } catch (error) {
        ErrorHandler.logError('FETCH_MESSAGES', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }
    },
    enabled: !!groupId && !!user,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Mutation pour envoyer un message avec validation de sécurité
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string): Promise<ChatMessage> => {
      if (!user || !messageText.trim()) {
        throw new Error('Message invalide');
      }

      // Le message sera automatiquement validé et nettoyé par le trigger
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
        
        // Gestion spécifique des erreurs de validation
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
      console.log('✅ Message envoyé avec succès (validation sécurisée):', newMessage);
      
      // Mettre à jour optimistiquement le cache
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

  // Configuration realtime avec cleanup automatique
  useEffect(() => {
    if (!groupId || !user) {
      return;
    }

    console.log('🛰️ Configuration realtime pour groupe:', groupId);
    
    // Nettoyer l'ancienne souscription si elle existe
    if (channelRef.current) {
      console.log('🧹 Nettoyage de l\'ancienne souscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Configurer la nouvelle souscription
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
          
          queryClient.setQueryData(['groupMessages', groupId], (oldMessages: ChatMessage[] = []) => {
            const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log('⚠️ Message déjà présent, ignoré:', newMessage.id);
              return oldMessages;
            }
            
            console.log('✅ Nouveau message ajouté via realtime');
            return [...oldMessages, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('🛰️ Statut souscription realtime:', status);
      });

    channelRef.current = channel;

    // Fonction de nettoyage pour useEffect
    return () => {
      console.log('🛰️ Nettoyage souscription realtime pour groupe:', groupId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user, queryClient]);

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
