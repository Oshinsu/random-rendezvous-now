import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationHistoryItem {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  open_rate: number;
  click_rate: number;
  read_at: string | null;
}

export interface SendTestNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
}

export const usePushNotificationsAdmin = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['push-notifications-history'],
    queryFn: async (): Promise<NotificationHistoryItem[]> => {
      // Get recent notifications from user_notifications
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, type, title, body, created_at, read_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get analytics for each notification if available
      const notificationsWithAnalytics = await Promise.all(
        (data || []).map(async (notif) => {
          const { data: analytics } = await supabase
            .from('notification_analytics')
            .select('open_rate, click_rate')
            .eq('notification_id', notif.id)
            .maybeSingle();

          return {
            ...notif,
            open_rate: analytics?.open_rate || 0,
            click_rate: analytics?.click_rate || 0,
          };
        })
      );

      return notificationsWithAnalytics;
    },
  });

  const sendTestNotification = useMutation({
    mutationFn: async (params: SendTestNotificationParams) => {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: params.userId,
          notification: {
            title: params.title,
            body: params.body,
            icon: params.imageUrl || '/notification-icon.png',
            badge: '/badge-icon.png',
            data: {
              type: params.type,
              url: params.actionUrl || '/dashboard',
              timestamp: new Date().toISOString(),
            },
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('✅ Notification test envoyée avec succès');
      queryClient.invalidateQueries({ queryKey: ['push-notifications-history'] });
    },
    onError: (error: Error) => {
      toast.error(`❌ Erreur: ${error.message}`);
    },
  });

  return {
    notifications,
    isLoading,
    sendTestNotification: sendTestNotification.mutate,
    isSending: sendTestNotification.isPending,
  };
};
