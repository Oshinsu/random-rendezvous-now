
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
    queryKey: ['groupMessages', groupId], // Retirer user?.id pour éviter les conflits
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!groupId || !user) {
        return [];
      }

      console.log('🔄 Chargement des messages pour groupe:', groupId);
      
      try {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId) // Filtrage strict par groupe uniquement
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

        // Triple vérification : filtrage ultra strict
        const strictGroupMessages = data.filter(msg => {
          const isCorrectGroup = msg.group_id === groupId;
          if (!isCorrectGroup) {
            console.warn('🚨 Message étranger détecté et rejeté:', msg.group_id, 'vs', groupId);
          }
          return isCorrectGroup;
        });

        // Déduplication des messages avec ID identique
        const uniqueMessages = strictGroupMessages.reduce((acc: ChatMessage[], current) => {
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
    staleTime: 0, // Pas de cache entre les groupes
    gcTime: 0, // Suppression immédiate du cache
    refetchInterval: false,
  });

  const updateMessagesCache = (newMessage: ChatMessage) => {
    // Vérification ultra stricte avant mise à jour du cache
    if (newMessage.group_id !== groupId) {
      console.error('🚨 Tentative d\'ajout de message pour mauvais groupe bloquée:', {
        messageGroup: newMessage.group_id,
        currentGroup: groupId,
        messageId: newMessage.id
      });
      return;
    }

    queryClient.setQueryData(['groupMessages', groupId], (oldMessages: ChatMessage[] = []) => {
      // Vérifier si le message existe déjà
      const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        console.log('ℹ️ Message déjà en cache, ignoré');
        return oldMessages;
      }

      console.log('✅ Nouveau message ajouté au cache pour groupe:', groupId);
      return [...oldMessages, newMessage];
    });
  };

  const invalidateMessages = () => {
    console.log('🧹 Nettoyage complet du cache pour groupe:', groupId);
    // Nettoyage agressif de tous les caches de messages
    queryClient.removeQueries({ 
      queryKey: ['groupMessages'], 
      exact: false 
    });
    // Invalidation spécifique pour ce groupe
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
