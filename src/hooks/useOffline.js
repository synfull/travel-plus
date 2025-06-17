import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { 
  networkStatus, 
  saveItineraryOffline, 
  getOfflineItineraries,
  queueForSync,
  installPrompt 
} from '../pwa/offline'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isInstallable, setIsInstallable] = useState(false)
  const [offlineItineraries, setOfflineItineraries] = useState([])
  const [syncPending, setSyncPending] = useState(false)

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatus.subscribe((status) => {
      setIsOnline(status === 'online')
      
      if (status === 'online') {
        toast.success('You\'re back online!', {
          icon: '🌐',
          duration: 3000,
        })
        checkPendingSync()
      } else {
        toast('You\'re offline', {
          icon: '📵',
          duration: 4000,
          style: {
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          },
        })
      }
    })

    // Check install availability
    const handleCanInstall = () => setIsInstallable(true)
    const handleAppInstalled = () => setIsInstallable(false)
    
    window.addEventListener('caninstall', handleCanInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Load offline itineraries
    loadOfflineItineraries()

    return () => {
      unsubscribe()
      window.removeEventListener('caninstall', handleCanInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const loadOfflineItineraries = async () => {
    try {
      const itineraries = await getOfflineItineraries()
      setOfflineItineraries(itineraries)
    } catch (error) {
      console.error('Failed to load offline itineraries:', error)
    }
  }

  const checkPendingSync = async () => {
    // Check if there are pending items to sync
    const pending = await getPendingSyncItems()
    setSyncPending(pending.length > 0)
  }

  const saveForOffline = useCallback(async (itinerary) => {
    try {
      await saveItineraryOffline(itinerary)
      toast.success('Itinerary saved for offline access', {
        icon: '💾',
      })
      loadOfflineItineraries()
    } catch (error) {
      console.error('Failed to save offline:', error)
      toast.error('Failed to save for offline access')
    }
  }, [])

  const queueAction = useCallback(async (action) => {
    try {
      await queueForSync(action)
      setSyncPending(true)
      
      if (!isOnline) {
        toast('Action queued for when you\'re back online', {
          icon: '⏳',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Failed to queue action:', error)
    }
  }, [isOnline])

  const installApp = useCallback(async () => {
    try {
      const accepted = await installPrompt.prompt()
      if (accepted) {
        toast.success('Travel+ installed successfully!', {
          icon: '🎉',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Installation failed:', error)
      toast.error('Installation failed')
    }
  }, [])

  return {
    isOnline,
    isInstallable,
    offlineItineraries,
    syncPending,
    saveForOffline,
    queueAction,
    installApp,
  }
}

// Hook for PWA features
export function usePWAFeatures() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg)
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true)
              
              toast('New version available!', {
                icon: '🆕',
                duration: 0,
                action: {
                  label: 'Update',
                  onClick: () => window.location.reload(),
                },
              })
            }
          })
        })
      })
    }
  }, [])

  const checkForUpdates = useCallback(async () => {
    if (registration) {
      try {
        await registration.update()
      } catch (error) {
        console.error('Update check failed:', error)
      }
    }
  }, [registration])

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      toast.success('Cache cleared successfully')
    }
  }, [])

  return {
    hasUpdate,
    checkForUpdates,
    clearCache,
  }
}

// Hook for background sync
export function useBackgroundSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)

  useEffect(() => {
    // Listen for sync complete messages from service worker
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        setIsSyncing(false)
        setLastSyncTime(new Date())
        toast.success('Data synced successfully', {
          icon: '✅',
        })
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const requestSync = useCallback(async (tag = 'sync-itineraries') => {
    if ('sync' in registration) {
      try {
        setIsSyncing(true)
        await registration.sync.register(tag)
      } catch (error) {
        console.error('Sync registration failed:', error)
        setIsSyncing(false)
      }
    }
  }, [])

  return {
    isSyncing,
    lastSyncTime,
    requestSync,
  }
}