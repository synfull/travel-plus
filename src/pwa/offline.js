// Offline functionality for Travel+ PWA

import { openDB } from 'idb'

const DB_NAME = 'travel-plus-offline'
const DB_VERSION = 1

// Initialize IndexedDB
export async function initOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for itineraries
      if (!db.objectStoreNames.contains('itineraries')) {
        const itineraryStore = db.createObjectStore('itineraries', {
          keyPath: 'id',
        })
        itineraryStore.createIndex('createdAt', 'createdAt')
      }

      // Store for pending syncs
      if (!db.objectStoreNames.contains('pendingSync')) {
        db.createObjectStore('pendingSync', {
          keyPath: 'id',
        })
      }

      // Store for cached destinations
      if (!db.objectStoreNames.contains('destinations')) {
        const destStore = db.createObjectStore('destinations', {
          keyPath: 'id',
        })
        destStore.createIndex('name', 'name')
      }
    },
  })
}

// Save itinerary for offline access
export async function saveItineraryOffline(itinerary) {
  const db = await initOfflineDB()
  
  const offlineItinerary = {
    ...itinerary,
    savedAt: new Date().toISOString(),
    isOffline: true,
  }
  
  await db.put('itineraries', offlineItinerary)
  return offlineItinerary
}

// Get all offline itineraries
export async function getOfflineItineraries() {
  const db = await initOfflineDB()
  return db.getAll('itineraries')
}

// Get specific offline itinerary
export async function getOfflineItinerary(id) {
  const db = await initOfflineDB()
  return db.get('itineraries', id)
}

// Delete offline itinerary
export async function deleteOfflineItinerary(id) {
  const db = await initOfflineDB()
  return db.delete('itineraries', id)
}

// Queue action for sync when online
export async function queueForSync(action) {
  const db = await initOfflineDB()
  
  const syncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }
  
  await db.put('pendingSync', syncItem)
  
  // Register for background sync if available
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-itineraries')
  }
  
  return syncItem
}

// Get pending sync items
export async function getPendingSyncItems() {
  const db = await initOfflineDB()
  return db.getAll('pendingSync')
}

// Clear completed sync item
export async function clearSyncItem(id) {
  const db = await initOfflineDB()
  return db.delete('pendingSync', id)
}

// Cache popular destinations for offline
export async function cacheDestinations(destinations) {
  const db = await initOfflineDB()
  
  const tx = db.transaction('destinations', 'readwrite')
  await Promise.all(
    destinations.map(dest => tx.store.put({
      ...dest,
      cachedAt: new Date().toISOString(),
    }))
  )
  
  await tx.done
}

// Get cached destinations
export async function getCachedDestinations() {
  const db = await initOfflineDB()
  return db.getAll('destinations')
}

// Network status handler
export class NetworkStatus {
  constructor() {
    this.isOnline = navigator.onLine
    this.listeners = new Set()
    
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  handleOnline() {
    this.isOnline = true
    this.notifyListeners('online')
    this.syncPendingData()
  }

  handleOffline() {
    this.isOnline = false
    this.notifyListeners('offline')
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status))
  }

  async syncPendingData() {
    const pendingItems = await getPendingSyncItems()
    
    for (const item of pendingItems) {
      try {
        // Process based on action type
        if (item.action.type === 'CREATE_ITINERARY') {
          const response = await fetch('/.netlify/functions/generate-itinerary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.action.data),
          })
          
          if (response.ok) {
            await clearSyncItem(item.id)
          }
        }
      } catch (error) {
        console.error('Sync failed for item:', item.id, error)
      }
    }
  }
}

// Export singleton instance
export const networkStatus = new NetworkStatus()

// Offline-first data fetching
export async function fetchWithOfflineFallback(url, options = {}) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return response
  } catch (error) {
    // Try to get from cache
    const cache = await caches.open('travel-plus-api-v1')
    const cachedResponse = await cache.match(url)
    
    if (cachedResponse) {
      // Add offline indicator
      const data = await cachedResponse.json()
      return new Response(JSON.stringify({
        ...data,
        _offline: true,
        _cachedAt: cachedResponse.headers.get('date'),
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    throw error
  }
}

// PWA install prompt handler
export class InstallPrompt {
  constructor() {
    this.deferredPrompt = null
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.showInstallButton()
    })
    
    window.addEventListener('appinstalled', () => {
      console.log('Travel+ PWA installed')
      this.deferredPrompt = null
      this.hideInstallButton()
    })
  }

  async prompt() {
    if (!this.deferredPrompt) return false
    
    this.deferredPrompt.prompt()
    const { outcome } = await this.deferredPrompt.userChoice
    
    console.log(`User response to install prompt: ${outcome}`)
    
    this.deferredPrompt = null
    return outcome === 'accepted'
  }

  showInstallButton() {
    // Emit event that components can listen to
    window.dispatchEvent(new CustomEvent('caninstall'))
  }

  hideInstallButton() {
    window.dispatchEvent(new CustomEvent('appinstalled'))
  }
}

// Export singleton instance
export const installPrompt = new InstallPrompt()