/**
 * Firebase Cloud Messaging Service Worker
 * SOTA October 2025: FCM HTTP v1 API with Firebase SDK 10.x
 * 
 * Source: https://firebase.google.com/docs/cloud-messaging/js/receive
 * 
 * This Service Worker handles:
 * - Background notifications (when app is closed/minimized)
 * - Notification click actions
 * - Rich notifications (images, actions, badges)
 */

// Import Firebase SDK from CDN (SOTA October 2025: v11.0.2)
// Source: https://github.com/firebase/firebase-js-sdk/releases/tag/11.0.2
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Firebase config for Random app
const firebaseConfig = {
  apiKey: "AIzaSyC_2EWImbg_4_7gwWcUe1WJLzhAV2Xhutk",
  authDomain: "random-e1d35.firebaseapp.com",
  projectId: "random-e1d35",
  storageBucket: "random-e1d35.firebasestorage.app",
  messagingSenderId: "922028744926",
  appId: "1:922028744926:web:b32e54369fe9738425a24f",
  measurementId: "G-BFV3N51PP1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

/**
 * Handle background messages (when app is in background/closed)
 * SOTA October 2025: Rich notifications with images, actions, deep links
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Random Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/badge-icon.png',
    image: payload.notification?.image,
    tag: payload.data?.tag || 'random-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.fcmOptions?.link || payload.data?.action_url || '/',
      ...payload.data,
    },
    // SOTA 2025: Action buttons (max 2 on most browsers)
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [
      {
        action: 'open',
        title: 'Voir le groupe',
        icon: 'https://api.iconify.design/mdi:account-group.svg',
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: 'https://api.iconify.design/mdi:close.svg',
      },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 * SOTA October 2025: Deep linking support
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/';

  if (action === 'close') {
    // User clicked "Close" action
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
            action: action,
          });
          return client.focus();
        }
      }

      // App not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Handle push event (native Web Push API fallback)
 */
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);

      const notificationTitle = data.notification?.title || 'Random';
      const notificationOptions = {
        body: data.notification?.body || '',
        icon: data.notification?.icon || '/favicon.ico',
        badge: '/badge-icon.png',
        tag: 'random-push',
        requireInteraction: true,
        data: data.data || {},
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
});

console.log('[firebase-messaging-sw.js] Service Worker loaded (Firebase SDK 11.0.2 - FCM HTTP v1 API - SOTA October 2025)');
