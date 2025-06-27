/**
 * Amadeus API Service - FULLY OPTIMIZED VERSION
 * Complete Integration for Travel+ with Enhanced Features
 */

import { API_CONFIG } from './config.js'

export class AmadeusService {
  constructor(options = {}) {
    this.clientId = API_CONFIG.AMADEUS.CLIENT_ID || options.clientId
    this.clientSecret = API_CONFIG.AMADEUS.CLIENT_SECRET || options.clientSecret
    this.baseUrl = API_CONFIG.AMADEUS.BASE_URL
    this.authUrl = API_CONFIG.AMADEUS.AUTH_URL
    
    // Authentication
    this.accessToken = null
    this.tokenExpiry = null
    
    // Enhanced Rate limiting
    this.requestCount = 0
    this.rateLimitReset = Date.now()
    this.maxRequestsPerSecond = 8 // Conservative limit
    this.requestQueue = []
    
    // Smart Caching with TTL
    this.cache = new Map()
    this.cacheTimeout = {
      flights: 15 * 60 * 1000,      // 15 minutes (flights change frequently)
      hotels: 30 * 60 * 1000,      // 30 minutes (hotels relatively stable)
      locations: 24 * 60 * 60 * 1000, // 24 hours (static data)
      inspiration: 60 * 60 * 1000,  // 1 hour (inspiration can be cached longer)
      details: 2 * 60 * 60 * 1000   // 2 hours (property details)
    }
    
    // Enhanced Error Handling
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    }
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      cacheHits: 0,
      retries: 0
    }
    
    console.log('🛫 AmadeusService: Fully Optimized Version Initialized', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret
    })
  }

  /**
   * STEP 5: Enhanced Authentication with Retry Logic
   */
  async authenticate() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Amadeus API credentials not configured')
    }

    return this.withRetry(async () => {
      console.log('🔐 AmadeusService: Authenticating...')
      
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Authentication failed: ${response.status} - ${error}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer
      
      console.log('✅ AmadeusService: Authentication successful')
      return this.accessToken
    })
  }

  /**
   * STEP 4: Enhanced API Request with Smart Rate Limiting & Retry Logic
   */
  async makeRequest(endpoint, options = {}) {
    await this.authenticate()
    
    return this.withRetry(async () => {
      await this.smartRateLimit()
      
      const url = `${this.baseUrl}${endpoint}`
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }

      this.stats.totalRequests++

      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error codes
        if (response.status === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED')
        }
        if (response.status === 401) {
          this.accessToken = null // Force re-authentication
          throw new Error('AUTHENTICATION_EXPIRED')
        }
        
        throw new Error(`API_ERROR_${response.status}: ${JSON.stringify(errorData)}`)
      }

      this.stats.successfulRequests++
      return await response.json()
    })
  }

  /**
   * STEP 2: Enhanced Flight Search with Multi-City & Flexibility
   */
  async searchFlights({ 
    origin, 
    destination, 
    departureDate, 
    returnDate, 
    passengers = 1, 
    cabinClass = 'ECONOMY', 
    maxPrice = null,
    flexible = false,
    multiCity = []
  }) {
    const cacheKey = `flights_${origin}_${destination}_${departureDate}_${returnDate}_${passengers}_${cabinClass}_${flexible}`
    
    // STEP 4: Smart Caching
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.flights)
    if (cached) {
      console.log('💾 AmadeusService: Using cached flight data')
      this.stats.cacheHits++
      return cached
    }

    try {
      console.log(`🔍 AmadeusService: Enhanced flight search ${origin} → ${destination}`)
      
      let results = []
      
      // Handle multi-city flights
      if (multiCity && multiCity.length > 0) {
        results = await this.searchMultiCityFlights({ multiCity, passengers, cabinClass, maxPrice })
      } else {
        // Standard or flexible search
        results = await this.searchStandardFlights({ 
          origin, destination, departureDate, returnDate, 
          passengers, cabinClass, maxPrice, flexible 
        })
      }

      const result = {
        flights: results,
        meta: {
          count: results.length,
          searchType: multiCity.length > 0 ? 'multi-city' : (flexible ? 'flexible' : 'standard'),
          searchedAt: new Date().toISOString(),
          cached: false
        }
      }

      // STEP 4: Cache the result
      this.setCache(cacheKey, result)
      
      console.log(`✅ AmadeusService: Found ${results.length} flight options`)
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Enhanced flight search failed:', error.message)
      throw new Error(`Flight search failed: ${error.message}`)
    }
  }

  /**
   * STEP 2: Flight Inspiration - "Where can I go for $X?"
   */
  async getFlightInspiration({ origin, maxPrice = null, departureDate = null, duration = null }) {
    const cacheKey = `inspiration_${origin}_${maxPrice}_${departureDate}_${duration}`
    
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.inspiration)
    if (cached) {
      console.log('💾 AmadeusService: Using cached inspiration data')
      this.stats.cacheHits++
      return cached
    }

    try {
      console.log(`✈️ AmadeusService: Getting flight inspiration from ${origin}`)
      
      const params = new URLSearchParams({
        origin,
        maxPrice: maxPrice || '1000',
        ...(departureDate && { departureDate }),
        ...(duration && { duration: duration.toString() })
      })

      const response = await this.makeRequest(`/v1/shopping/flight-destinations?${params}`)
      
      if (!response.data || response.data.length === 0) {
        return { destinations: [], meta: { count: 0 } }
      }

      const destinations = response.data.map(dest => ({
        destination: dest.destination,
        departureDate: dest.departureDate,
        returnDate: dest.returnDate,
        price: {
          total: parseFloat(dest.price?.total || 0),
          currency: dest.price?.currency || 'USD'
        },
        links: dest.links
      }))

      const result = {
        destinations,
        meta: {
          count: destinations.length,
          origin,
          searchedAt: new Date().toISOString()
        }
      }

      this.setCache(cacheKey, result)
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Flight inspiration failed:', error.message)
      throw error
    }
  }

  /**
   * STEP 1: MASSIVELY Enhanced Hotel Search with Better Filtering & Data Quality
   */
  async searchHotels({ 
    destination, 
    checkInDate, 
    checkOutDate, 
    guests = 1, 
    rooms = 1, 
    maxPrice = null, 
    minPrice = null,
    starRating = null,
    amenities = [],
    sortBy = 'PRICE',
    radius = 20,
    includeImages = true,
    includeDetails = true
  }) {
    const cacheKey = `hotels_enhanced_${destination}_${checkInDate}_${checkOutDate}_${guests}_${rooms}_${starRating}_${sortBy}`
    
    // STEP 4: Smart Caching
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.hotels)
    if (cached) {
      console.log('💾 AmadeusService: Using cached hotel data')
      this.stats.cacheHits++
      return cached
    }

    try {
      console.log(`🏨 AmadeusService: Enhanced hotel search in ${destination}`)
      
      // STEP 1: Enhanced City Mapping
      const cityCode = this.getEnhancedCityCode(destination)
      if (!cityCode) {
        throw new Error(`No city code found for destination: ${destination}`)
      }

      // STEP 4: Parallel Requests for better performance
      const [hotelList, cityCoordinates] = await Promise.all([
        this.getHotelList(cityCode, radius),
        this.getCityCoordinates(destination)
      ])

      if (!hotelList || hotelList.length === 0) {
        console.warn('⚠️ AmadeusService: No hotels found in city')
        return { hotels: [], meta: { count: 0, destination, cityCode } }
      }

      console.log(`🔍 AmadeusService: Found ${hotelList.length} hotels, checking availability...`)

      // Get availability for multiple hotels (batch processing)
      const availabilityResults = await this.batchCheckAvailability(
        hotelList.slice(0, 50), // Limit to top 50 hotels
        { checkInDate, checkOutDate, guests, rooms }
      )

      // STEP 3: Enhanced Data Processing with Images & Details
      let enhancedHotels = await this.enhanceHotelData(availabilityResults, {
        includeImages,
        includeDetails,
        cityCoordinates
      })

      // STEP 1: Advanced Filtering
      enhancedHotels = this.applyAdvancedFilters(enhancedHotels, {
        minPrice,
        maxPrice,
        starRating,
        amenities,
        sortBy
      })

      const result = {
        hotels: enhancedHotels.slice(0, 20), // Return top 20 results
        meta: {
          count: enhancedHotels.length,
          totalFound: hotelList.length,
          destination,
          cityCode,
          coordinates: cityCoordinates,
          filters: { minPrice, maxPrice, starRating, amenities, sortBy },
          searchedAt: new Date().toISOString(),
          cached: false
        }
      }

      // STEP 4: Cache the result
      this.setCache(cacheKey, result)
      
      console.log(`✅ AmadeusService: Enhanced search complete - ${enhancedHotels.length} hotels processed, returning top 20`)
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Enhanced hotel search failed:', error.message)
      throw new Error(`Hotel search failed: ${error.message}`)
    }
  }

  /**
   * STEP 1: Enhanced City Code Mapping (Expanded Database)
   */
  getEnhancedCityCode(destination) {
    const cityMappings = {
      // Major Global Cities
      'tokyo': 'TYO', 'japan': 'TYO',
      'paris': 'PAR', 'france': 'PAR',
      'london': 'LON', 'uk': 'LON', 'england': 'LON',
      'new york': 'NYC', 'nyc': 'NYC', 'manhattan': 'NYC',
      'los angeles': 'LAX', 'la': 'LAX', 'hollywood': 'LAX',
      'dubai': 'DXB', 'uae': 'DXB',
      'singapore': 'SIN',
      'hong kong': 'HKG', 'hongkong': 'HKG',
      'sydney': 'SYD', 'australia': 'SYD',
      'toronto': 'YTO', 'canada': 'YTO',
      'berlin': 'BER', 'germany': 'BER',
      'rome': 'ROM', 'italy': 'ROM',
      'madrid': 'MAD', 'spain': 'MAD',
      'amsterdam': 'AMS', 'netherlands': 'AMS',
      'barcelona': 'BCN',
      'istanbul': 'IST', 'turkey': 'IST',
      'mumbai': 'BOM', 'india': 'BOM',
      'bangkok': 'BKK', 'thailand': 'BKK',
      'seoul': 'SEL', 'korea': 'SEL',
      'moscow': 'MOW', 'russia': 'MOW',
      'cairo': 'CAI', 'egypt': 'CAI',
      'mexico city': 'MEX', 'mexico': 'MEX',
      'buenos aires': 'BUE', 'argentina': 'BUE',
      'sao paulo': 'SAO', 'brazil': 'SAO',
      'shanghai': 'SHA', 'china': 'SHA',
      'beijing': 'BJS',
      'lagos': 'LOS', 'nigeria': 'LOS',
      'johannesburg': 'JNB', 'south africa': 'JNB',
      
      // US Cities
      'chicago': 'CHI', 'miami': 'MIA', 'san francisco': 'SFO',
      'las vegas': 'LAS', 'seattle': 'SEA', 'boston': 'BOS',
      'washington': 'WAS', 'denver': 'DEN', 'atlanta': 'ATL',
      'dallas': 'DFW', 'houston': 'HOU', 'phoenix': 'PHX',
      
      // European Cities
      'vienna': 'VIE', 'prague': 'PRG', 'warsaw': 'WAW',
      'budapest': 'BUD', 'zurich': 'ZUR', 'geneva': 'GVA',
      'brussels': 'BRU', 'copenhagen': 'CPH', 'stockholm': 'STO',
      'oslo': 'OSL', 'helsinki': 'HEL', 'dublin': 'DUB',
      'lisbon': 'LIS', 'athens': 'ATH', 'milan': 'MIL',
      'florence': 'FLR', 'venice': 'VCE', 'nice': 'NCE',
      'lyon': 'LYS', 'munich': 'MUC', 'frankfurt': 'FRA',
      'hamburg': 'HAM', 'cologne': 'CGN'
    }
    
    const normalized = destination.toLowerCase().trim()
    return cityMappings[normalized] || null
  }

  /**
   * STEP 3: Enhanced Data Processing with Images and Rich Details
   */
  async enhanceHotelData(hotels, options = {}) {
    const { includeImages = true, includeDetails = true, cityCoordinates } = options
    
    if (!hotels || hotels.length === 0) return []

    return Promise.all(hotels.map(async (hotel) => {
      try {
        let enhanced = { ...hotel }

        // STEP 3: Add rich property details if requested
        if (includeDetails && hotel.id) {
          try {
            const details = await this.getHotelDetails(hotel.id)
            enhanced = { ...enhanced, ...details }
          } catch (error) {
            console.log(`⚠️ Could not fetch details for hotel ${hotel.id}:`, error.message)
          }
        }

        // STEP 3: Enhanced location data
        if (cityCoordinates && !enhanced.location?.coordinates) {
          enhanced.location = {
            ...enhanced.location,
            coordinates: cityCoordinates,
            distanceFromCenter: this.calculateDistance(
              enhanced.location?.coordinates || cityCoordinates,
              cityCoordinates
            )
          }
        }

        // STEP 3: Standardized amenities
        if (enhanced.amenities) {
          enhanced.amenities = this.standardizeAmenities(enhanced.amenities)
        }

        // STEP 3: Enhanced pricing information
        if (enhanced.price) {
          enhanced.price = {
            ...enhanced.price,
            pricePerNight: enhanced.price.total,
            totalWithTaxes: enhanced.price.total + (enhanced.price.taxes?.reduce((sum, tax) => sum + parseFloat(tax.amount || 0), 0) || 0),
            currency: enhanced.price.currency || 'USD'
          }
        }

        return enhanced
      } catch (error) {
        console.log(`⚠️ Error enhancing hotel data:`, error.message)
        return hotel // Return original data if enhancement fails
      }
    }))
  }

  /**
   * STEP 1: Advanced Filtering System
   */
  applyAdvancedFilters(hotels, filters = {}) {
    const { minPrice, maxPrice, starRating, amenities = [], sortBy = 'PRICE' } = filters
    
    let filtered = [...hotels]

    // Price filtering
    if (minPrice || maxPrice) {
      filtered = filtered.filter(hotel => {
        const price = hotel.price?.total || 0
        if (minPrice && price < minPrice) return false
        if (maxPrice && price > maxPrice) return false
        return true
      })
    }

    // Star rating filtering
    if (starRating) {
      filtered = filtered.filter(hotel => {
        const rating = hotel.rating || 0
        return rating >= starRating
      })
    }

    // Amenities filtering
    if (amenities.length > 0) {
      filtered = filtered.filter(hotel => {
        const hotelAmenities = (hotel.amenities || []).map(a => a.toLowerCase())
        return amenities.some(amenity => 
          hotelAmenities.some(ha => ha.includes(amenity.toLowerCase()))
        )
      })
    }

    // Advanced sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'PRICE_LOW_TO_HIGH':
          return (a.price?.total || 0) - (b.price?.total || 0)
        case 'PRICE_HIGH_TO_LOW':
          return (b.price?.total || 0) - (a.price?.total || 0)
        case 'RATING':
          return (b.rating || 0) - (a.rating || 0)
        case 'DISTANCE':
          return (a.location?.distanceFromCenter || 0) - (b.location?.distanceFromCenter || 0)
        case 'PRICE':
        default:
          return (a.price?.total || 0) - (b.price?.total || 0)
      }
    })

    return filtered
  }

  /**
   * STEP 4: Conservative Availability Checking (Fixed for Reality)
   */
  async batchCheckAvailability(hotels, searchParams) {
    const { checkInDate, checkOutDate, guests, rooms } = searchParams
    const results = []
    
    // REALITY CHECK: Only check top 5 hotels to avoid rate limiting hell
    const hotelSubset = hotels.slice(0, 5)
    console.log(`🔍 Checking availability for ${hotelSubset.length} top hotels (conservative approach)`)

    for (const hotel of hotelSubset) {
      try {
        const params = new URLSearchParams({
          hotelIds: hotel.hotelId,
          checkInDate,
          checkOutDate,
          adults: guests.toString(),
          roomQuantity: rooms.toString()
        })

        // Use the correct V3 endpoint as per official Amadeus documentation
        const response = await this.makeRequest(`/v3/shopping/hotel-offers?${params}`)
        
        if (response.data && response.data.length > 0) {
          const processed = this.processHotelOffersV3(response.data)
          results.push(...processed)
          console.log(`   ✅ ${hotel.name}: €${response.data[0]?.offers?.[0]?.price?.total || 'N/A'}`)
        } else {
          console.log(`   ⚠️ ${hotel.name}: No availability`)
        }
        
        // CRITICAL: Wait 3 seconds between each hotel check to avoid rate limiting
        await this.smartDelay(3000)
        
      } catch (error) {
        console.log(`   ❌ ${hotel.name}: ${error.message.includes('RATE_LIMIT') ? 'Rate limited' : 'Error'}`)
        
        // If we hit rate limiting, stop checking more hotels
        if (error.message.includes('RATE_LIMIT')) {
          console.log(`⚠️ Rate limit hit, stopping hotel checks to preserve API quota`)
          break
        }
        
        // Longer delay after any error
        await this.smartDelay(5000)
      }
    }

    console.log(`🏨 Successfully checked ${results.length} hotels with availability`)
    return results
  }

  /**
   * STEP 2: Multi-City Flight Search
   */
  async searchMultiCityFlights({ multiCity, passengers, cabinClass, maxPrice }) {
    console.log('🌍 AmadeusService: Searching multi-city flights')
    
    // For multi-city, we'll search each leg separately and combine
    const flightLegs = []
    
    for (const [index, leg] of multiCity.entries()) {
      try {
        const params = new URLSearchParams({
          originLocationCode: leg.origin,
          destinationLocationCode: leg.destination,
          departureDate: leg.departureDate,
          adults: passengers.toString(),
          travelClass: cabinClass,
          max: '5' // Fewer results per leg for multi-city
        })

        const response = await this.makeRequest(`/v2/shopping/flight-offers?${params}`)
        
        if (response.data && response.data.length > 0) {
          const processedFlights = this.processFlightOffers(response.data, response.dictionaries)
          flightLegs.push({
            leg: index + 1,
            route: `${leg.origin} → ${leg.destination}`,
            flights: processedFlights.slice(0, 3) // Top 3 options per leg
          })
        }
        
        // Rate limiting between requests
        await this.smartDelay(1000)
        
      } catch (error) {
        console.log(`⚠️ Multi-city leg ${index + 1} failed:`, error.message)
      }
    }

    return flightLegs
  }

  /**
   * STEP 2: Flexible Date Flight Search
   */
  async searchStandardFlights({ origin, destination, departureDate, returnDate, passengers, cabinClass, maxPrice, flexible }) {
    const flights = []
    const datesToSearch = flexible ? this.generateFlexibleDates(departureDate, returnDate) : [{ departureDate, returnDate }]

    for (const dates of datesToSearch) {
      try {
        const params = new URLSearchParams({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: dates.departureDate,
          adults: passengers.toString(),
          travelClass: cabinClass,
          max: flexible ? '5' : '20'
        })

        if (dates.returnDate) {
          params.append('returnDate', dates.returnDate)
        }

        if (maxPrice) {
          params.append('maxPrice', maxPrice.toString())
        }

        const response = await this.makeRequest(`/v2/shopping/flight-offers?${params}`)
        
        if (response.data && response.data.length > 0) {
          const processedFlights = this.processFlightOffers(response.data, response.dictionaries)
          flights.push(...processedFlights)
        }

        if (flexible) {
          await this.smartDelay(800) // Delay between flexible date searches
        }
        
      } catch (error) {
        console.log(`⚠️ Flight search failed for ${dates.departureDate}:`, error.message)
      }
    }

    // Remove duplicates and sort by price
    const uniqueFlights = this.removeDuplicateFlights(flights)
    return uniqueFlights.sort((a, b) => (a.price?.total || 0) - (b.price?.total || 0))
  }

  /**
   * STEP 2: Generate Flexible Date Options (±3 days)
   */
  generateFlexibleDates(departureDate, returnDate) {
    const dates = []
    const baseDepDate = new Date(departureDate)
    
    for (let i = -3; i <= 3; i++) {
      const newDepDate = new Date(baseDepDate)
      newDepDate.setDate(baseDepDate.getDate() + i)
      
      const dateObj = {
        departureDate: newDepDate.toISOString().split('T')[0]
      }
      
      if (returnDate) {
        const baseRetDate = new Date(returnDate)
        const newRetDate = new Date(baseRetDate)
        newRetDate.setDate(baseRetDate.getDate() + i)
        dateObj.returnDate = newRetDate.toISOString().split('T')[0]
      }
      
      dates.push(dateObj)
    }
    
    return dates
  }

  /**
   * STEP 3: Get Detailed Hotel Information
   */
  async getHotelDetails(hotelId) {
    const cacheKey = `hotel_details_${hotelId}`
    
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.details)
    if (cached) {
      this.stats.cacheHits++
      return cached
    }

    try {
      // Use the correct V1 endpoint as per official Amadeus documentation
      const response = await this.makeRequest(`/v1/reference-data/locations/hotels/by-hotels?hotelIds=${hotelId}`)
      
      if (response.data && response.data.length > 0) {
        const hotel = response.data[0]
        const details = {
          description: hotel.name,
          address: hotel.address,
          contact: hotel.contact,
          amenities: hotel.amenities || [],
          rating: hotel.rating,
          location: {
            coordinates: hotel.geoCode,
            address: hotel.address
          }
        }
        
        this.setCache(cacheKey, details)
        return details
      }
      
      return {}
    } catch (error) {
      console.log(`⚠️ Hotel details fetch failed for ${hotelId}:`, error.message)
      return {}
    }
  }

  /**
   * STEP 1: Get Enhanced Hotel List
   */
  async getHotelList(cityCode, radius = 20) {
    try {
      // Use the correct V1 endpoint as per official Amadeus documentation
      const response = await this.makeRequest(`/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=${radius}&radiusUnit=KM`)
      
      if (response.data && response.data.length > 0) {
        return response.data
      }
      
      return []
    } catch (error) {
      console.log(`⚠️ Hotel list fetch failed for ${cityCode}:`, error.message)
      return []
    }
  }

  /**
   * STEP 3: Standardize Amenities
   */
  standardizeAmenities(amenities) {
    const standardAmenities = {
      'WIFI': ['WiFi', 'Wi-Fi', 'Internet', 'Wireless'],
      'POOL': ['Pool', 'Swimming Pool', 'Indoor Pool', 'Outdoor Pool'],
      'GYM': ['Gym', 'Fitness', 'Fitness Center', 'Exercise'],
      'SPA': ['Spa', 'Wellness', 'Massage', 'Sauna'],
      'RESTAURANT': ['Restaurant', 'Dining', 'Room Service'],
      'BAR': ['Bar', 'Lounge', 'Cocktail'],
      'PARKING': ['Parking', 'Valet', 'Self Parking'],
      'PET_FRIENDLY': ['Pet', 'Dog', 'Cat', 'Animal'],
      'BUSINESS': ['Business Center', 'Meeting', 'Conference'],
      'AIRPORT_SHUTTLE': ['Shuttle', 'Airport Transfer', 'Transportation']
    }

    const result = []
    
    amenities.forEach(amenity => {
      const amenityStr = typeof amenity === 'string' ? amenity : amenity.description || ''
      
      for (const [standard, variants] of Object.entries(standardAmenities)) {
        if (variants.some(variant => amenityStr.toLowerCase().includes(variant.toLowerCase()))) {
          if (!result.includes(standard)) {
            result.push(standard)
          }
        }
      }
    })

    return result
  }

  /**
   * STEP 4: Smart Rate Limiting with Queue
   */
  async smartRateLimit() {
    const now = Date.now()
    
    // Reset counter every second
    if (now - this.rateLimitReset > 1000) {
      this.requestCount = 0
      this.rateLimitReset = now
    }

    // If we're at the limit, wait
    if (this.requestCount >= this.maxRequestsPerSecond) {
      const waitTime = 1000 - (now - this.rateLimitReset)
      if (waitTime > 0) {
        await this.smartDelay(waitTime)
        return this.smartRateLimit() // Recursive call after waiting
      }
    }

    this.requestCount++
  }

  /**
   * STEP 4: Smart Delay Utility
   */
  async smartDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * STEP 5: Retry Logic with Exponential Backoff
   */
  async withRetry(operation, context = 'operation') {
    let lastError
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        this.stats.retries++

        // Don't retry certain errors
        if (error.message.includes('AUTHENTICATION_EXPIRED') && attempt > 0) {
          break
        }
        
        if (attempt === this.retryConfig.maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt),
          this.retryConfig.maxDelay
        )

        console.log(`⚠️ ${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms...`)
        await this.smartDelay(delay)
      }
    }

    throw new Error(`${context} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError.message}`)
  }

  /**
   * STEP 3: Calculate Distance Between Coordinates
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return null
    
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.latitude - coord1.latitude)
    const dLon = this.deg2rad(coord2.longitude - coord1.longitude)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.latitude)) * Math.cos(this.deg2rad(coord2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in kilometers
  }

  deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  /**
   * STEP 2: Remove Duplicate Flights
   */
  removeDuplicateFlights(flights) {
    const seen = new Set()
    return flights.filter(flight => {
      const key = `${flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode}_${flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode}_${flight.itineraries?.[0]?.segments?.[0]?.departure?.at}_${flight.price?.total}`
      
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * STEP 1: Enhanced City Coordinates
   */
  getCityCoordinates(destination) {
    const coordinates = {
      'tokyo': { latitude: 35.6762, longitude: 139.6503 },
      'paris': { latitude: 48.8566, longitude: 2.3522 },
      'london': { latitude: 51.5074, longitude: -0.1278 },
      'new york': { latitude: 40.7128, longitude: -74.0060 },
      'los angeles': { latitude: 34.0522, longitude: -118.2437 },
      'dubai': { latitude: 25.2048, longitude: 55.2708 },
      'singapore': { latitude: 1.3521, longitude: 103.8198 },
      'hong kong': { latitude: 22.3193, longitude: 114.1694 },
      'sydney': { latitude: -33.8688, longitude: 151.2093 },
      'toronto': { latitude: 43.6532, longitude: -79.3832 },
      'berlin': { latitude: 52.5200, longitude: 13.4050 },
      'rome': { latitude: 41.9028, longitude: 12.4964 },
      'madrid': { latitude: 40.4168, longitude: -3.7038 },
      'amsterdam': { latitude: 52.3676, longitude: 4.9041 },
      'barcelona': { latitude: 41.3851, longitude: 2.1734 },
      'istanbul': { latitude: 41.0082, longitude: 28.9784 },
      'mumbai': { latitude: 19.0760, longitude: 72.8777 },
      'bangkok': { latitude: 13.7563, longitude: 100.5018 },
      'seoul': { latitude: 37.5665, longitude: 126.9780 },
      'moscow': { latitude: 55.7558, longitude: 37.6176 }
    }
    
    return coordinates[destination.toLowerCase()] || null
  }

  // Keep existing methods for compatibility
  async searchLocations(query, types = ['AIRPORT', 'CITY']) {
    const cacheKey = `locations_${query}_${types.join(',')}`
    
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.locations)
    if (cached) {
      this.stats.cacheHits++
      return cached
    }

    try {
      const params = new URLSearchParams({
        keyword: query,
        subType: types.join(',')
      })

      const response = await this.makeRequest(`/v1/reference-data/locations?${params}`)
      
      const result = {
        locations: response.data || [],
        meta: {
          count: response.data?.length || 0,
          searchedAt: new Date().toISOString()
        }
      }

      this.setCache(cacheKey, result)
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Location search failed:', error.message)
      throw error
    }
  }

  processFlightOffers(flightOffers, dictionaries = {}) {
    return flightOffers.map(offer => {
      const itinerary = offer.itineraries?.[0]
      const segment = itinerary?.segments?.[0]
      const price = offer.price || {}
      
      return {
        id: offer.id,
        price: {
          total: parseFloat(price.total || 0),
          currency: price.currency || 'USD',
          base: parseFloat(price.base || price.total || 0),
          fees: price.fees || [],
          taxes: price.taxes || []
        },
        itineraries: offer.itineraries?.map(itin => ({
          duration: itin.duration,
          segments: itin.segments?.map(seg => ({
            departure: {
              iataCode: seg.departure?.iataCode,
              terminal: seg.departure?.terminal,
              at: seg.departure?.at
            },
            arrival: {
              iataCode: seg.arrival?.iataCode,
              terminal: seg.arrival?.terminal,
              at: seg.arrival?.at
            },
            carrierCode: seg.carrierCode,
            number: seg.number,
            aircraft: seg.aircraft?.code,
            duration: seg.duration,
            airline: this.getAirlineName(seg.carrierCode, dictionaries)
          }))
        })),
        travelerPricings: offer.travelerPricings || [],
        validatingAirlineCodes: offer.validatingAirlineCodes || [],
        bookingLink: `https://www.amadeus.com/book/${offer.id}` // Mock booking link
      }
    })
  }

  processHotelOffersV3(hotelOffers) {
    return hotelOffers.map(hotel => {
      const hotelData = hotel.hotel || {}
      const offers = hotel.offers || []
      const bestOffer = offers[0] || {}
      const room = bestOffer.room || {}
      const price = bestOffer.price || {}

      return {
        id: hotelData.hotelId,
        name: hotelData.name,
        rating: hotelData.rating ? parseInt(hotelData.rating) : null,
        location: {
          address: hotelData.address || {},
          coordinates: hotelData.geoCode || {},
          cityCode: hotelData.cityCode
        },
        price: {
          total: parseFloat(price.total || 0),
          currency: price.currency || 'USD',
          base: parseFloat(price.base || price.total || 0),
          taxes: price.taxes || [],
          variations: price.variations || []
        },
        room: {
          type: room.type,
          typeEstimated: room.typeEstimated,
          description: room.description
        },
        offers: offers.length,
        policies: bestOffer.policies || {},
        amenities: hotelData.amenities || [],
        contact: hotelData.contact || {},
        checkInDate: bestOffer.checkInDate,
        checkOutDate: bestOffer.checkOutDate,
        roomQuantity: bestOffer.roomQuantity || 1,
        bookingLink: `https://www.amadeus.com/book/hotel/${hotelData.hotelId}` // Mock booking link
      }
    })
  }

  getAirlineName(carrierCode, dictionaries = {}) {
    return dictionaries.carriers?.[carrierCode] || carrierCode
  }

  /**
   * STEP 4: Enhanced Cache Management
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    
    // Clean old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanCache()
    }
  }

  getFromCache(key, maxAge) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  cleanCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      // Remove entries older than 1 hour
      if (now - value.timestamp > 60 * 60 * 1000) {
        this.cache.delete(key)
      }
    }
  }

  clearCache() {
    this.cache.clear()
    console.log('🧹 AmadeusService: Cache cleared')
  }

  /**
   * STEP 5: Enhanced Statistics & Monitoring
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      currentRequests: this.requestCount,
      successRate: this.stats.totalRequests > 0 ? 
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : 'N/A',
      cacheHitRate: this.stats.totalRequests > 0 ? 
        (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2) + '%' : 'N/A'
    }
  }

  /**
   * Health Check Method
   */
  async healthCheck() {
    try {
      await this.authenticate()
      const testLocation = await this.searchLocations('NYC', ['CITY'])
      
      return {
        status: 'healthy',
        authenticated: !!this.accessToken,
        apiReachable: !!testLocation,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      }
    }
  }
} 