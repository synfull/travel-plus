/**
 * Expedia Rapid API Service (Direct from Expedia, not RapidAPI)
 * More reliable than RapidAPI endpoints
 */

export class ExpediaRapidService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || (typeof process !== 'undefined' ? process.env.EXPEDIA_API_KEY : null)
    this.apiSecret = options.apiSecret || (typeof process !== 'undefined' ? process.env.EXPEDIA_API_SECRET : null)
    this.baseUrl = 'https://test.ean.com/v3' // Test endpoint, change to prod when ready
    this.rateLimitDelayMs = 1000 // 1 second delay between calls
    
    console.log('🏨 ExpediaRapidService: Initialized', {
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'MISSING'
    })
  }

  /**
   * Search for hotels by destination and dates
   */
  async searchHotels({ destination, checkInDate, checkOutDate, guests = 1, rooms = 1, maxPrice = null }) {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Expedia API credentials not configured')
      }

      console.log(`🔍 ExpediaRapidService: Searching hotels in ${destination}`)

      // Format dates for Expedia API (YYYY-MM-DD)
      const formattedCheckIn = this.formatDate(checkInDate)
      const formattedCheckOut = this.formatDate(checkOutDate)

      // Step 1: Get region ID for destination
      const regionId = await this.getRegionId(destination)
      
      // Step 2: Search for hotels
      const searchParams = new URLSearchParams({
        region_id: regionId.toString(),
        checkin: formattedCheckIn,
        checkout: formattedCheckOut,
        adults: guests.toString(),
        rooms: rooms.toString(),
        currency: 'USD',
        language: 'en-US',
        limit: '25'
      })

      if (maxPrice) {
        searchParams.append('price_max', maxPrice.toString())
      }

      const searchUrl = `${this.baseUrl}/hotels/search?${searchParams}`
      
      await this.rateLimitDelay()
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TravelPlus/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Expedia API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.data || !data.data.catalog) {
        console.log('⚠️ No hotels found in Expedia response')
        return {
          hotels: [],
          meta: {
            count: 0,
            provider: 'Expedia Rapid',
            destination,
            searchedAt: new Date().toISOString()
          }
        }
      }

      const hotels = data.data.catalog.slice(0, 10).map(hotel => this.transformHotel(hotel, formattedCheckIn, formattedCheckOut))

      console.log(`✅ ExpediaRapidService: Found ${hotels.length} hotels`)

      return {
        hotels,
        meta: {
          count: hotels.length,
          provider: 'Expedia Rapid',
          destination,
          searchedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ ExpediaRapidService: Search failed:', error.message)
      throw error
    }
  }

  /**
   * Get region ID for a destination
   */
  async getRegionId(destination) {
    try {
      // Use hardcoded region IDs for major cities (Expedia format)
      const regionIds = {
        'tokyo': 6054439,
        'tokyo, japan': 6054439,
        'paris': 6250648,
        'paris, france': 6250648,
        'new york': 6167865,
        'new york, usa': 6167865,
        'london': 6054972,
        'london, uk': 6054972,
        'barcelona': 6247281,
        'amsterdam': 6058739,
        'rome': 6191403,
        'berlin': 6058873,
        'madrid': 6355233,
        'toronto': 6182711,
        'vancouver': 6173331,
        'los angeles': 6167316,
        'chicago': 6167316,
        'miami': 6167865
      }

      const normalized = destination.toLowerCase().trim()
      const regionId = regionIds[normalized]

      if (regionId) {
        console.log(`🎯 Using cached region ID for ${destination}: ${regionId}`)
        return regionId
      }

      // If no cached ID, try to search for it
      const searchUrl = `${this.baseUrl}/regions/search?q=${encodeURIComponent(destination)}&locale=en-US&limit=1`
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          return data.data[0].id
        }
      }

      // Fallback to Tokyo
      console.log(`⚠️ No region ID found for ${destination}, using Tokyo as fallback`)
      return 6054439

    } catch (error) {
      console.error('❌ ExpediaRapidService: Region lookup failed:', error.message)
      return 6054439 // Fallback to Tokyo
    }
  }

  /**
   * Transform Expedia hotel data to our format
   */
  transformHotel(hotel, checkInDate, checkOutDate) {
    const price = hotel.pricing?.offers?.[0]?.price?.total || 
                  hotel.pricing?.base_rate || 150
    
    return {
      id: `expedia_${hotel.property_id}`,
      name: hotel.name || 'Hotel',
      rating: hotel.star_rating || hotel.guest_rating?.overall || 3.5,
      price: {
        total: Math.round(price),
        currency: hotel.pricing?.currency || 'USD'
      },
      pricePerNight: Math.round(price),
      location: {
        address: hotel.address || `${hotel.name} Area`,
        cityName: hotel.city || hotel.address?.city || 'Unknown',
        coordinates: hotel.location ? {
          latitude: hotel.location.latitude,
          longitude: hotel.location.longitude
        } : null
      },
      amenities: this.extractAmenities(hotel),
      images: this.extractImages(hotel),
      room: {
        type: 'Standard Room',
        description: `Comfortable accommodation at ${hotel.name}`
      },
      policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: hotel.cancellation?.free_cancellation ? 'Free cancellation' : 'Standard policy'
      },
      contact: {
        phone: hotel.phone || null,
        email: null
      },
      bookingCode: hotel.property_id?.toString(),
      bookingUrl: `https://www.expedia.com/h${hotel.property_id}`,
      distance: hotel.distance ? `${hotel.distance} from city center` : null,
      provider: 'Expedia Rapid',
      reviews: {
        count: hotel.guest_rating?.count || 0,
        rating: hotel.guest_rating?.overall || hotel.star_rating || 3.5
      }
    }
  }

  /**
   * Extract amenities from hotel data
   */
  extractAmenities(hotel) {
    const amenities = []
    
    if (hotel.amenities) {
      hotel.amenities.forEach(amenity => {
        if (amenity.name) {
          amenities.push(amenity.name)
        }
      })
    }
    
    // Add common amenities based on star rating
    if (hotel.star_rating >= 3) {
      amenities.push('Free WiFi')
    }
    if (hotel.star_rating >= 4) {
      amenities.push('Room Service', 'Concierge')
    }
    
    return amenities.slice(0, 6)
  }

  /**
   * Extract images from hotel data
   */
  extractImages(hotel) {
    const images = []
    
    if (hotel.images && hotel.images.length > 0) {
      hotel.images.slice(0, 5).forEach(image => {
        if (image.url) {
          images.push(image.url)
        }
      })
    }
    
    // Add placeholder if no images
    if (images.length === 0) {
      images.push(
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
      )
    }
    
    return images
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(dateString) {
    if (!dateString) return null
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch (error) {
      console.warn('⚠️ Date formatting error:', error.message)
      return dateString
    }
  }

  /**
   * Rate limiting helper
   */
  async rateLimitDelay() {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs))
  }
}

export default ExpediaRapidService 