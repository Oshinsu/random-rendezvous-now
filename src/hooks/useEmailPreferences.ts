import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmailPreferences {
  id?: string;
  user_id: string;
  group_notifications: boolean;
  scheduled_reminders: boolean;
  newsletter: boolean;
  marketing_emails: boolean;
  all_emails_disabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useEmailPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: user.id,
          group_notifications: true,
          scheduled_reminders: true,
          newsletter: true,
          marketing_emails: true,
          all_emails_disabled: false,
        };

        const { data: created, error: createError } = await supabase
          .from('user_email_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(created);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos préférences email.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<EmailPreferences>) => {
    if (!user || !preferences) return false;

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences email ont été sauvegardées.',
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder vos préférences.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const unsubscribeFromAll = async () => {
    return updatePreferences({ all_emails_disabled: true });
  };

  const resubscribeToAll = async () => {
    return updatePreferences({ all_emails_disabled: false });
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    updating,
    updatePreferences,
    unsubscribeFromAll,
    resubscribeToAll,
    refreshPreferences: fetchPreferences
  };
};