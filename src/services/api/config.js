// API Configuration and Base Setup

export const API_CONFIG = {
    // Netlify Functions endpoint
    FUNCTIONS_URL: (() => {
      const envUrl = import.meta.env.VITE_API_URL
      const isDev = import.meta.env.DEV
      const devUrl = 'http://localhost:8888/.netlify/functions'
      const prodUrl = '/.netlify/functions'
      
      console.log('🔧 API Config Debug:', { envUrl, isDev, devUrl, prodUrl })
      
      if (envUrl) {
        console.log('🔧 Using VITE_API_URL:', envUrl)
        return envUrl
      }
      
      if (isDev) {
        console.log('🔧 Using dev URL:', devUrl)
        return devUrl
      }
      
      console.log('🔧 Using prod URL:', prodUrl)
      return prodUrl
    })(),
    
    // External API endpoints
    AMADEUS: {
      BASE_URL: 'https://api.amadeus.com/v2',
      AUTH_URL: 'https://api.amadeus.com/v1/security/oauth2/token',
      CLIENT_ID: import.meta.env.VITE_AMADEUS_API_KEY,
      CLIENT_SECRET: import.meta.env.VITE_AMADEUS_API_SECRET,
    },
    
    GOOGLE_MAPS: {
      API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    },
    
    OPENAI: {
      API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
      MODEL: 'gpt-3.5-turbo',
      MAX_TOKENS: 2000,
    },
    
    // If using DeepSeek instead
    DEEPSEEK: {
      API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY,
      BASE_URL: 'https://api.deepseek.com/v1',
      MODEL: 'deepseek-chat',
    },
    
    // Supabase
    SUPABASE: {
      URL: import.meta.env.VITE_SUPABASE_URL,
      ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    
    // Analytics
    GA_ID: import.meta.env.VITE_GA_TRACKING_ID,
    
    // Affiliate IDs
    AFFILIATES: {
      BOOKING: import.meta.env.VITE_BOOKING_AFFILIATE_ID,
      VIATOR: import.meta.env.VITE_VIATOR_AFFILIATE_ID,
    }
  }
  
  // API call wrapper with error handling
  export async function apiCall(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `API call failed: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API call error:', error)
      throw error
    }
  }
  
  // Rate limiting helper
  const rateLimiters = new Map()
  
  export function createRateLimiter(key, maxCalls, windowMs) {
    return {
      canMakeCall: () => {
        const now = Date.now()
        const limiter = rateLimiters.get(key) || { calls: [], windowStart: now }
        
        // Remove old calls outside the window
        limiter.calls = limiter.calls.filter(callTime => now - callTime < windowMs)
        
        if (limiter.calls.length < maxCalls) {
          limiter.calls.push(now)
          rateLimiters.set(key, limiter)
          return true
        }
        
        return false
      },
      
      getRemainingCalls: () => {
        const limiter = rateLimiters.get(key) || { calls: [] }
        const now = Date.now()
        limiter.calls = limiter.calls.filter(callTime => now - callTime < windowMs)
        return maxCalls - limiter.calls.length
      },
      
      getResetTime: () => {
        const limiter = rateLimiters.get(key) || { calls: [] }
        if (limiter.calls.length === 0) return null
        return limiter.calls[0] + windowMs
      }
    }
  }