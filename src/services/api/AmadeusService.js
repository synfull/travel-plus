/**
 * Amadeus API Service - Real Flight and Hotel Search Integration
 * Phase 4: Complete API Integration for Travel+
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
    
    // Rate limiting
    this.requestCount = 0
    this.rateLimitReset = Date.now()
    this.maxRequestsPerSecond = 10
    
    // Caching
    this.cache = new Map()
    this.cacheTimeout = {
      flights: 30 * 60 * 1000,    // 30 minutes
      hotels: 60 * 60 * 1000,    // 1 hour
      locations: 24 * 60 * 60 * 1000 // 24 hours
    }
    
    console.log('🛫 AmadeusService: Initialized', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret
    })
  }

  /**
   * Authenticate with Amadeus API
   */
  async authenticate() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Amadeus API credentials not configured')
    }

    try {
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
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer
      
      console.log('✅ AmadeusService: Authentication successful')
      return this.accessToken
      
    } catch (error) {
      console.error('❌ AmadeusService: Authentication failed:', error.message)
      throw error
    }
  }

  /**
   * Make authenticated API request with rate limiting
   */
  async makeRequest(endpoint, options = {}) {
    await this.authenticate()
    await this.rateLimitDelay()
    
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()
      
    } catch (error) {
      console.error(`❌ AmadeusService: Request failed for ${endpoint}:`, error.message)
      throw error
    }
  }

  /**
   * Search for flights
   */
  async searchFlights({ origin, destination, departureDate, returnDate, passengers = 1, cabinClass = 'ECONOMY', maxPrice = null }) {
    const cacheKey = `flights_${origin}_${destination}_${departureDate}_${returnDate}_${passengers}_${cabinClass}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.flights)
    if (cached) {
      console.log('💾 AmadeusService: Using cached flight data')
      return cached
    }

    try {
      console.log(`🔍 AmadeusService: Searching flights ${origin} → ${destination}`)
      
      // Build search parameters
      const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults: passengers.toString(),
        travelClass: cabinClass,
        max: '20' // Limit results
      })

      if (returnDate) {
        params.append('returnDate', returnDate)
      }

      if (maxPrice) {
        params.append('maxPrice', maxPrice.toString())
      }

      const response = await this.makeRequest(`/shopping/flight-offers?${params}`)
      
      if (!response.data || response.data.length === 0) {
        console.warn('⚠️ AmadeusService: No flights found')
        return { flights: [], meta: { count: 0 } }
      }

      // Process flight offers
      const processedFlights = this.processFlightOffers(response.data, response.dictionaries)
      
      const result = {
        flights: processedFlights,
        meta: {
          count: processedFlights.length,
          currency: response.meta?.currency || 'USD',
          searchedAt: new Date().toISOString()
        }
      }

      // Cache the result
      this.setCache(cacheKey, result)
      
      console.log(`✅ AmadeusService: Found ${processedFlights.length} flight options`)
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Flight search failed:', error.message)
      throw error
    }
  }

  /**
   * Search for hotels
   */
  async searchHotels({ destination, checkInDate, checkOutDate, guests = 1, rooms = 1, maxPrice = null, amenities = [] }) {
    const cacheKey = `hotels_${destination}_${checkInDate}_${checkOutDate}_${guests}_${rooms}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.hotels)
    if (cached) {
      console.log('💾 AmadeusService: Using cached hotel data')
      return cached
    }

    try {
      console.log(`🏨 AmadeusService: Searching hotels in ${destination}`)
      
      // For test API, use fallback coordinates for major cities
      const coordinates = this.getCityCoordinates(destination)
      if (!coordinates) {
        throw new Error(`No coordinates found for destination: ${destination}`)
      }
      
      // Search for hotels by location
      const params = new URLSearchParams({
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
        checkInDate,
        checkOutDate,
        adults: guests.toString(),
        roomQuantity: rooms.toString(),
        radius: '20', // 20km radius
        radiusUnit: 'KM',
        paymentPolicy: 'NONE',
        includeClosed: 'false'
      })

      if (maxPrice) {
        params.append('priceRange', `0-${maxPrice}`)
      }

      const response = await this.makeRequest(`/shopping/hotel-offers?${params}`)
      
      if (!response.data || response.data.length === 0) {
        console.warn('⚠️ AmadeusService: No hotels found')
        return { hotels: [], meta: { count: 0 } }
      }

      // Process hotel offers
      const processedHotels = this.processHotelOffers(response.data)
      
      const result = {
        hotels: processedHotels,
        meta: {
          count: processedHotels.length,
          destination,
          searchedAt: new Date().toISOString()
        }
      }

      // Cache the result
      this.setCache(cacheKey, result)
      
      console.log(`✅ AmadeusService: Found ${processedHotels.length} hotel options`)
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Hotel search failed:', error.message)
      throw error
    }
  }

  /**
   * Get coordinates for major cities (fallback for test API)
   */
  getCityCoordinates(cityName) {
    const cityCoordinates = {
      'new york': { latitude: 40.7128, longitude: -74.0060 },
      'new york, usa': { latitude: 40.7128, longitude: -74.0060 },
      'paris': { latitude: 48.8566, longitude: 2.3522 },
      'paris, france': { latitude: 48.8566, longitude: 2.3522 },
      'london': { latitude: 51.5074, longitude: -0.1278 },
      'london, uk': { latitude: 51.5074, longitude: -0.1278 },
      'tokyo': { latitude: 35.6762, longitude: 139.6503 },
      'tokyo, japan': { latitude: 35.6762, longitude: 139.6503 },
      'toronto': { latitude: 43.6532, longitude: -79.3832 },
      'vancouver': { latitude: 49.2827, longitude: -123.1207 },
      'los angeles': { latitude: 34.0522, longitude: -118.2437 },
      'chicago': { latitude: 41.8781, longitude: -87.6298 },
      'miami': { latitude: 25.7617, longitude: -80.1918 },
      'amsterdam': { latitude: 52.3676, longitude: 4.9041 },
      'berlin': { latitude: 52.5200, longitude: 13.4050 },
      'rome': { latitude: 41.9028, longitude: 12.4964 },
      'madrid': { latitude: 40.4168, longitude: -3.7038 },
      'barcelona': { latitude: 41.3851, longitude: 2.1734 },
      'sydney': { latitude: -33.8688, longitude: 151.2093 },
      'melbourne': { latitude: -37.8136, longitude: 144.9631 }
    }
    
    const normalized = cityName.toLowerCase().trim()
    return cityCoordinates[normalized] || null
  }

  /**
   * Search for locations (airports, cities)
   */
  async searchLocations(query, types = ['AIRPORT', 'CITY']) {
    const cacheKey = `locations_${query}_${types.join(',')}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey, this.cacheTimeout.locations)
    if (cached) {
      return cached
    }

    try {
      const params = new URLSearchParams({
        keyword: query,
        'sub-type': types.join(','),
        'page[limit]': '10'
      })

      const response = await this.makeRequest(`/reference-data/locations?${params}`)
      
      const result = {
        locations: response.data || [],
        meta: response.meta || {}
      }

      // Cache the result
      this.setCache(cacheKey, result)
      
      return result
      
    } catch (error) {
      console.error('❌ AmadeusService: Location search failed:', error.message)
      throw error
    }
  }

  /**
   * Get flight inspiration (cheapest destinations)
   */
  async getFlightInspiration({ origin, maxPrice = null, departureDate = null }) {
    try {
      const params = new URLSearchParams({
        origin,
        maxPrice: maxPrice?.toString() || '1000',
        'page[limit]': '20'
      })

      if (departureDate) {
        params.append('departureDate', departureDate)
      }

      const response = await this.makeRequest(`/shopping/flight-destinations?${params}`)
      
      return {
        destinations: response.data || [],
        meta: response.meta || {}
      }
      
    } catch (error) {
      console.error('❌ AmadeusService: Flight inspiration failed:', error.message)
      throw error
    }
  }

  /**
   * Process flight offers from Amadeus API
   */
  processFlightOffers(flightOffers, dictionaries = {}) {
    return flightOffers.map(offer => {
      const price = offer.price
      const itineraries = offer.itineraries || []
      
      // Process outbound flight
      const outbound = itineraries[0]
      const outboundSegments = outbound?.segments || []
      const outboundFirst = outboundSegments[0]
      const outboundLast = outboundSegments[outboundSegments.length - 1]
      
      // Process return flight (if exists)
      const returnFlight = itineraries[1]
      const returnSegments = returnFlight?.segments || []
      const returnFirst = returnSegments[0]
      const returnLast = returnSegments[returnSegments.length - 1]
      
      return {
        id: offer.id,
        price: {
          total: parseFloat(price.total),
          currency: price.currency,
          base: parseFloat(price.base || price.total),
          fees: price.fees || []
        },
        outbound: outboundFirst ? {
          departure: {
            airport: outboundFirst.departure.iataCode,
            time: outboundFirst.departure.at,
            terminal: outboundFirst.departure.terminal
          },
          arrival: {
            airport: outboundLast.arrival.iataCode,
            time: outboundLast.arrival.at,
            terminal: outboundLast.arrival.terminal
          },
          duration: outbound.duration,
          stops: outboundSegments.length - 1,
          airline: this.getAirlineName(outboundFirst.carrierCode, dictionaries),
          flightNumber: `${outboundFirst.carrierCode}${outboundFirst.number}`,
          aircraft: outboundFirst.aircraft?.code
        } : null,
        return: returnFirst ? {
          departure: {
            airport: returnFirst.departure.iataCode,
            time: returnFirst.departure.at,
            terminal: returnFirst.departure.terminal
          },
          arrival: {
            airport: returnLast.arrival.iataCode,
            time: returnLast.arrival.at,
            terminal: returnLast.arrival.terminal
          },
          duration: returnFlight.duration,
          stops: returnSegments.length - 1,
          airline: this.getAirlineName(returnFirst.carrierCode, dictionaries),
          flightNumber: `${returnFirst.carrierCode}${returnFirst.number}`,
          aircraft: returnFirst.aircraft?.code
        } : null,
        bookingClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class || 'ECONOMY',
        validatingAirline: offer.validatingAirlineCodes?.[0],
        lastTicketingDate: offer.lastTicketingDate,
        segments: [...outboundSegments, ...returnSegments]
      }
    })
  }

  /**
   * Process hotel offers from Amadeus API
   */
  processHotelOffers(hotelOffers) {
    return hotelOffers.map(offer => {
      const hotel = offer.hotel
      const hotelOffer = offer.offers?.[0] || {}
      const price = hotelOffer.price || {}
      const room = hotelOffer.room || {}
      
      return {
        id: hotel.hotelId,
        name: hotel.name,
        rating: hotel.rating ? parseInt(hotel.rating) : null,
        location: {
          address: hotel.address || {},
          coordinates: hotel.geoCode || {},
          distance: hotel.distance || {}
        },
        price: {
          total: parseFloat(price.total || 0),
          currency: price.currency || 'USD',
          base: parseFloat(price.base || price.total || 0),
          taxes: price.taxes || []
        },
        room: {
          type: room.type,
          typeEstimated: room.typeEstimated,
          description: room.description?.text || 'Standard Room'
        },
        amenities: hotel.amenities || [],
        media: hotel.media || [],
        policies: {
          checkIn: hotelOffer.policies?.checkInOut?.checkIn,
          checkOut: hotelOffer.policies?.checkInOut?.checkOut,
          cancellation: hotelOffer.policies?.cancellation
        },
        contact: hotel.contact || {},
        available: true,
        bookingCode: hotelOffer.id
      }
    })
  }

  /**
   * Get airline name from code using dictionaries
   */
  getAirlineName(carrierCode, dictionaries = {}) {
    if (dictionaries.carriers && dictionaries.carriers[carrierCode]) {
      return dictionaries.carriers[carrierCode]
    }
    return carrierCode // Fallback to code if name not found
  }

  /**
   * Rate limiting implementation
   */
  async rateLimitDelay() {
    const now = Date.now()
    
    // Reset counter every second
    if (now >= this.rateLimitReset) {
      this.requestCount = 0
      this.rateLimitReset = now + 1000
    }
    
    // Wait if we've hit the rate limit
    if (this.requestCount >= this.maxRequestsPerSecond) {
      const waitTime = this.rateLimitReset - now
      if (waitTime > 0) {
        console.log(`⏳ AmadeusService: Rate limit reached, waiting ${waitTime}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.rateLimitReset = Date.now() + 1000
      }
    }
    
    this.requestCount++
  }

  /**
   * Cache management
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getFromCache(key, maxAge) {
    const cached = this.cache.get(key)
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data
    }
    return null
  }

  clearCache() {
    this.cache.clear()
    console.log('🗑️ AmadeusService: Cache cleared')
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      authenticated: !!this.accessToken,
      tokenExpiry: this.tokenExpiry,
      requestCount: this.requestCount,
      cacheSize: this.cache.size,
      rateLimitReset: this.rateLimitReset
    }
  }
} 