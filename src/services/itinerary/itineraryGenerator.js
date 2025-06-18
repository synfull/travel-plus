import { apiCall, API_CONFIG } from '../api/config'
import { cacheManager, generateCacheKey, CACHE_TTL } from '../cache/cacheManager'
import { generateItineraryPrompt, generateExcursionPrompt, SYSTEM_PROMPT } from './promptTemplates'
import { trackEvent } from '../analytics'
import smartGenerator from './smartGenerator.js'

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

      // Try smart Reddit-based generation first
      console.log('🧠 Attempting smart Reddit-based generation...')
      try {
        const smartItinerary = await smartGenerator.generateSmartItinerary(tripData)
        if (smartItinerary && smartItinerary.days && smartItinerary.days.length > 0) {
          console.log('✅ Smart generation successful, caching and returning')
          await cacheManager.set(cacheKey, smartItinerary, CACHE_TTL.AI_RESPONSES)
          
          trackEvent('smart_itinerary_generation_completed', {
            destination: tripData.destination,
            redditBased: true
          })
          
          return smartItinerary
        }
      } catch (smartError) {
        console.warn('⚠️ Smart generation failed, falling back to API:', smartError.message)
      }

      // Fallback to serverless function
      console.log('🌐 Calling API at:', `${this.functionsUrl}/generate-itinerary`)
      console.log('🌐 Functions URL:', this.functionsUrl)
      
      const response = await apiCall(`${this.functionsUrl}/generate-itinerary`, {
        method: 'POST',
        body: JSON.stringify(tripData),
      })

      console.log('🔥 API Response received:', response)
      console.log('🔥 Response success:', response.success)
      console.log('🔥 Response itinerary:', response.itinerary)

      // Cache the successful response
      if (response.success && response.itinerary) {
        await cacheManager.set(cacheKey, response.itinerary, CACHE_TTL.AI_RESPONSES)
        console.log('🎯 API response was successful, returning itinerary')
        
        // Track successful generation
        trackEvent('itinerary_generation_completed', {
          destination: tripData.destination,
          totalCost: response.metadata?.totalCost,
        })

        return response.itinerary
      } else {
        console.error('❌ API response was not successful:', response)
        throw new Error('API response was not successful')
      }
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
    console.log('🚨 Generating fallback itinerary with data:', tripData)
    
    const days = this.calculateDays(tripData.startDate, tripData.endDate)
    const itineraryId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    console.log('📅 Calculated days:', days)
    console.log('🆔 Generated ID:', itineraryId)
    
    // Generate mock days with location data
    const mockDays = []
    for (let i = 0; i < days; i++) {
      const dayDate = new Date(tripData.startDate)
      dayDate.setDate(dayDate.getDate() + i)
      
      mockDays.push({
        dayNumber: i + 1,
        date: dayDate.toISOString().split('T')[0],
        title: `Day ${i + 1} in ${tripData.destination}`,
        morning: {
          time: '9:00 AM',
          activity: 'Explore Local Attractions',
          description: `Start your day exploring the highlights of ${tripData.destination}. We recommend checking out popular landmarks and local hotspots.`,
          estimatedCost: 25,
          location: this.generateRandomLocation(tripData.destination),
          type: 'sightseeing'
        },
        afternoon: {
          time: '2:00 PM',
          activity: 'Local Cuisine Experience',
          description: `Enjoy authentic local cuisine at recommended restaurants. Don't miss trying the signature dishes of ${tripData.destination}.`,
          estimatedCost: 40,
          location: this.generateRandomLocation(tripData.destination),
          type: 'dining'
        },
        evening: {
          time: '7:00 PM',
          activity: 'Cultural Experience',
          description: `Immerse yourself in the local culture with evening activities like live music, local markets, or traditional performances.`,
          estimatedCost: 35,
          location: this.generateRandomLocation(tripData.destination),
          type: 'culture'
        }
      })
    }
    
    const totalDailyCost = 100
    const accommodationPerNight = 80
    const totalActivities = mockDays.length * totalDailyCost
    const totalAccommodation = (mockDays.length - 1) * accommodationPerNight
    const flightEstimate = 300 * (tripData.people || 2)
    const total = totalActivities + totalAccommodation + flightEstimate
    
    const fallbackItinerary = {
      id: itineraryId,
      destination: tripData.destination,
      title: `${tripData.destination} Adventure`,
      overview: `Experience the best of ${tripData.destination} with this carefully planned itinerary. While we had trouble generating a fully customized plan, this guide will help you explore the destination's highlights.`,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      people: tripData.people || 2,
      categories: tripData.categories || [],
      days: mockDays,
      budgetSummary: {
        flights: flightEstimate,
        accommodation: totalAccommodation,
        activities: totalActivities,
        meals: Math.round(totalActivities * 0.4),
        total: total,
      },
      insiderTips: [
        `Book accommodations in advance for better rates in ${tripData.destination}`,
        'Try to learn a few basic phrases in the local language',
        'Always carry a portable charger and download offline maps',
        'Research local customs and tipping practices before your trip'
      ],
      isGenerated: true,
      isFallback: true,
      generatedAt: new Date().toISOString(),
    }
    
    console.log('✅ Generated fallback itinerary:', fallbackItinerary)
    console.log('🎯 Destination in fallback:', fallbackItinerary.destination)
    
    return fallbackItinerary
  }

  // Location generation methods (same as backend)
  getDestinationCoords(destination) {
    const destinationCoords = {
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Cancun': { lat: 21.1619, lng: -86.8515 },
      'Cancun, Mexico': { lat: 21.1619, lng: -86.8515 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'New York': { lat: 40.7128, lng: -74.0060 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Dubai': { lat: 25.2048, lng: 55.2708 },
      'Bali': { lat: -8.3405, lng: 115.0920 },
      'Bali, Indonesia': { lat: -8.3405, lng: 115.0920 },
      'Rome': { lat: 41.9028, lng: 12.4964 },
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Bangkok': { lat: 13.7563, lng: 100.5018 },
      'Sydney': { lat: -33.8688, lng: 151.2093 }
    };

    // Try exact match first, then partial match
    let baseCoords = destinationCoords[destination];
    
    if (!baseCoords) {
      // Try to find a partial match (e.g., "Bali" in "Bali, Indonesia")
      const destinationKey = Object.keys(destinationCoords).find(key => 
        destination.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(destination.toLowerCase())
      );
      baseCoords = destinationKey ? destinationCoords[destinationKey] : { lat: 0, lng: 0 };
    }
    
    return baseCoords;
  }

  generateRandomLocation(destination) {
    const baseCoords = this.getDestinationCoords(destination);
    
    console.log(`🗺️ Frontend location lookup for "${destination}":`, baseCoords);
    
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.02
    };
  }
}

// Create and export a default instance
const itineraryGenerator = new ItineraryGenerator()
export { itineraryGenerator }
export default itineraryGenerator
