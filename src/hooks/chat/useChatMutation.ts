
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/chat';

export const useChatMutation = (groupId: string, onSuccess: (message: ChatMessage) => void) => {
  const { user } = useAuth();

  return useMutation({
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
      onSuccess(newMessage);
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
};
