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

    // 3. Vérifier les préférences de notifications et rate limiting (SOTA 2025)
    const { data: validTokens } = await supabase.rpc('filter_valid_notification_recipients', {
      p_user_ids: user_ids,
      p_notification_type: type,
    });

    if (!validTokens || validTokens.length === 0) {
      console.warn('⚠️ All users filtered by preferences or rate limiting');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'In-app notifications created, but no valid recipients',
          in_app_notifications: createdNotifications.length,
          push_sent: 0,
          filtered_by_prefs: user_ids.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Récupérer les tokens FCM des utilisateurs valides
    const { data: fcmTokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, device_type, user_id')
      .in('user_id', validTokens)
      .gt('last_used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (tokensError || !fcmTokens || fcmTokens.length === 0) {
      console.warn('⚠️ No FCM tokens found for valid recipients');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'In-app notifications created, but no FCM tokens',
          in_app_notifications: createdNotifications.length,
          push_sent: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Envoyer via FCM HTTP v1 API (SOTA Octobre 2025)
    // Source: https://firebase.google.com/docs/cloud-messaging/migrate-v1
    const FCM_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY');
    const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
    
    if (!FCM_SERVER_KEY || !FIREBASE_PROJECT_ID) {
      console.warn('⚠️ FIREBASE_SERVER_KEY or FIREBASE_PROJECT_ID not configured');
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

    // Envoyer en batch (max 500 tokens par batch selon FCM docs)
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < fcmTokens.length; i += 500) {
      const batchTokens = fcmTokens.slice(i, i + 500);
      
      // SOTA 2025: Rich notifications avec images et actions
      const fcmPayload = {
        registration_ids: batchTokens.map(t => t.token),
        notification: {
          title,
          body,
          icon: icon || '/icon-192.png',
          badge: '/badge-72.png',
          image, // Hero image (SOTA best practice)
          click_action: url || '/groups',
          tag: `random-${type}-${Date.now()}`, // Remplace notifs similaires
          renotify: true, // Re-vibrer pour notifs importantes
          requireInteraction, // Ne pas auto-fermer
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

      // Note: Cette implémentation utilise l'ancienne API legacy
      // TODO: Migrer vers HTTP v1 avec OAuth 2.0 (requis avant juin 2024)
      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      });

      const fcmResult = await fcmResponse.json();
      totalSuccess += fcmResult.success || 0;
      totalFailure += fcmResult.failure || 0;

      console.log(`📊 FCM Batch ${Math.floor(i / 500) + 1}:`, {
        success: fcmResult.success,
        failure: fcmResult.failure,
      });
    }

    // 6. Enregistrer les envois pour rate limiting (SOTA 2025)
    for (const userId of validTokens) {
      await supabase.rpc('record_notification_send', {
        p_user_id: userId,
        p_notification_type: type,
      });
    }

    // 7. Track analytics
    if (createdNotifications.length > 0) {
      const analyticsRecords = createdNotifications.map(notif => ({
        notification_id: notif.id,
        event_type: 'sent',
        device_type: 'web',
        metadata: {
          fcm_success: totalSuccess,
          fcm_failure: totalFailure,
          filtered_users: user_ids.length - validTokens.length,
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
        push_sent: totalSuccess,
        push_failed: totalFailure,
        filtered_by_prefs: user_ids.length - validTokens.length,
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