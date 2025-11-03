import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettings {
  maxGroupSize: number;
  defaultSearchRadius: number;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  autoCleanupEnabled: boolean;
  cleanupIntervalHours: number;
  googleOAuthEnabled: boolean;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    maxGroupSize: 5,
    defaultSearchRadius: 25000,
    maintenanceMode: false,
    emailNotifications: true,
    autoCleanupEnabled: true,
    cleanupIntervalHours: 24,
    googleOAuthEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch all settings from database
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        const settingsMap = data.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {} as Record<string, any>);

        setSettings({
          maxGroupSize: parseInt(settingsMap.max_group_size) || 5,
          defaultSearchRadius: parseInt(settingsMap.default_search_radius) || 25000,
          maintenanceMode: settingsMap.maintenance_mode === true,
          emailNotifications: settingsMap.email_notifications === true,
          autoCleanupEnabled: settingsMap.auto_cleanup_enabled === true,
          cleanupIntervalHours: parseInt(settingsMap.cleanup_interval_hours) || 24,
          googleOAuthEnabled: settingsMap.google_oauth_enabled === 'true' || settingsMap.google_oauth_enabled === true
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: SystemSettings) => {
    try {
      setSaving(true);
      setError(null);

      // Update each setting in the database
      const updates = [
        { key: 'max_group_size', value: newSettings.maxGroupSize.toString() },
        { key: 'default_search_radius', value: newSettings.defaultSearchRadius.toString() },
        { key: 'maintenance_mode', value: newSettings.maintenanceMode },
        { key: 'email_notifications', value: newSettings.emailNotifications },
        { key: 'auto_cleanup_enabled', value: newSettings.autoCleanupEnabled },
        { key: 'cleanup_interval_hours', value: newSettings.cleanupIntervalHours.toString() },
        { key: 'google_oauth_enabled', value: newSettings.googleOAuthEnabled.toString() }
      ];

      for (const update of updates) {
        const { error } = await supabase.rpc('update_system_setting', {
          setting_name: update.key,
          new_value: JSON.stringify(update.value)
        });
        
        if (error) throw error;
      }

      setSettings(newSettings);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      console.error('Error saving settings:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    refetch: fetchSettings
  };
};