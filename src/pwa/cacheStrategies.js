// Cache strategies for different types of content

export const CACHE_NAMES = {
    STATIC: 'travel-plus-static-v1',
    DYNAMIC: 'travel-plus-dynamic-v1',
    IMAGES: 'travel-plus-images-v1',
    API: 'travel-plus-api-v1',
    MAPS: 'travel-plus-maps-v1',
  }
  
  export const CACHE_EXPIRATION = {
    API: 5 * 60 * 1000, // 5 minutes
    IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAPS: 30 * 24 * 60 * 60 * 1000, // 30 days
    DYNAMIC: 24 * 60 * 60 * 1000, // 24 hours
  }
  
  // Cache strategies
  export const strategies = {
    // Cache First - for static assets
    cacheFirst: async (request, cacheName = CACHE_NAMES.STATIC) => {
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then(response => {
          if (response.status === 200) {
            cache.put(request, response.clone())
          }
        })
        
        return cachedResponse
      }
      
      const networkResponse = await fetch(request)
      if (networkResponse.status === 200) {
        cache.put(request, networkResponse.clone())
      }
      
      return networkResponse
    },
  
    // Network First - for API calls
    networkFirst: async (request, cacheName = CACHE_NAMES.API, maxAge = CACHE_EXPIRATION.API) => {
      try {
        const networkResponse = await fetch(request)
        
        if (networkResponse.status === 200) {
          const cache = await caches.open(cacheName)
          cache.put(request, networkResponse.clone())
        }
        
        return networkResponse
      } catch (error) {
        // Fallback to cache
        const cache = await caches.open(cacheName)
        const cachedResponse = await cache.match(request)
        
        if (cachedResponse) {
          // Check if cache is expired
          const cachedDate = new Date(cachedResponse.headers.get('date'))
          const now = new Date()
          const age = now - cachedDate
          
          if (age < maxAge) {
            return cachedResponse
          }
        }
        
        throw error
      }
    },
  
    // Stale While Revalidate - best for dynamic content
    staleWhileRevalidate: async (request, cacheName = CACHE_NAMES.DYNAMIC) => {
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request)
      
      const fetchPromise = fetch(request).then(response => {
        if (response.status === 200) {
          cache.put(request, response.clone())
        }
        return response
      })
      
      return cachedResponse || fetchPromise
    },
  
    // Network Only - for non-cacheable requests
    networkOnly: async (request) => {
      return fetch(request)
    },
  
    // Cache Only - for offline-first content
    cacheOnly: async (request, cacheName = CACHE_NAMES.STATIC) => {
      const cache = await caches.open(cacheName)
      const cachedResponse = await cache.match(request)
      
      if (!cachedResponse) {
        throw new Error('No cached response found')
      }
      
      return cachedResponse
    },
  }
  
  // Precache essential assets
  export async function precacheAssets(assets) {
    const cache = await caches.open(CACHE_NAMES.STATIC)
    return cache.addAll(assets)
  }
  
  // Clean up old caches
  export async function cleanupCaches() {
    const cacheWhitelist = Object.values(CACHE_NAMES)
    const cacheNames = await caches.keys()
    
    return Promise.all(
      cacheNames
        .filter(cacheName => !cacheWhitelist.includes(cacheName))
        .map(cacheName => caches.delete(cacheName))
    )
  }
  
  // Cache size management
  export async function getCacheSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage, quota } = await navigator.storage.estimate()
      return {
        usage: Math.round(usage / 1024 / 1024), // MB
        quota: Math.round(quota / 1024 / 1024), // MB
        percentage: Math.round((usage / quota) * 100),
      }
    }
    return null
  }
  
  // Clear old cache entries
  export async function pruneCache(cacheName, maxItems = 50) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    if (requests.length > maxItems) {
      // Remove oldest entries
      const toDelete = requests.slice(0, requests.length - maxItems)
      await Promise.all(toDelete.map(request => cache.delete(request)))
    }
  }
  
  // Cache maps for offline use
  export async function cacheMapTiles(bounds, zoom) {
    const cache = await caches.open(CACHE_NAMES.MAPS)
    const tileUrls = generateTileUrls(bounds, zoom)
    
    const promises = tileUrls.map(async url => {
      try {
        const response = await fetch(url)
        if (response.status === 200) {
          await cache.put(url, response)
        }
      } catch (error) {
        console.error('Failed to cache map tile:', url, error)
      }
    })
    
    return Promise.all(promises)
  }
  
  // Generate map tile URLs for a given bounds
  function generateTileUrls(bounds, zoom) {
    // Simplified - in practice, you'd calculate the actual tile coordinates
    const urls = []
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
    
    // This is a placeholder - actual implementation would calculate tile grid
    urls.push(`${baseUrl}?center=${bounds.center.lat},${bounds.center.lng}&zoom=${zoom}`)
    
    return urls
  }
  
  // Export cache utilities
  export const cacheUtils = {
    // Check if request is cached
    isCached: async (request) => {
      const cacheNames = await caches.keys()
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const response = await cache.match(request)
        if (response) return true
      }
      return false
    },
  
    // Get cache metadata
    getCacheMetadata: async (request) => {
      const cacheNames = await caches.keys()
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const response = await cache.match(request)
        if (response) {
          return {
            cacheName,
            cachedAt: response.headers.get('date'),
            size: response.headers.get('content-length'),
          }
        }
      }
      return null
    },
  
    // Clear all caches
    clearAllCaches: async () => {
      const cacheNames = await caches.keys()
      return Promise.all(cacheNames.map(name => caches.delete(name)))
    },
  }