
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
    queryKey: ['groupMessages', groupId, user?.id], // Inclure user.id pour isoler par utilisateur
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!groupId || !user) {
        console.log('🚫 Pas de groupe ou utilisateur, retour tableau vide');
        return [];
      }

      console.log('🔄 Chargement STRICT des messages pour groupe:', groupId, 'utilisateur:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId) // FILTRAGE STRICT par groupe
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

        // Vérification supplémentaire côté client
        const groupSpecificMessages = (data || []).filter(msg => msg.group_id === groupId);

        // Filtrer pour réduire les messages système
        const filteredMessages = groupSpecificMessages.filter(msg => {
          // Garder tous les messages des utilisateurs
          if (!msg.is_system) return true;
          
          // Pour les messages système, ne garder que les plus importants
          return msg.message.includes('Rendez-vous au') || 
                 msg.message.includes('bar assigné') ||
                 msg.message.includes('groupe complet');
        });

        console.log('✅ Messages chargés et filtrés pour groupe', groupId, ':', filteredMessages.length);
        console.log('📊 Détail des messages:', filteredMessages.map(m => ({ id: m.id, group: m.group_id, text: m.message.substring(0, 50) })));
        
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
    // VÉRIFICATION CRITIQUE : le message doit appartenir au bon groupe
    if (newMessage.group_id !== groupId) {
      console.log('🚫 Tentative d\'ajout d\'un message d\'un autre groupe, REJETÉ:', {
        messageGroup: newMessage.group_id,
        currentGroup: groupId
      });
      return;
    }

    queryClient.setQueryData(['groupMessages', groupId, user?.id], (oldMessages: ChatMessage[] = []) => {
      // Vérifier que le message n'existe pas déjà
      const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        console.log('⚠️ Message déjà existant dans le cache, ignoré');
        return oldMessages;
      }

      console.log('✅ Ajout du nouveau message au cache pour groupe:', groupId);
      return [...oldMessages, newMessage];
    });
  };

  const invalidateMessages = () => {
    console.log('🔄 Invalidation du cache pour groupe:', groupId);
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
