import supabase from '../supabase'

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  FLIGHTS: 24 * 60 * 60 * 1000,      // 24 hours
  HOTELS: 48 * 60 * 60 * 1000,       // 48 hours
  ACTIVITIES: 7 * 24 * 60 * 60 * 1000, // 7 days
  PLACES: 30 * 24 * 60 * 60 * 1000,  // 30 days
  AI_RESPONSES: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// Generate cache key
export function generateCacheKey(type, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key]
      }
      return acc
    }, {})
  
  return `${type}:${JSON.stringify(sortedParams)}`
}

// Cache manager
export const cacheManager = {
  // Get cached data
  async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('*')
        .eq('key', key)
        .single()
      
      if (error || !data) return null
      
      // Check if cache is expired
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        await this.delete(key)
        return null
      }
      
      return {
        data: data.value,
        createdAt: new Date(data.created_at),
        expiresAt,
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },
  
  // Set cache data
  async set(key, value, ttl = CACHE_TTL.AI_RESPONSES) {
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + ttl)
      
      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
      
      if (error) throw error
      
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  },
  
  // Delete cache entry
  async delete(key) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  },
  
  // Clear expired cache entries
  async clearExpired() {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Clear expired cache error:', error)
      return false
    }
  },
  
  // Get cache statistics
  async getStats() {
    try {
      const { data: total } = await supabase
        .from('cache')
        .select('*', { count: 'exact', head: true })
      
      const { data: expired } = await supabase
        .from('cache')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', new Date().toISOString())
      
      return {
        total: total?.count || 0,
        expired: expired?.count || 0,
        active: (total?.count || 0) - (expired?.count || 0),
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return { total: 0, expired: 0, active: 0 }
    }
  }
}

// Popular destinations to pre-cache
export const POPULAR_DESTINATIONS = [
  { city: 'Cancun', country: 'Mexico', code: 'CUN' },
  { city: 'Paris', country: 'France', code: 'CDG' },
  { city: 'Tokyo', country: 'Japan', code: 'NRT' },
  { city: 'Barcelona', country: 'Spain', code: 'BCN' },
  { city: 'New York', country: 'USA', code: 'JFK' },
  { city: 'Bali', country: 'Indonesia', code: 'DPS' },
  { city: 'London', country: 'UK', code: 'LHR' },
  { city: 'Dubai', country: 'UAE', code: 'DXB' },
]

// Pre-warm cache for popular routes
export async function warmCache() {
  console.log('Starting cache warming...')
  
  // Clear expired entries first
  await cacheManager.clearExpired()
  
  // You can add cache warming logic here for popular destinations
  // This would be called on app startup or periodically
  
  const stats = await cacheManager.getStats()
  console.log('Cache stats:', stats)
}