// Service Worker for aggressive image caching
const CACHE_NAME = 'random-images-v1';
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('random-images-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only cache images from Supabase Storage
  if (
    request.method === 'GET' && 
    (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/'))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Check if cached response is still valid
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
            const now = new Date();
            
            if (now - cachedDate < IMAGE_CACHE_DURATION) {
              console.log('Serving from cache:', request.url);
              return cachedResponse;
            }
          }
          
          // Fetch from network and cache
          return fetch(request).then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              console.log('Caching new image:', request.url);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((error) => {
            console.error('Fetch failed:', error);
            // Return cached response even if expired as fallback
            return cachedResponse || Promise.reject(error);
          });
        });
      })
    );
  }
});
