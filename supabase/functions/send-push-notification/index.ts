import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  image?: string;
  url?: string;
  type?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      user_ids,
      title,
      body,
      data = {},
      icon,
      image,
      url,
      type = 'default',
      requireInteraction = true,
      silent = false,
    }: PushNotificationRequest = await req.json();

    console.log(`📤 Sending push notifications to ${user_ids.length} users`);

    // 1. Créer les notifications in-app
    const notificationRecords = user_ids.map(user_id => ({
      user_id,
      type,
      title,
      body,
      icon,
      image,
      data,
      action_url: url,
    }));

    const { data: createdNotifications, error: notifError } = await supabase
      .from('user_notifications')
      .insert(notificationRecords)
      .select();

    if (notifError) {
      throw new Error(`Failed to create notifications: ${notifError.message}`);
    }

    console.log(`✅ Created ${createdNotifications.length} in-app notifications`);

    // 2. Récupérer les tokens push des utilisateurs
    const { data: tokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, device_type, user_id')
      .in('user_id', user_ids)
      .gt('last_used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Tokens < 30 jours

    if (tokensError) {
      console.error('❌ Error fetching tokens:', tokensError);
    }

    if (!tokens || tokens.length === 0) {
      console.warn('⚠️ No push tokens found for users');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'In-app notifications created, but no push tokens found',
          in_app_notifications: createdNotifications.length,
          push_sent: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Envoyer via FCM (Firebase Cloud Messaging)
    const FCM_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY');
    
    if (!FCM_SERVER_KEY) {
      console.warn('⚠️ FIREBASE_SERVER_KEY not configured, skipping push notifications');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'In-app notifications created, but FCM not configured',
          in_app_notifications: createdNotifications.length,
          push_sent: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fcmPayload = {
      registration_ids: tokens.map(t => t.token),
      notification: {
        title,
        body,
        icon: icon || '/icon-192.png',
        badge: '/badge-72.png',
        image,
        click_action: url || '/groups',
        tag: `random-${type}-${Date.now()}`,
        renotify: true,
        requireInteraction,
        silent,
      },
      data: {
        ...data,
        url: url || '/groups',
        type,
        notification_id: createdNotifications[0]?.id,
        timestamp: Date.now(),
      },
      priority: 'high',
      time_to_live: 86400, // 24 heures
    };

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmResult = await fcmResponse.json();

    console.log('📊 FCM Response:', {
      success: fcmResult.success,
      failure: fcmResult.failure,
      canonical_ids: fcmResult.canonical_ids,
    });

    // 4. Track analytics
    if (createdNotifications.length > 0) {
      const analyticsRecords = createdNotifications.map(notif => ({
        notification_id: notif.id,
        event_type: 'sent',
        device_type: 'web',
        metadata: {
          fcm_success: fcmResult.success || 0,
          fcm_failure: fcmResult.failure || 0,
        },
      }));

      await supabase
        .from('notification_analytics')
        .insert(analyticsRecords);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent successfully',
        in_app_notifications: createdNotifications.length,
        push_sent: fcmResult.success || 0,
        push_failed: fcmResult.failure || 0,
        results: fcmResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});