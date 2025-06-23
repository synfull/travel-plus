/**
 * Hotels.com API Service (via RapidAPI)
 * Free tier: 50 requests/day, 1 request/second
 * Fallback service for when Amadeus hotel search fails
 */

export class HotelsComService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || (typeof process !== 'undefined' ? process.env.RAPIDAPI_KEY : null)
    this.baseUrl = 'https://hotels-com-free.p.rapidapi.com'
    this.headers = {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'hotels-com-free.p.rapidapi.com'
    }
    
    console.log('🏨 HotelsComService: Initialized', {
      hasApiKey: !!this.apiKey,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'MISSING'
    })
  }

  /**
   * Search for hotels by destination and dates
   */
  async searchHotels({ destination, checkInDate, checkOutDate, guests = 1, rooms = 1 }) {
    try {
      console.log(`🔍 HotelsComService: Searching hotels in ${destination}`)

      // Check if we should use mock data due to rate limiting
      if (this.shouldUseMockData()) {
        console.log('⚠️ Using mock data due to rate limiting or API issues')
        return this.getMockHotels(destination, checkInDate, checkOutDate)
      }

      // First, get location suggestions
      const locationId = await this.getLocationId(destination)
      if (!locationId) {
        throw new Error(`No location found for: ${destination}`)
      }

      // Search hotels near the location
      const hotels = await this.searchNearby({
        locationId,
        checkInDate,
        checkOutDate,
        guests,
        rooms
      })

      console.log(`✅ HotelsComService: Found ${hotels.length} hotels`)
      return {
        hotels,
        meta: {
          count: hotels.length,
          provider: 'Hotels.com',
          destination,
          searchedAt: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('❌ HotelsComService: Search failed:', error.message)
      
      // Fallback to mock data on any error
      console.log('🔄 Falling back to mock data due to API error')
      return this.getMockHotels(destination, checkInDate, checkOutDate)
    }
  }

  /**
   * Get location ID for a destination
   */
  async getLocationId(destination) {
    try {
      // Use the correct suggest endpoint
      const response = await fetch(`${this.baseUrl}/suggest?query=${encodeURIComponent(destination)}&locale=en_US`, {
        method: 'GET',
        headers: this.headers
      })

      console.log(`🔍 Trying Hotels.com suggest endpoint for: ${destination}`)
      console.log(`📍 Request URL: ${this.baseUrl}/suggest?query=${encodeURIComponent(destination)}&locale=en_US`)

      if (!response.ok) {
        console.log(`❌ Suggest endpoint failed: ${response.status} ${response.statusText}`)
        
        // Try alternative approach - search directly without location ID
        console.log('🔄 Trying direct search without location ID...')
        return destination // Return destination string to use in direct search
      }

      const data = await response.json()
      console.log('📊 Suggest response:', data)
      
      if (data.result === 'OK' && data.data && data.data.length > 0) {
        // Find the best match (prefer cities over hotels)
        const cityMatch = data.data.find(item => item.type === 'CITY') || data.data[0]
        return cityMatch.destinationId || cityMatch.hotelId
      }

      return destination // Fallback to destination string

    } catch (error) {
      console.error('❌ HotelsComService: Location search failed:', error.message)
      return destination // Fallback to destination string
    }
  }

  /**
   * Search hotels near a location
   */
  async searchNearby({ locationId, checkInDate, checkOutDate, guests, rooms }) {
    try {
      // Format dates for Hotels.com API (YYYY-MM-DD)
      const formattedCheckIn = this.formatDate(checkInDate)
      const formattedCheckOut = this.formatDate(checkOutDate)

      // Try different endpoint approaches
      const endpoints = [
        // Approach 1: Search by destination ID
        `${this.baseUrl}/search?destinationId=${locationId}&checkIn=${formattedCheckIn}&checkOut=${formattedCheckOut}&adults=${guests}&rooms=${rooms}&locale=en_US&currency=USD`,
        
        // Approach 2: Search nearby (if locationId is coordinates)
        `${this.baseUrl}/search/nearby?lat=40.7128&lon=-74.0060&checkIn=${formattedCheckIn}&checkOut=${formattedCheckOut}&adults=${guests}&rooms=${rooms}&locale=en_US&currency=USD`,
        
        // Approach 3: Basic search (if locationId is a city name)
        `${this.baseUrl}/search?query=${encodeURIComponent(locationId)}&checkIn=${formattedCheckIn}&checkOut=${formattedCheckOut}&adults=${guests}&rooms=${rooms}&locale=en_US&currency=USD`
      ]

      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i]
        console.log(`🔍 Trying endpoint ${i + 1}: ${endpoint}`)

        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: this.headers
          })

          console.log(`📊 Response status: ${response.status}`)

          if (response.ok) {
            const data = await response.json()
            console.log('✅ Success! Response data:', data)
            
            if (data.result === 'OK' && data.data && data.data.body && data.data.body.searchResults) {
              const results = data.data.body.searchResults.results || []
              return results.slice(0, 10).map(hotel => this.transformHotel(hotel, formattedCheckIn, formattedCheckOut))
            }
          } else {
            console.log(`❌ Endpoint ${i + 1} failed: ${response.status} ${response.statusText}`)
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${i + 1} error:`, endpointError.message)
        }
      }

      // If all endpoints fail, return empty array
      console.log('❌ All endpoints failed, returning empty results')
      throw new Error('All Hotels.com API endpoints failed - likely due to rate limiting')

    } catch (error) {
      console.error('❌ HotelsComService: Nearby search failed:', error.message)
      throw error // Re-throw to trigger fallback in searchHotels
    }
  }

  /**
   * Transform Hotels.com hotel data to our format
   */
  transformHotel(hotel, checkInDate, checkOutDate) {
    const price = hotel.ratePlan?.price?.current || hotel.ratePlan?.price?.exactCurrent || 150
    const currency = hotel.ratePlan?.price?.info?.currency || 'USD'
    
    return {
      id: `hotelscom_${hotel.id}`,
      name: hotel.name || 'Hotel',
      rating: hotel.starRating || hotel.guestReviews?.rating || 3.5,
      price: {
        total: Math.round(price),
        currency: currency
      },
      pricePerNight: Math.round(price),
      location: {
        address: this.formatAddress(hotel.address),
        cityName: hotel.address?.locality || hotel.neighbourhood || 'Unknown',
        coordinates: hotel.coordinate ? {
          latitude: hotel.coordinate.lat,
          longitude: hotel.coordinate.lon
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
        cancellation: 'Check hotel policy'
      },
      contact: {
        phone: null,
        email: null
      },
      bookingCode: hotel.id?.toString(),
      bookingUrl: `https://hotels.com/hotel/${hotel.id}`,
      distance: hotel.landmarks && hotel.landmarks[0] ? 
        `${hotel.landmarks[0].distance} from ${hotel.landmarks[0].label}` : null,
      provider: 'Hotels.com',
      reviews: {
        count: hotel.guestReviews?.total || 0,
        rating: hotel.guestReviews?.rating || hotel.starRating || 3.5
      }
    }
  }

  /**
   * Format hotel address
   */
  formatAddress(address) {
    if (!address) return ''
    
    const parts = []
    if (address.streetAddress) parts.push(address.streetAddress)
    if (address.locality) parts.push(address.locality)
    if (address.region) parts.push(address.region)
    if (address.countryName) parts.push(address.countryName)
    
    return parts.join(', ')
  }

  /**
   * Extract amenities from hotel data
   */
  extractAmenities(hotel) {
    const amenities = []
    
    // Common amenities based on hotel data
    if (hotel.starRating >= 4) amenities.push('Free WiFi', 'Room Service')
    if (hotel.starRating >= 3) amenities.push('Air Conditioning', 'TV')
    if (hotel.neighbourhood?.toLowerCase().includes('beach')) amenities.push('Beach Access')
    if (hotel.starRating >= 4) amenities.push('Fitness Center')
    
    return amenities.slice(0, 6) // Limit to 6 amenities
  }

  /**
   * Extract images from hotel data
   */
  extractImages(hotel) {
    const images = []
    
    if (hotel.optimizedThumbUrls?.srpDesktop) {
      images.push(hotel.optimizedThumbUrls.srpDesktop)
    }
    
    // Add placeholder images if none available
    if (images.length === 0) {
      images.push(
        'https://via.placeholder.com/400x300?text=Hotel+Exterior',
        'https://via.placeholder.com/400x300?text=Hotel+Room',
        'https://via.placeholder.com/400x300?text=Hotel+Lobby'
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
    // Hotels.com free tier: 1 request per second
    return new Promise(resolve => setTimeout(resolve, 1100))
  }

  /**
   * Check if we should use mock data due to rate limiting
   */
  shouldUseMockData() {
    // Use mock data if no API key or if we've been rate limited recently
    return !this.apiKey || this.isRateLimited()
  }

  /**
   * Check if we're currently rate limited
   */
  isRateLimited() {
    // Simple check - could be enhanced with more sophisticated tracking
    return false // For now, let real API calls fail and fallback to mock
  }

  /**
   * Get mock hotels for testing and fallback
   */
  getMockHotels(destination, checkInDate, checkOutDate) {
    const mockHotels = [
      {
        id: 'hotelscom_mock_1',
        name: `Grand ${destination} Hotel`,
        rating: 4.2,
        price: { total: 189, currency: 'USD' },
        pricePerNight: 189,
        location: {
          address: `123 Main Street, ${destination}`,
          cityName: destination,
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        amenities: ['Free WiFi', 'Pool', 'Gym', 'Restaurant'],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
        ],
        room: {
          type: 'Deluxe Room',
          description: `Spacious deluxe room with city views in ${destination}`
        },
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Free cancellation until 24 hours before check-in'
        },
        contact: { phone: '+1-555-0123', email: 'info@grandhotel.com' },
        bookingCode: 'MOCK123',
        bookingUrl: 'https://hotels.com/mock-booking',
        distance: '0.5 km from city center',
        provider: 'Hotels.com',
        reviews: { count: 1247, rating: 4.2 }
      },
      {
        id: 'hotelscom_mock_2',
        name: `${destination} Plaza Suites`,
        rating: 3.8,
        price: { total: 145, currency: 'USD' },
        pricePerNight: 145,
        location: {
          address: `456 Central Avenue, ${destination}`,
          cityName: destination,
          coordinates: { latitude: 40.7589, longitude: -73.9851 }
        },
        amenities: ['Free WiFi', 'Business Center', 'Pet Friendly'],
        images: [
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400'
        ],
        room: {
          type: 'Standard Suite',
          description: `Comfortable suite with modern amenities in ${destination}`
        },
        policies: {
          checkIn: '16:00',
          checkOut: '12:00',
          cancellation: 'Moderate cancellation policy'
        },
        contact: { phone: '+1-555-0456', email: 'reservations@plazasuites.com' },
        bookingCode: 'MOCK456',
        bookingUrl: 'https://hotels.com/mock-booking-2',
        distance: '1.2 km from city center',
        provider: 'Hotels.com',
        reviews: { count: 892, rating: 3.8 }
      },
      {
        id: 'hotelscom_mock_3',
        name: `Boutique ${destination} Inn`,
        rating: 4.5,
        price: { total: 225, currency: 'USD' },
        pricePerNight: 225,
        location: {
          address: `789 Historic District, ${destination}`,
          cityName: destination,
          coordinates: { latitude: 40.7505, longitude: -73.9934 }
        },
        amenities: ['Free WiFi', 'Spa', 'Rooftop Bar', 'Concierge'],
        images: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400'
        ],
        room: {
          type: 'Premium Room',
          description: `Elegant boutique room with premium amenities in ${destination}`
        },
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Flexible cancellation policy'
        },
        contact: { phone: '+1-555-0789', email: 'stay@boutiqueinn.com' },
        bookingCode: 'MOCK789',
        bookingUrl: 'https://hotels.com/mock-booking-3',
        distance: '0.8 km from city center',
        provider: 'Hotels.com',
        reviews: { count: 634, rating: 4.5 }
      }
    ]

    return {
      hotels: mockHotels,
      meta: {
        count: mockHotels.length,
        provider: 'Hotels.com (Mock Data)',
        destination,
        searchedAt: new Date().toISOString(),
        note: 'Using mock data due to API rate limiting or unavailability'
      }
    }
  }
}

export default HotelsComService 