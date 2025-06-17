// Service Worker for Travel+ PWA

const CACHE_NAME = 'travel-plus-v1'
const DYNAMIC_CACHE = 'travel-plus-dynamic-v1'
const API_CACHE = 'travel-plus-api-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// API routes to cache
const API_ROUTES = [
  '/api/popular-destinations',
  '/api/categories',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  
  // Force activation
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('travel-plus-') && 
                   cacheName !== CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== API_CACHE
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  
  // Take control of all clients
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Handle API requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Default: Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Handle API requests with cache strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.status === 200) {
      const responseClone = response.clone()
      const cache = await caches.open(API_CACHE)
      await cache.put(request, responseClone)
    }
    
    return response
  } catch (error) {
    // Try cache on network failure
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[Service Worker] Serving API from cache:', request.url)
      return cachedResponse
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Network error', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Try network and cache the response
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }
    throw error
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)
    return response
  } catch (error) {
    // Return cached page if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return caches.match('/offline.html')
  }
}

// Check if request is for static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.otf'
  ]
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)
  
  if (event.tag === 'sync-itineraries') {
    event.waitUntil(syncItineraries())
  }
})

// Sync offline itineraries when back online
async function syncItineraries() {
  try {
    // Get pending itineraries from IndexedDB
    const pendingItineraries = await getPendingItineraries()
    
    for (const itinerary of pendingItineraries) {
      try {
        const response = await fetch('/.netlify/functions/generate-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itinerary)
        })
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingItinerary(itinerary.id)
          
          // Notify client
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_COMPLETE',
                itineraryId: itinerary.id
              })
            })
          })
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync itinerary:', error)
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error)
  }
}

// Push notification support
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'View Itinerary',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Helper functions for IndexedDB (simplified)
async function getPendingItineraries() {
  // Implementation would use IndexedDB
  return []
}

async function removePendingItinerary(id) {
  // Implementation would use IndexedDB
  return true
}