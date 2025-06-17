// Utility helper functions

// Format currency
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  // Format date
  export function formatDate(date, format = 'long') {
    if (!date) return ''
    
    const options = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    }
    
    return new Date(date).toLocaleDateString('en-US', options[format] || options.long)
  }
  
  // Calculate days between dates
  export function calculateDays(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  // Debounce function
  export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
  
  // Throttle function
  export function throttle(func, limit) {
    let inThrottle
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  // Generate unique ID
  export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Parse query parameters
  export function parseQueryParams(search) {
    const params = new URLSearchParams(search)
    const result = {}
    for (const [key, value] of params) {
      result[key] = value
    }
    return result
  }
  
  // Build query string
  export function buildQueryString(params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value)
      }
    })
    return searchParams.toString()
  }
  
  // Truncate text
  export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text
    return text.substr(0, maxLength).trim() + '...'
  }
  
  // Validate email
  export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // Calculate budget per person
  export function calculateBudgetPerPerson(totalBudget, people, budgetType) {
    if (budgetType === 'perPerson') {
      return totalBudget
    }
    return Math.round(totalBudget / people)
  }
  
  // Group array by key
  export function groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key]
      if (!result[group]) result[group] = []
      result[group].push(item)
      return result
    }, {})
  }
  
  // Sort activities by time
  export function sortActivitiesByTime(activities) {
    const timeOrder = {
      'morning': 1,
      'afternoon': 2,
      'evening': 3,
      'night': 4
    }
    
    return activities.sort((a, b) => {
      const aTime = timeOrder[a.timeOfDay?.toLowerCase()] || 5
      const bTime = timeOrder[b.timeOfDay?.toLowerCase()] || 5
      return aTime - bTime
    })
  }
  
  // Check if date is in past
  export function isPastDate(date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }
  
  // Get initials from name
  export function getInitials(name) {
    if (!name) return ''
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  // Safe JSON parse
  export function safeJsonParse(json, defaultValue = null) {
    try {
      return JSON.parse(json)
    } catch {
      return defaultValue
    }
  }
  
  // Deep clone object
  export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))
    if (obj instanceof Object) {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key])
        }
      }
      return clonedObj
    }
  }
  
  // Retry function with exponential backoff
  export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }