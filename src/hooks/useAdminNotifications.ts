import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminNotification {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  created_at: string;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    // Unique channel name to prevent duplicate subscriptions
    const channelName = `admin-notifications-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_audit_log'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // No dependencies to avoid re-subscriptions

  const fetchNotifications = async () => {
    // Generate mock notifications based on system state
    const { data: stats } = await supabase.rpc('get_comprehensive_admin_stats');
    
    const newNotifications: AdminNotification[] = [];

    // Critical: API costs
    if (stats) {
      // Example critical alert
      newNotifications.push({
        id: 'api-cost-high',
        type: 'critical',
        title: '⚠️ High API Costs',
        message: 'API costs exceeded $10 today',
        actionUrl: '/admin/api',
        actionLabel: 'View Analytics',
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    refetch: fetchNotifications,
  };
};
