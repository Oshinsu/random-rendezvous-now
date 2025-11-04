import { supabase } from '@/integrations/supabase/client';

/**
 * SOTA 2025: Centralized notification tracking service
 * Sépare les opérations UI (read_at) des analytics tracking
 * pour éviter la perte de données d'engagement
 */

export const notificationTracking = {
  /**
   * Track notification open (analytics)
   * Appelle la RPC function qui incrémente opened_count dans notification_analytics
   */
  trackOpen: async (notificationId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('track_notification_open', {
        p_notification_id: notificationId,
        p_user_id: userId,
      });

      if (error) {
        console.error('❌ Failed to track notification open:', error);
      } else {
        console.log('✅ Notification open tracked:', notificationId);
      }
    } catch (err) {
      console.error('❌ Exception tracking open:', err);
    }
  },

  /**
   * Track notification click (analytics)
   * Appelle la RPC function qui incrémente clicked_count dans notification_analytics
   */
  trackClick: async (
    notificationId: string,
    userId: string,
    action: string = 'default'
  ) => {
    try {
      const { error } = await supabase.rpc('track_notification_click', {
        p_notification_id: notificationId,
        p_user_id: userId,
        p_action: action,
      });

      if (error) {
        console.error('❌ Failed to track notification click:', error);
      } else {
        console.log('✅ Notification click tracked:', notificationId, action);
      }
    } catch (err) {
      console.error('❌ Exception tracking click:', err);
    }
  },

  /**
   * Track notification conversion (analytics)
   * Appelle la RPC function qui incrémente converted_count dans notification_analytics
   */
  trackConversion: async (notificationId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('track_notification_conversion', {
        p_notification_id: notificationId,
        p_user_id: userId,
      });

      if (error) {
        console.error('❌ Failed to track notification conversion:', error);
      } else {
        console.log('✅ Notification conversion tracked:', notificationId);
      }
    } catch (err) {
      console.error('❌ Exception tracking conversion:', err);
    }
  },
};
