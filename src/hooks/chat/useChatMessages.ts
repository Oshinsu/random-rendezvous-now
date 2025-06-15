
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
          .limit(50);

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
    refetchInterval: 5000,
    staleTime: 2000,
  });

  const updateMessagesCache = (newMessage: ChatMessage) => {
    queryClient.setQueryData(['groupMessages', groupId], (oldMessages: ChatMessage[] = []) => {
      const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        return oldMessages;
      }
      return [...oldMessages, newMessage];
    });
  };

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['groupMessages', groupId],
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
