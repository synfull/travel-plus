// Error handling utilities

import { toast } from 'react-hot-toast'
import { ERROR_MESSAGES } from './constants'

// Handle API errors
export function handleApiError(error, customMessage = null) {
  console.error('API Error:', error)
  
  let message = customMessage || ERROR_MESSAGES.API_ERROR
  
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 400:
        message = error.response.data?.message || ERROR_MESSAGES.VALIDATION_ERROR
        break
      case 401:
        message = ERROR_MESSAGES.UNAUTHORIZED
        break
      case 404:
        message = ERROR_MESSAGES.NOT_FOUND
        break
      case 429:
        message = ERROR_MESSAGES.RATE_LIMIT
        break
      case 500:
      case 502:
      case 503:
        message = 'Server error. Please try again later.'
        break
      default:
        message = error.response.data?.message || message
    }
  } else if (error.request) {
    // No response received
    message = ERROR_MESSAGES.NETWORK_ERROR
  }
  
  toast.error(message)
  return message
}

// Handle form validation errors
export function handleValidationError(errors) {
  const firstError = Object.values(errors)[0]
  if (firstError) {
    toast.error(firstError)
  }
}

// Log error to analytics
export function logError(error, context = {}) {
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message || error.toString(),
      error_context: JSON.stringify(context),
      fatal: false
    })
  }
  
  // Also log to console in development (browser-compatible)
  const isDevelopment = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || 
                       (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')
  
  if (isDevelopment) {
    console.error('Error logged:', error, context)
  }
}

// Create error boundary error
export function createErrorBoundaryError(error, errorInfo) {
  return {
    message: error.toString(),
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString()
  }
}

// Retry failed request
export async function retryFailedRequest(request, maxRetries = 3) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request()
    } catch (error) {
      lastError = error
      
      // Don't retry certain errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }
  
  throw lastError
}

// Handle offline errors
export function handleOfflineError() {
  toast.error('You are currently offline. Some features may be limited.', {
    icon: '📵',
    duration: 5000,
  })
}

// Handle rate limit error
export function handleRateLimitError(retryAfter = 60) {
  const minutes = Math.ceil(retryAfter / 60)
  toast.error(`Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`, {
    icon: '⏳',
    duration: 5000,
  })
}

// Error recovery strategies
export const errorRecovery = {
  // Retry with exponential backoff
  async withRetry(fn, options = {}) {
    const { maxRetries = 3, onRetry } = options
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        
        if (onRetry) {
          onRetry(i + 1, error)
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 10000))
        )
      }
    }
  },
  
  // Fallback to cached data
  async withCache(fn, cacheKey, cacheDuration = 3600000) {
    try {
      const result = await fn()
      
      // Cache successful result
      if (result) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }))
      }
      
      return result
    } catch (error) {
      // Try to get from cache
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < cacheDuration) {
          toast.info('Using cached data due to connection issues')
          return data
        }
      }
      
      throw error
    }
  },
  
  // Graceful degradation
  async withFallback(fn, fallbackFn) {
    try {
      return await fn()
    } catch (error) {
      logError(error, { context: 'withFallback' })
      return await fallbackFn(error)
    }
  }
}