
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import { SystemMessagingService } from '@/services/systemMessaging';
import type { ChatMessage } from '@/types/chat';

export const useChatMessages = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Clé de cache spécifique pour éviter les conflits
  const cacheKey = ['groupMessages', groupId, user?.id];

  const { 
    data: messages = [], 
    isLoading: loading,
    refetch: refreshMessages 
  } = useQuery({
    queryKey: cacheKey,
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

        // Filtrage strict pour s'assurer qu'on n'a que les messages du bon groupe
        const strictMessages = data.filter(msg => msg.group_id === groupId);

        // Si aucun message et que c'est un nouveau groupe, créer le message de bienvenue
        if (strictMessages.length === 0) {
          console.log('🎉 Nouveau groupe détecté, création du message de bienvenue');
          await SystemMessagingService.createWelcomeMessage(groupId);
          
          // Recharger après création du message
          setTimeout(() => {
            refreshMessages();
          }, 500);
        }

        console.log('✅ Messages chargés pour groupe', groupId, ':', strictMessages.length);
        return strictMessages;
      } catch (error) {
        ErrorHandler.logError('FETCH_MESSAGES', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }
    },
    enabled: !!groupId && !!user,
    staleTime: 30000, // 30 secondes avant de considérer comme périmé
    gcTime: 300000, // 5 minutes en cache
    refetchInterval: false,
    retry: (failureCount, error: any) => {
      // Retry seulement si ce n'est pas une erreur de permission
      if (error?.message?.includes('permission denied')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  const updateMessagesCache = (newMessage: ChatMessage) => {
    // Vérification stricte avant mise à jour
    if (!newMessage || newMessage.group_id !== groupId) {
      console.error('🚨 Message rejeté pour mauvais groupe:', {
        messageGroup: newMessage?.group_id,
        currentGroup: groupId,
        messageId: newMessage?.id
      });
      return;
    }

    queryClient.setQueryData(cacheKey, (oldMessages: ChatMessage[] = []) => {
      // Vérifier les doublons
      const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        console.log('ℹ️ Message déjà en cache, ignoré');
        return oldMessages;
      }

      console.log('✅ Nouveau message ajouté pour groupe:', groupId);
      return [...oldMessages, newMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  };

  const invalidateMessages = () => {
    console.log('🧹 Nettoyage du cache pour groupe:', groupId);
    
    // Suppression du cache spécifique
    queryClient.removeQueries({
      queryKey: cacheKey,
      exact: true
    });
    
    // Invalider aussi les requêtes générales de messages
    queryClient.invalidateQueries({ 
      queryKey: ['groupMessages'],
      exact: false 
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
