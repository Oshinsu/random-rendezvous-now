
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
    queryKey: ['groupMessages', groupId, user?.id], // Clé unique par groupe ET utilisateur
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!groupId || !user) {
        console.log('🚫 Pas de groupe ou utilisateur, retour tableau vide');
        return [];
      }

      console.log('🔄 Chargement ULTRA-STRICT des messages pour groupe UNIQUE:', groupId, 'utilisateur:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId) // FILTRAGE ULTRA-STRICT par groupe UNIQUEMENT
          .order('created_at', { ascending: true })
          .limit(100); // Augmenter la limite pour voir s'il y a vraiment trop de messages

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
          console.log('✅ Aucun message trouvé pour le groupe:', groupId);
          return [];
        }

        // VÉRIFICATION ULTRA-STRICTE : Tous les messages DOIVENT appartenir au groupe actuel
        const strictGroupMessages = data.filter(msg => {
          const belongsToGroup = msg.group_id === groupId;
          if (!belongsToGroup) {
            console.error('🚨 MESSAGE ÉTRANGER DÉTECTÉ ET REJETÉ:', {
              messageId: msg.id,
              messageGroup: msg.group_id,
              expectedGroup: groupId,
              messageText: msg.message.substring(0, 50)
            });
          }
          return belongsToGroup;
        });

        // Déduplication des messages système identiques
        const uniqueMessages = strictGroupMessages.reduce((acc: ChatMessage[], current) => {
          if (current.is_system) {
            // Pour les messages système, vérifier s'il existe déjà un message identique
            const existingSystemMessage = acc.find(msg => 
              msg.is_system && 
              msg.message === current.message &&
              Math.abs(new Date(msg.created_at).getTime() - new Date(current.created_at).getTime()) < 60000 // 1 minute
            );
            
            if (existingSystemMessage) {
              console.log('🗑️ Message système dupliqué ignoré:', current.message.substring(0, 50));
              return acc;
            }
          }
          
          // Vérifier qu'on n'a pas déjà ce message exact (par ID)
          const existingMessage = acc.find(msg => msg.id === current.id);
          if (existingMessage) {
            console.log('🗑️ Message dupliqué (même ID) ignoré:', current.id);
            return acc;
          }
          
          return [...acc, current];
        }, []);

        console.log('✅ Messages ULTRA-FILTRÉS pour groupe', groupId, ':', uniqueMessages.length);
        console.log('📊 Détail des messages finaux:', uniqueMessages.map(m => ({ 
          id: m.id, 
          group: m.group_id, 
          text: m.message.substring(0, 30),
          time: m.created_at,
          isSystem: m.is_system
        })));
        
        return uniqueMessages;
      } catch (error) {
        ErrorHandler.logError('FETCH_MESSAGES', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }
    },
    enabled: !!groupId && !!user,
    refetchInterval: 5000,
    staleTime: 1000, // Réduire le stale time pour forcer plus de rafraîchissements
  });

  const updateMessagesCache = (newMessage: ChatMessage) => {
    // VÉRIFICATION ULTRA-CRITIQUE : le message doit appartenir EXACTEMENT au bon groupe
    if (newMessage.group_id !== groupId) {
      console.error('🚨 TENTATIVE D\'INTRUSION DE MESSAGE ÉTRANGER BLOQUÉE:', {
        messageGroup: newMessage.group_id,
        currentGroup: groupId,
        messageId: newMessage.id,
        messageText: newMessage.message.substring(0, 50)
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

      console.log('✅ Ajout du nouveau message VALIDÉ au cache pour groupe:', groupId);
      return [...oldMessages, newMessage];
    });
  };

  const invalidateMessages = () => {
    console.log('🔄 Invalidation COMPLÈTE du cache pour groupe:', groupId);
    // Invalider ET supprimer complètement le cache
    queryClient.removeQueries({ 
      queryKey: ['groupMessages', groupId, user?.id],
      exact: true 
    });
    // Forcer un nouveau fetch
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['groupMessages', groupId, user?.id],
        exact: true 
      });
    }, 100);
  };

  return {
    messages,
    loading,
    refreshMessages,
    updateMessagesCache,
    invalidateMessages
  };
};
