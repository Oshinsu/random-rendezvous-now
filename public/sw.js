// ============================================
// SERVICE WORKER AVANCÉ - Random App
// Gestion des notifications push, cache, et actions
// ============================================

const CACHE_NAME = 'random-images-v1';
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

// ============================================
// INSTALLATION & ACTIVATION
// ============================================

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation');
  self.skipWaiting(); // Active immédiatement
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activation');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Nettoyage ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('📬 Push notification reçue');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('❌ Erreur parsing notification:', e);
    data = {
      title: 'Random',
      body: event.data ? event.data.text() : 'Nouvelle notification',
    };
  }

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    image: data.image,
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      url: data.url || '/groups',
      group_id: data.group_id,
      notification_id: data.notification_id,
      type: data.type || 'default',
      timestamp: Date.now(),
      ...data.data
    },
    actions: [
      { 
        action: 'open', 
        title: '👀 Voir', 
        icon: '/icons/view.png' 
      },
      { 
        action: 'dismiss', 
        title: '✖️ Fermer', 
        icon: '/icons/close.png' 
      }
    ],
    tag: data.tag || `random-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction !== false,
    silent: data.silent || false,
    timestamp: Date.now(),
    dir: 'ltr',
    lang: 'fr'
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || '🎉 Random',
      options
    ).then(() => {
      console.log('✅ Notification affichée:', data.title);
      
      // Track analytics (sent event)
      if (data.notification_id) {
        trackNotificationEvent(data.notification_id, 'delivered', 'web');
      }
    })
  );
});

// ============================================
// NOTIFICATION ACTIONS
// ============================================

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification cliquée:', event.action);
  
  event.notification.close();

  const notificationData = event.notification.data;
  const url = notificationData.url || '/groups';

  // Track analytics
  if (notificationData.notification_id) {
    trackNotificationEvent(
      notificationData.notification_id, 
      event.action === 'dismiss' ? 'dismissed' : 'clicked',
      'web'
    );
  }

  if (event.action === 'dismiss') {
    return;
  }

  // Action 'open' ou clic sur notification
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Essayer de focus une fenêtre existante
      for (const client of clientList) {
        if (client.url.includes(new URL(url).pathname) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Ouvrir nouvelle fenêtre si aucune n'existe
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification fermée');
  
  const notificationData = event.notification.data;
  
  if (notificationData.notification_id) {
    trackNotificationEvent(notificationData.notification_id, 'dismissed', 'web');
  }
});

// ============================================
// ANALYTICS HELPER
// ============================================

async function trackNotificationEvent(notificationId, eventType, deviceType) {
  try {
    const response = await fetch('/api/track-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_id: notificationId,
        event_type: eventType,
        device_type: deviceType,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      console.warn('⚠️ Failed to track notification event');
    }
  } catch (error) {
    console.error('❌ Error tracking notification:', error);
  }
}

// ============================================
// CACHE IMAGES (existant)
// ============================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache uniquement les images de Supabase
  if (event.request.method === 'GET' && 
      url.hostname.includes('supabase.co') && 
      url.pathname.includes('/storage/')) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          
          if (cachedResponse) {
            const cachedTime = parseInt(cachedResponse.headers.get('sw-cached-time') || '0');
            const now = Date.now();
            
            if (now - cachedTime < IMAGE_CACHE_DURATION) {
              return cachedResponse;
            }
          }
          
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              const headers = new Headers(responseToCache.headers);
              headers.append('sw-cached-time', Date.now().toString());
              
              const cachedResponseWithTime = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              
              cache.put(event.request, cachedResponseWithTime);
            }
            return networkResponse;
          }).catch(() => {
            return cachedResponse || new Response('Image non disponible', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
      })
    );
  }
});

// ============================================
// BACKGROUND SYNC (pour notifications offline)
// ============================================

self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Synchroniser les notifications non lues depuis le serveur
    const response = await fetch('/api/notifications/sync', {
      method: 'POST',
    });
    
    if (response.ok) {
      console.log('✅ Notifications synchronisées');
    }
  } catch (error) {
    console.error('❌ Erreur sync notifications:', error);
  }
}

console.log('🚀 Service Worker Random chargé et prêt!');