const CACHE_NAME = 'jamin-v2'
const STATIC_CACHE = 'jamin-static-v2'
const DYNAMIC_CACHE = 'jamin-dynamic-v2'
const OFFLINE_CACHE = 'jamin-offline-v2'

const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/dashboard/tools',
  '/login',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

const CRITICAL_RESOURCES = [
  '/dashboard/tools',
  '/api/errors'
]

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('[SW] Caching offline page')
        return cache.add('/offline')
      })
    ])
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, OFFLINE_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE)
    )
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE)
        .catch(() => {
          return caches.match('/offline') || caches.match('/')
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE)
    )
    return
  }

  // Handle dynamic content with stale-while-revalidate
  event.respondWith(
    staleWhileRevalidate(request, DYNAMIC_CACHE)
  )
})

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Network request failed:', error)
    throw error
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(cacheName)
      cache.then((c) => c.put(request, response.clone()))
    }
    return response
  }).catch(() => {
    // Return cached response if network fails
    return cachedResponse
  })

  return cachedResponse || fetchPromise
}

// Check if URL is a static asset
function isStaticAsset(url) {
  return (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/static/') ||
    url.pathname.includes('/images/') ||
    url.pathname.includes('/icons/') ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
  )
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...')
  // Implement background sync logic for offline actions
  try {
    // Send queued data when online
    const queuedData = await getQueuedData()
    if (queuedData.length > 0) {
      await sendQueuedData(queuedData)
      await clearQueuedData()
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open Jamin',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192x192.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Helper functions for background sync
async function getQueuedData() {
  // Implement logic to retrieve queued data from IndexedDB
  return []
}

async function sendQueuedData(data) {
  // Implement logic to send queued data to server
  console.log('[SW] Sending queued data:', data)
}

async function clearQueuedData() {
  // Implement logic to clear queued data from IndexedDB
  console.log('[SW] Clearing queued data')
}
