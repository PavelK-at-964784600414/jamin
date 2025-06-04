// Safari-compatible service worker for production mode
// Minimal implementation to avoid Safari SSL/security issues

const CACHE_NAME = 'jamin-v3';
const STATIC_CACHE_NAME = 'jamin-static-v3';

// Essential files to cache (minimal for Safari compatibility)
const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Safari-compatible service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS);
      })
      .catch((error) => {
        console.warn('[SW] Failed to cache essential assets:', error);
        return Promise.resolve();
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Safari-compatible service worker');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// NO FETCH EVENT HANDLER for Safari compatibility
// This prevents interference with Next.js static assets in Safari production mode

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Safari-compatible service worker loaded successfully');
