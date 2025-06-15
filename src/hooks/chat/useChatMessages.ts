
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/chat';

export const useChatMessages = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: messages = [], 
    isLoading: loading,
    refetch: refreshMessages 
  } = useQuery({
    queryKey: ['groupMessages', groupId, user?.id],
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

        if (!data) {
          return [];
        }

        // Filtrage strict par groupe
        const strictGroupMessages = data.filter(msg => msg.group_id === groupId);

        // Déduplication des messages système identiques (dans les 5 minutes)
        const uniqueMessages = strictGroupMessages.reduce((acc: ChatMessage[], current) => {
          if (current.is_system) {
            const existingSystemMessage = acc.find(msg => 
              msg.is_system && 
              msg.message === current.message &&
              Math.abs(new Date(msg.created_at).getTime() - new Date(current.created_at).getTime()) < 300000 // 5 minutes
            );
            
            if (existingSystemMessage) {
              return acc;
            }
          }
          
          // Vérifier qu'on n'a pas déjà ce message par ID
          const existingMessage = acc.find(msg => msg.id === current.id);
          if (existingMessage) {
            return acc;
          }
          
          return [...acc, current];
        }, []);

        console.log('✅ Messages chargés pour groupe', groupId, ':', uniqueMessages.length);
        return uniqueMessages;
      } catch (error) {
        ErrorHandler.logError('FETCH_MESSAGES', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }
    },
    enabled: !!groupId && !!user,
    staleTime: 30000, // Augmenter pour éviter les recharges constantes
    refetchInterval: false, // Désactiver le polling automatique, on utilise le realtime
  });

  const updateMessagesCache = (newMessage: ChatMessage) => {
    if (newMessage.group_id !== groupId) {
      console.error('🚨 Message pour mauvais groupe bloqué:', {
        messageGroup: newMessage.group_id,
        currentGroup: groupId
      });
      return;
    }

    queryClient.setQueryData(['groupMessages', groupId, user?.id], (oldMessages: ChatMessage[] = []) => {
      const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        return oldMessages;
      }

      console.log('✅ Nouveau message ajouté au cache');
      return [...oldMessages, newMessage];
    });
  };

  const invalidateMessages = () => {
    console.log('🔄 Invalidation du cache pour groupe:', groupId);
    // Invalidation simple sans suppression forcée
    queryClient.invalidateQueries({ 
      queryKey: ['groupMessages', groupId, user?.id],
      exact: true 
    });
  };

  return {
    messages,
    loading,
    refreshMessages,
    updateMessagesCache,
    invalidateMessages
  };
};
