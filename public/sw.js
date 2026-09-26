// Service Worker for Muttagundi Digital Village PWA with Push Notifications
const CACHE_NAME = 'gramasiri-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/logo-192.png',
  '/logo-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first with cache fallback for standard fetches
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache API or Firestore calls
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('broker.hivemq.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// --- PUSH NOTIFICATION HANDLERS FOR MOBILE & DESKTOP ---

// 1. Listen for background push events
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : 'ಹೊಸ ಗ್ರಾಮ ಸುದ್ದಿ / New Village Update' };
  }

  const title = data.title || 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ | MTG Village';
  const options = {
    body: data.body || 'ಗ್ರಾಮದ ಹೊಸ ಸುದ್ದಿ ಅಥವಾ ಪ್ರಕಟಣೆ ಹಂಚಿಕೊಳ್ಳಲಾಗಿದೆ.',
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'mtg-village-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      section: data.section || 'news',
      itemId: data.itemId
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Client message trigger (for in-app / local cross-device push)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
});

// 3. User taps on the mobile push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const targetSection = event.notification.data?.section || 'news';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and post a message to navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_SECTION',
            section: targetSection,
            itemId: event.notification.data?.itemId
          });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
