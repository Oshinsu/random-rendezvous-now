
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/chat';

export const useChatMessages = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Clé de cache ultra spécifique pour éviter les conflits
  const cacheKey = ['groupMessages', groupId, user?.id, Date.now()];

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

      console.log('🔄 Chargement STRICT des messages pour groupe:', groupId);
      
      try {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId) // Filtrage ultra strict
          .order('created_at', { ascending: true })
          .limit(50); // Réduire la limite pour éviter les conflits

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

        // Filtrage ULTRA strict - rejeter tout message qui n'est pas du bon groupe
        const strictMessages = data.filter(msg => {
          const isCorrectGroup = msg.group_id === groupId;
          if (!isCorrectGroup) {
            console.error('🚨 Message ÉTRANGER détecté et REJETÉ:', {
              messageGroup: msg.group_id,
              expectedGroup: groupId,
              messageId: msg.id
            });
          }
          return isCorrectGroup;
        });

        console.log('✅ Messages STRICTEMENT filtrés pour groupe', groupId, ':', strictMessages.length);
        return strictMessages;
      } catch (error) {
        ErrorHandler.logError('FETCH_MESSAGES', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }
    },
    enabled: !!groupId && !!user,
    staleTime: 0,
    gcTime: 0, // Suppression immédiate
    refetchInterval: false,
  });

  const updateMessagesCache = (newMessage: ChatMessage) => {
    // Vérification ULTRA stricte avant mise à jour
    if (!newMessage || newMessage.group_id !== groupId) {
      console.error('🚨 REJET TOTAL du message pour mauvais groupe:', {
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

      console.log('✅ Nouveau message validé et ajouté pour groupe:', groupId);
      return [...oldMessages, newMessage];
    });
  };

  const invalidateMessages = () => {
    console.log('🧹 NETTOYAGE TOTAL et AGRESSIF du cache pour groupe:', groupId);
    
    // Suppression brutale de TOUS les caches de messages
    queryClient.removeQueries({ 
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === 'groupMessages';
      }
    });
    
    // Nettoyage spécifique pour ce groupe
    queryClient.invalidateQueries({ 
      queryKey: ['groupMessages', groupId],
      exact: false 
    });
    
    // Nettoyage avec la nouvelle clé
    queryClient.removeQueries({
      queryKey: cacheKey,
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
