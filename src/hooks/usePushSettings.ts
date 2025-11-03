import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PushSettings {
  maxNotificationsPerDay: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  abTestingEnabled: boolean;
  autoCleanupDays: number;
  vapidPublicKey: string;
}

export const usePushSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['push-settings'],
    queryFn: async (): Promise<PushSettings> => {
      // Fetch from system_settings table
      const { data: rateLimitData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'push_rate_limit_per_day')
        .maybeSingle();

      const { data: quietHoursData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'push_quiet_hours')
        .maybeSingle();

      const { data: abTestingData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'push_ab_testing_enabled')
        .maybeSingle();

      const { data: cleanupData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'push_auto_cleanup_days')
        .maybeSingle();

      return {
        maxNotificationsPerDay: typeof rateLimitData?.setting_value === 'object' && Array.isArray(rateLimitData.setting_value) 
          ? (rateLimitData.setting_value[0] as number) 
          : 5,
        quietHoursStart: typeof quietHoursData?.setting_value === 'object' && !Array.isArray(quietHoursData.setting_value)
          ? ((quietHoursData.setting_value as any).start as number)
          : 22,
        quietHoursEnd: typeof quietHoursData?.setting_value === 'object' && !Array.isArray(quietHoursData.setting_value)
          ? ((quietHoursData.setting_value as any).end as number)
          : 9,
        abTestingEnabled: typeof abTestingData?.setting_value === 'object' && Array.isArray(abTestingData.setting_value)
          ? (abTestingData.setting_value[0] as boolean)
          : false,
        autoCleanupDays: typeof cleanupData?.setting_value === 'object' && Array.isArray(cleanupData.setting_value)
          ? (cleanupData.setting_value[0] as number)
          : 30,
        vapidPublicKey: import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY || '',
      };
    },
    staleTime: Infinity, // Config rarely changes
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number | boolean | { start: number; end: number } }) => {
      const settingKey = `push_${key}`;
      const settingValue = typeof value === 'object' ? value : [value];
      
      await supabase.rpc('update_system_setting', {
        setting_name: settingKey,
        new_value: settingValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-settings'] });
      toast.success('✅ Paramètre mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`❌ Erreur: ${error.message}`);
    },
  });

  const cleanupTokens = useMutation({
    mutationFn: async () => {
      const daysAgo = settings?.autoCleanupDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const result = await supabase
        .from('user_push_tokens')
        .delete()
        .eq('is_active', false)
        .lt('updated_at', cutoffDate.toISOString());

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success('✅ Tokens inactifs nettoyés');
    },
    onError: (error: Error) => {
      toast.error(`❌ Erreur: ${error.message}`);
    },
  });

  return {
    settings,
    isLoading,
    updateSetting: updateSetting.mutate,
    cleanupTokens: cleanupTokens.mutate,
    isUpdating: updateSetting.isPending,
    isCleaning: cleanupTokens.isPending,
  };
};
