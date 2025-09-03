import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAccountDeletion = () => {
  const { user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour supprimer votre compte.',
        variant: 'destructive'
      });
      return false;
    }

    setIsDeleting(true);
    
    try {
      // Call the database function to delete all user data
      const { error: deleteError } = await supabase.rpc('delete_user_account', {
        target_user_id: user.id
      });

      if (deleteError) {
        throw deleteError;
      }

      // Sign out the user after successful deletion
      await signOut();

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte et toutes vos données ont été supprimés définitivement.',
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du compte:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la suppression de votre compte.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount,
    isDeleting
  };
};