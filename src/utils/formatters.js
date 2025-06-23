// Formatting utilities

// Format price/currency
export function formatPrice(amount, currency = 'USD') {
  if (!amount) return 'Free'
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) return 'Price unavailable'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount)
}

// Format time (12-hour format)
export function formatTime(time) {
    if (!time) return ''
    
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    
    return `${displayHour}:${minutes} ${ampm}`
  }
  
  // Format duration
  export function formatDuration(minutes) {
    if (!minutes) return ''
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }
  
  // Format distance
  export function formatDistance(meters) {
    if (!meters) return ''
    
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    
    const km = meters / 1000
    return `${km.toFixed(1)}km`
  }
  
  // Format file size
  export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // Format phone number
  export function formatPhoneNumber(phone) {
    if (!phone) return ''
    
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    
    return phone
  }
  
  // Format percentage
  export function formatPercentage(value, decimals = 0) {
    if (typeof value !== 'number') return ''
    return `${(value * 100).toFixed(decimals)}%`
  }
  
  // Format rating
  export function formatRating(rating, maxRating = 5) {
    if (!rating) return 'Not rated'
    return `${rating.toFixed(1)}/${maxRating}`
  }
  
  // Format date range
  export function formatDateRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const startDay = start.getDate()
    const endDay = end.getDate()
    const year = end.getFullYear()
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`
    }
    
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
  }
  
  // Format itinerary title
  export function formatItineraryTitle(destination, days) {
    return `${days}-Day ${destination} Adventure`
  }
  
  // Format activity time
  export function formatActivityTime(timeOfDay) {
    const times = {
      morning: 'Morning (9 AM - 12 PM)',
      afternoon: 'Afternoon (12 PM - 5 PM)',
      evening: 'Evening (5 PM - 9 PM)',
      night: 'Night (9 PM onwards)'
    }
    
    return times[timeOfDay] || timeOfDay
  }
  
  // Format location
  export function formatLocation(city, country) {
    if (!city && !country) return ''
    if (!country) return city
    if (!city) return country
    return `${city}, ${country}`
  }
  
  // Format list with proper grammar
  export function formatList(items, conjunction = 'and') {
    if (!items || items.length === 0) return ''
    if (items.length === 1) return items[0]
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
    
    const lastItem = items[items.length - 1]
    const otherItems = items.slice(0, -1)
    return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`
  }
  
  // Format error message
  export function formatErrorMessage(error) {
    if (typeof error === 'string') return error
    
    if (error.response?.data?.message) return error.response.data.message
    if (error.message) return error.message
    
    return 'An unexpected error occurred'
  }
  
  // Format relative time
  export function formatRelativeTime(date) {
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now - then) / 1000)
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    }
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit)
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`
      }
    }
    
    return 'Just now'
  }