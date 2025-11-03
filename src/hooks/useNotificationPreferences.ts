import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { Json } from '@/integrations/supabase/types';

export interface NotificationPreferences {
  enabled: boolean;
  groups_notifications: boolean;
  bars_notifications: boolean;
  lifecycle_notifications: boolean;
  messages_notifications: boolean;
  promotions_notifications: boolean;
  quiet_hours_start: number | string;
  quiet_hours_end: number | string;
  max_per_day: number | string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  custom_copies?: Json;
  custom_images?: Json;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        setLoading(false);
        return;
      }

      // Create default preferences if none exist
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
        } else {
          setPreferences(newPrefs);
        }
      } else {
        setPreferences(data);
      }

      setLoading(false);
    };

    fetchPreferences();
  }, [user]);

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_notification_preferences')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      toast.error('❌ Erreur de mise à jour');
      console.error(error);
      return;
    }

    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    toast.success('✅ Préférences mises à jour');
  };

  return {
    preferences,
    loading,
    updatePreference,
  };
};
