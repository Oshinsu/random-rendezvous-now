
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BarRating {
  id: string;
  bar_place_id: string;
  bar_name: string;
  bar_address: string;
  total_ratings: number;
  sum_ratings: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export const useBarRating = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const rateBar = async (outingId: string, rating: number, review?: string) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour noter un bar',
        variant: 'destructive'
      });
      return false;
    }

    if (rating < 1 || rating > 5) {
      toast({
        title: 'Erreur',
        description: 'La note doit être entre 1 et 5',
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_outings_history')
        .update({
          user_rating: rating,
          user_review: review || null,
          rated_at: new Date().toISOString()
        })
        .eq('id', outingId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur lors de la notation:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de sauvegarder votre note',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Note enregistrée',
        description: 'Merci pour votre évaluation !',
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur rateBar:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBarRating = async (barPlaceId: string): Promise<BarRating | null> => {
    try {
      const { data, error } = await supabase
        .from('bar_ratings')
        .select('*')
        .eq('bar_place_id', barPlaceId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur lors de la récupération du rating:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur getBarRating:', error);
      return null;
    }
  };

  return {
    rateBar,
    getBarRating,
    loading
  };
};
