
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useProfileUpdate = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (firstName: string, lastName: string, onSuccess?: () => void) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour mettre à jour votre profil.',
        variant: 'destructive'
      });
      return false;
    }

    setIsUpdating(true);
    
    try {
      // 1. Mise à jour des métadonnées utilisateur
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authError) {
        throw authError;
      }

      // 2. Mise à jour du profil dans la base de données
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        throw profileError;
      }

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées avec succès.',
      });

      // Call success callback to refresh data
      onSuccess?.();

      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil. Veuillez réessayer.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateProfile,
    isUpdating
  };
};
