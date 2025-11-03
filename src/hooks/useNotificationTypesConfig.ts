import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Client Supabase sans types pour éviter TS2589
const supabaseUrl = "https://xhrievvdnajvylyrowwu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface NotificationTypeConfig {
  id: string;
  type_key: string;
  display_name: string;
  category: 'groups' | 'lifecycle' | 'bars' | 'messages' | 'promotions';
  is_active: boolean;
  priority: number;
  default_copy: any;
  send_rules: any;
  description: string | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Stats agrégées
  total_sent_30d?: number;
  open_rate?: number;
  last_sent_at?: string | null;
}

export const useNotificationTypesConfig = () => {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['notification-types-config'],
    queryFn: async (): Promise<NotificationTypeConfig[]> => {
      const { data, error }: any = await supabase
        .from('notification_types_config')
        .select('*')
        .order('category', { ascending: true })
        .order('priority', { ascending: false });

      if (error) throw error;

      // Enrichir avec stats des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const enriched = await Promise.all(
        (data || []).map(async (config: any) => {
          // Total envoyées
          const { count }: any = await supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('type', config.type_key)
            .gte('created_at', thirtyDaysAgo.toISOString());

          // Open rate depuis notification_analytics
          const { data: analyticsData }: any = await supabase
            .from('notification_analytics')
            .select('open_rate')
            .eq('notification_type', config.type_key)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .limit(1);

          // Dernière envoyée
          const { data: lastSentData }: any = await supabase
            .from('user_notifications')
            .select('created_at')
            .eq('type', config.type_key)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...config,
            total_sent_30d: count || 0,
            open_rate: analyticsData?.[0]?.open_rate || 0,
            last_sent_at: lastSentData?.[0]?.created_at || null,
          } as NotificationTypeConfig;
        })
      );

      return enriched;
    },
    refetchInterval: 30000,
  });

  const toggleActivation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error }: any = await supabase
        .from('notification_types_config')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.is_active ? '✅ Notification activée' : '🔕 Notification désactivée');
      queryClient.invalidateQueries({ queryKey: ['notification-types-config'] });
    },
    onError: (error: Error) => {
      toast.error(`❌ Erreur: ${error.message}`);
    },
  });

  const addNotificationType = useMutation({
    mutationFn: async (newConfig: any) => {
      const { error }: any = await supabase
        .from('notification_types_config')
        .insert(newConfig);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Notification ajoutée');
      queryClient.invalidateQueries({ queryKey: ['notification-types-config'] });
    },
    onError: (error: Error) => {
      toast.error(`❌ Erreur: ${error.message}`);
    },
  });

  const updateNotificationType = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error }: any = await supabase
        .from('notification_types_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Notification mise à jour');
      queryClient.invalidateQueries({ queryKey: ['notification-types-config'] });
    },
    onError: (error: Error) => {
      toast.error(`❌ Erreur: ${error.message}`);
    },
  });

  return {
    configs,
    isLoading,
    toggleActivation: toggleActivation.mutate,
    isToggling: toggleActivation.isPending,
    addNotificationType: addNotificationType.mutate,
    isAdding: addNotificationType.isPending,
    updateNotificationType: updateNotificationType.mutate,
    isUpdating: updateNotificationType.isPending,
  };
};
