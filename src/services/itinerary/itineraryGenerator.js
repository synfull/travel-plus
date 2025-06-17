import { apiCall, API_CONFIG } from '../api/config'
import { cacheManager, generateCacheKey, CACHE_TTL } from '../cache/cacheManager'
import { generateItineraryPrompt, generateExcursionPrompt, SYSTEM_PROMPT } from './promptTemplates'
import { trackEvent } from '../analytics'

export class ItineraryGenerator {
  constructor() {
    this.functionsUrl = API_CONFIG.FUNCTIONS_URL
  }

  async generateItinerary(tripData) {
    try {
      // Track itinerary generation start
      trackEvent('itinerary_generation_started', {
        destination: tripData.destination,
        budget: tripData.totalBudget,
        days: this.calculateDays(tripData.startDate, tripData.endDate),
      })

      // Check cache first
      const cacheKey = generateCacheKey('itinerary', {
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        people: tripData.people,
        categories: tripData.categories.sort().join(','),
      })

      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        console.log('Returning cached itinerary')
        trackEvent('itinerary_cache_hit')
        return cached.data
      }

      // Call serverless function
      const response = await apiCall(`${this.functionsUrl}/generate-itinerary`, {
        method: 'POST',
        body: JSON.stringify(tripData),
      })

      // Cache the successful response
      if (response.success && response.itinerary) {
        await cacheManager.set(cacheKey, response.itinerary, CACHE_TTL.AI_RESPONSES)
      }

      // Track successful generation
      trackEvent('itinerary_generation_completed', {
        destination: tripData.destination,
        totalCost: response.metadata?.totalCost,
      })

      return response.itinerary
    } catch (error) {
      console.error('Itinerary generation error:', error)
      trackEvent('itinerary_generation_error', {
        error: error.message,
        destination: tripData.destination,
      })

      // Return a fallback itinerary if generation fails
      return this.generateFallbackItinerary(tripData)
    }
  }

  async searchFlights({ origin, destination, startDate, endDate, passengers }) {
    const cacheKey = generateCacheKey('flights', {
      origin,
      destination,
      startDate,
      endDate,
      passengers,
    })

    const cached = await cacheManager.get(cacheKey)
    if (cached) {
      console.log('Returning cached flight data')
      trackEvent('flight_cache_hit')
      return cached.data
    }

    try {
      const response = await apiCall(`${this.functionsUrl}/search-flights`, {
        method: 'POST',
        body: JSON.stringify({ origin, destination, startDate, endDate, passengers }),
      })

      if (response.success && response.flights) {
        await cacheManager.set(cacheKey, response.flights, CACHE_TTL.FLIGHT_DATA)
        trackEvent('flight_search_completed')
        return response.flights
      } else {
        throw new Error('Flight data unavailable')
      }
    } catch (error) {
      console.error('Flight search error:', error)
      trackEvent('flight_search_error', { error: error.message })
      return []
    }
  }

  calculateDays(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  generateFallbackItinerary(tripData) {
    return {
      destination: tripData.destination,
      message: 'We had trouble generating a custom itinerary, but here\'s a general travel guide for your destination!',
      days: [],
    }
  }
}

// Create and export a default instance
const itineraryGenerator = new ItineraryGenerator()
export { itineraryGenerator }
export default itineraryGenerator
