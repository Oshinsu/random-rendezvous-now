
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MessageReactions {
  [emoji: string]: string[]; // emoji -> array of user IDs
}

export const useMessageReactions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) {
      toast.error('Erreur', {
        description: 'Vous devez être connecté pour réagir'
      });
      return false;
    }

    setLoading(true);
    try {
      // D'abord, récupérer les réactions actuelles
      const { data: message, error: fetchError } = await supabase
        .from('group_messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération des réactions:', fetchError);
        return false;
      }

      const currentReactions: MessageReactions = (message.reactions as MessageReactions) || {};
      const emojiReactions = currentReactions[emoji] || [];
      
      let newReactions: MessageReactions;
      
      if (emojiReactions.includes(user.id)) {
        // Retirer la réaction
        newReactions = {
          ...currentReactions,
          [emoji]: emojiReactions.filter(id => id !== user.id)
        };
        
        // Supprimer l'emoji s'il n'y a plus de réactions
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        // Ajouter la réaction
        newReactions = {
          ...currentReactions,
          [emoji]: [...emojiReactions, user.id]
        };
      }

      // Mettre à jour les réactions
      const { error: updateError } = await supabase
        .from('group_messages')
        .update({ reactions: newReactions })
        .eq('id', messageId);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour des réactions:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur toggleReaction:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    toggleReaction,
    loading
  };
};
