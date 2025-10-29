import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

// Interface for push notification requests
interface PushNotificationRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  action_url?: string;
  image?: string;
  icon?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

// Cache for FCM Access Token (valid 1 hour)
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Generate OAuth 2.0 Access Token for FCM HTTP v1 API
 * SOTA October 2025: Migration from legacy Server Key to OAuth 2.0
 * Source: https://firebase.google.com/docs/cloud-messaging/migrate-v1
 */
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now) {
    console.log('✅ Using cached FCM access token');
    return cachedAccessToken.token;
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const privateKey = serviceAccount.private_key;
  const clientEmail = serviceAccount.client_email;

  // Create JWT
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60), // 1 hour
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    },
    await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )
  );

  // Exchange JWT for Access Token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`❌ FCM OAuth failed: ${error}`);
  }

  const data = await response.json();
  
  // Cache token for 50 minutes (10 min buffer before expiry)
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + 50 * 60 * 1000,
  };

  console.log('✅ Generated new FCM access token (valid 50min)');
  return data.access_token;
}

/**
 * Send FCM notification using HTTP v1 API
 * SOTA October 2025: Rich notifications with images, actions, deep links
 * Source: https://firebase.google.com/docs/cloud-messaging/send-message
 */
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  notification: {
    title: string;
    body: string;
    image?: string;
    icon?: string;
  },
  data?: Record<string, unknown>,
  actionUrl?: string,
  actions?: Array<{ action: string; title: string; icon?: string }>
): Promise<boolean> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message: Record<string, unknown> = {
    token: fcmToken,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.image && { image: notification.image }),
    },
    webpush: {
      notification: {
        icon: notification.icon || 'https://random.app/notification-icon.png', // Random branding
        badge: 'https://random.app/badge-icon.png', // Random badge
        ...(actions && actions.length > 0 && { actions }),
        requireInteraction: true,
        tag: 'random-notification',
      },
      ...(actionUrl && {
        fcm_options: {
          link: actionUrl,
        },
      }),
    },
    ...(data && { data }),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ FCM send failed for token ${fcmToken.substring(0, 20)}...: ${error}`);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  // CORS headers for web app requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📬 FCM HTTP v1 API - SOTA October 2025');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')!;
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID')!;

    if (!serviceAccountJson || !projectId) {
      throw new Error('❌ Missing Firebase credentials. Please add FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_PROJECT_ID secrets.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      user_ids,
      title,
      body,
      data = {},
      action_url,
      image,
      icon = 'https://random.app/notification-icon.png',
      actions,
    }: PushNotificationRequest = await req.json();

    console.log(`📤 Sending push notifications to ${user_ids.length} users`);

    // Step 1: Create in-app notifications
    const notificationRecords = user_ids.map((user_id) => ({
      user_id,
      type: data.type as string || 'default',
      title,
      body,
      icon: icon || 'https://random.app/notification-icon.png', // Random branding
      image: image || 'https://random.app/notif-group-forming.png', // Default contextual image
      data,
      action_url,
    }));

    const { data: createdNotifications, error: notifError } = await supabase
      .from('user_notifications')
      .insert(notificationRecords)
      .select();

    if (notifError) {
      throw new Error(`Failed to create notifications: ${notifError.message}`);
    }

    console.log(`✅ Created ${createdNotifications.length} in-app notifications`);

    // Step 2: Get active push tokens (< 30 days)
    const { data: activeTokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, device_type, user_id')
      .in('user_id', user_ids)
      .gt('last_used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (tokensError || !activeTokens || activeTokens.length === 0) {
      console.log('⚠️ No active push tokens found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'In-app notifications created, but no push tokens',
          sent: 0,
          failed: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Determine notification type
    const notificationType = (data.type as string) || 'default';

    // Step 4: Filter valid recipients using RPC (preferences, quiet hours, rate limits)
    console.log(`🔍 Filtering ${activeTokens.length} recipients...`);
    const { data: validUserIds, error: filterError } = await supabase.rpc(
      'filter_valid_notification_recipients',
      {
        p_user_ids: user_ids,
        p_notification_type: notificationType,
      }
    );

    if (filterError) {
      console.error('❌ Filter error:', filterError);
      throw filterError;
    }

    if (!validUserIds || validUserIds.length === 0) {
      console.log('⚠️ No valid recipients after filtering (preferences/rate limits)');
      return new Response(
        JSON.stringify({ success: true, message: 'No valid recipients', sent: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${validUserIds.length} valid recipients after filtering`);

    // Step 5: Get FCM tokens for valid users
    const { data: fcmTokens, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('token, user_id')
      .in('user_id', validUserIds)
      .eq('is_active', true);

    if (tokenError || !fcmTokens || fcmTokens.length === 0) {
      console.log('⚠️ No FCM tokens found for valid users');
      return new Response(
        JSON.stringify({ success: true, message: 'No FCM tokens', sent: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending to ${fcmTokens.length} FCM tokens...`);

    // Step 6: Generate OAuth 2.0 Access Token for FCM HTTP v1 API
    const accessToken = await getAccessToken(serviceAccountJson);

    // Step 7: Send notifications via FCM HTTP v1 API (one by one, no batch endpoint)
    let totalSuccess = 0;
    let totalFailure = 0;

    for (const { token, user_id } of fcmTokens) {
      const success = await sendFCMNotification(
        accessToken,
        projectId,
        token,
        { title, body, image, icon },
        data,
        action_url,
        actions
      );

      if (success) {
        totalSuccess++;
        
        // Record notification send for rate limiting
        await supabase.rpc('record_notification_send', {
          p_user_id: user_id,
          p_notification_type: notificationType,
        });
      } else {
        totalFailure++;
      }
    }

    console.log(`✅ FCM send complete: ${totalSuccess} success, ${totalFailure} failures`);

    // Step 8: Track analytics
    await supabase.from('notification_analytics').insert({
      notification_type: notificationType,
      total_recipients: user_ids.length,
      filtered_recipients: validUserIds.length,
      successful_sends: totalSuccess,
      failed_sends: totalFailure,
      metadata: {
        title,
        body,
        has_image: !!image,
        has_actions: !!(actions && actions.length > 0),
        has_action_url: !!action_url,
        fcm_api_version: 'v1',
        oauth_used: true,
      },
    });

    console.log('📊 Analytics tracked (FCM HTTP v1 API)');

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSuccess,
        failed: totalFailure,
        api_version: 'FCM HTTP v1 (OAuth 2.0)',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
