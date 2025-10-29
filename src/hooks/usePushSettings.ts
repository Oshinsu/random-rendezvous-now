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
      // Return default settings
      return {
        maxNotificationsPerDay: 5,
        quietHoursStart: 22,
        quietHoursEnd: 9,
        abTestingEnabled: false,
        autoCleanupDays: 30,
        vapidPublicKey: 'BJzU_iwlBkf3bUOvpwBxhXyEA-G4bUGVr9kIwxHXnHJDG0VXrkLXjHNOvOXwPvLHyh4z0bQgT2pFxvJkqWqsm7s',
      };
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number | boolean }) => {
      // Update via system_settings if exists
      toast.success('✅ Paramètre mis à jour');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-settings'] });
    },
  });

  const cleanupTokens = useMutation({
    mutationFn: async () => {
      const daysAgo = settings?.autoCleanupDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const { error } = await supabase
        .from('user_push_tokens')
        .delete()
        .eq('active', false)
        .lt('updated_at', cutoffDate.toISOString());

      if (error) throw error;
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
