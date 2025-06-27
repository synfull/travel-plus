/**
 * Real Google Places API Service
 * Phase 3: Live venue discovery with intelligent caching
 */

import { VenueCategory, Venue } from '../types/index.js'

export class GooglePlacesService {
  constructor(options = {}) {
    // Browser-compatible environment variable access
    const getApiKey = () => {
      // Try Node.js environment variables first (server/testing)
      if (typeof process !== 'undefined' && process.env) {
        return process.env.GOOGLE_PLACES_API_KEY || 
               process.env.VITE_GOOGLE_MAPS_API_KEY ||
               process.env.VITE_GOOGLE_PLACES_API_KEY
      }
      // Try Vite environment variables (browser)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }
      // Fallback to options
      return options.apiKey
    }

    this.options = {
      apiKey: getApiKey(),
      baseUrl: 'https://maps.googleapis.com/maps/api/place',
      proxyUrl: '/.netlify/functions/google-places-proxy', // New proxy URL
      maxResults: 20,
      radius: 5000, // 5km radius
      enableCaching: true,
      cacheTimeout: 3600000, // 1 hour
      useProxy: true, // Feature flag to enable/disable proxy
      ...options
    }

    this.cache = new Map()
    this.requestCount = 0
    this.rateLimitDelayMs = 100 // ms between requests
    
    console.log('🌐 GooglePlacesService: Real API integration initialized')
    console.log(`🔑 GooglePlacesService: API Key configured: ${this.options.apiKey ? 'YES' : 'NO'}`)
    console.log(`🔄 GooglePlacesService: Using proxy: ${this.options.useProxy ? 'YES' : 'NO'}`)
  }

  /**
   * Call Google Places API through proxy or directly
   */
  async callGooglePlacesAPI(endpoint, params = {}) {
    if (this.options.useProxy) {
      // Use Netlify function proxy to avoid CORS issues
      const queryParams = new URLSearchParams({
        endpoint,
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [`params.${key}`, value])
        )
      })
      
      const proxyUrl = `${this.options.proxyUrl}?${queryParams.toString()}`
      console.log(`🔄 GooglePlacesService: Using proxy for ${endpoint}`)
      
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } else {
      // Direct API call (original method) - may fail due to CORS in browser
      const apiUrl = this.buildDirectAPIUrl(endpoint, params)
      console.log(`🌐 GooglePlacesService: Direct API call to ${endpoint}`)
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    }
  }

  /**
   * Build direct API URL (for fallback/testing)
   */
  buildDirectAPIUrl(endpoint, params) {
    const endpointUrls = {
      geocode: 'https://maps.googleapis.com/maps/api/geocode/json',
      nearbysearch: `${this.options.baseUrl}/nearbysearch/json`,
      textsearch: `${this.options.baseUrl}/textsearch/json`,
      details: `${this.options.baseUrl}/details/json`,
      photos: `${this.options.baseUrl}/photo`
    }
    
    const baseUrl = endpointUrls[endpoint]
    if (!baseUrl) {
      throw new Error(`Unknown endpoint: ${endpoint}`)
    }
    
    const queryParams = new URLSearchParams({
      ...params,
      key: this.options.apiKey
    })
    
    return `${baseUrl}?${queryParams.toString()}`
  }

  /**
   * Search for venues using Google Places API
   */
  async searchVenues(destination, categories = [], preferences = []) {
    console.log(`🔍 GooglePlacesService: Searching venues in ${destination}`)
    
    try {
      // Step 1: Get destination coordinates
      const coordinates = await this.geocodeDestination(destination)
      if (!coordinates) {
        throw new Error(`Failed to geocode destination: ${destination}`)
      }

      // Step 2: Generate search queries based on categories and preferences
      const searchQueries = this.generateSearchQueries(destination, categories, preferences)
      
      // Step 3: Execute searches in parallel with rate limiting
      const searchResults = await this.executeSearches(coordinates, searchQueries)
      
      // Step 4: Process and deduplicate results
      const venues = this.processSearchResults(searchResults, destination)
      
      console.log(`✅ GooglePlacesService: Found ${venues.length} venues for ${destination}`)
      return venues
      
    } catch (error) {
      console.error(`❌ GooglePlacesService: Search failed for ${destination}:`, error.message)
      throw error
    }
  }

  /**
   * Get detailed information about a specific venue
   */
  async getVenueDetails(placeId) {
    const cacheKey = `details_${placeId}`
    
    // Check cache first
    if (this.options.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
        console.log(`💾 GooglePlacesService: Using cached details for ${placeId}`)
        return cached.data
      }
    }

    try {
      await this.rateLimitDelay()
      
      // Use proxy to avoid CORS issues
      const data = await this.callGooglePlacesAPI('details', {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,opening_hours,photos,reviews,website,formatted_phone_number,types'
      })

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`)
      }

      const details = this.processVenueDetails(data.result)
      
      // Cache the result
      if (this.options.enableCaching) {
        this.cache.set(cacheKey, {
          data: details,
          timestamp: Date.now()
        })
      }

      return details

    } catch (error) {
      console.error(`❌ GooglePlacesService: Failed to get details for ${placeId}:`, error.message)
      throw error
    }
  }

  /**
   * Geocode destination to get coordinates
   */
  async geocodeDestination(destination) {
    const cacheKey = `geocode_${destination.toLowerCase()}`
    
    // Check cache first
    if (this.options.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.options.cacheTimeout * 24) { // Cache geocoding for 24 hours
        return cached.data
      }
    }

    try {
      await this.rateLimitDelay()
      
      // Use proxy to avoid CORS issues
      const data = await this.callGooglePlacesAPI('geocode', {
        address: destination
      })

      if (data.status !== 'OK' || !data.results.length) {
        throw new Error(`Geocoding failed: ${data.status}`)
      }

      const coordinates = data.results[0].geometry.location
      
      // Cache the result
      if (this.options.enableCaching) {
        this.cache.set(cacheKey, {
          data: coordinates,
          timestamp: Date.now()
        })
      }

      console.log(`📍 GooglePlacesService: Geocoded ${destination} to ${coordinates.lat}, ${coordinates.lng}`)
      return coordinates

    } catch (error) {
      console.error(`❌ GooglePlacesService: Geocoding failed for ${destination}:`, error.message)
      return null
    }
  }

  /**
   * Generate intelligent search queries based on preferences
   */
  generateSearchQueries(destination, categories, preferences) {
    const queries = []
    
    // Base queries for each category
    const categoryQueries = {
      [VenueCategory.DINING]: [
        'restaurants',
        'cafes',
        'local cuisine',
        'fine dining',
        'food'
      ],
      [VenueCategory.CULTURE]: [
        'museums',
        'art galleries',
        'cultural sites',
        'historical places',
        'theaters'
      ],
      [VenueCategory.NATURE]: [
        'parks',
        'gardens',
        'nature reserves',
        'outdoor activities',
        'scenic spots'
      ],
      [VenueCategory.SHOPPING]: [
        'shopping',
        'markets',
        'boutiques',
        'malls',
        'local shops'
      ],
      [VenueCategory.NIGHTLIFE]: [
        'bars',
        'nightlife',
        'clubs',
        'entertainment',
        'live music'
      ],
      [VenueCategory.ATTRACTION]: [
        'attractions',
        'landmarks',
        'monuments',
        'tourist spots',
        'sightseeing'
      ]
    }

    // Add category-specific queries
    categories.forEach(category => {
      const categorySpecificQueries = categoryQueries[category] || []
      categorySpecificQueries.forEach(query => {
        queries.push({
          query: query,
          category: category,
          type: 'category'
        })
      })
    })

    // Add preference-specific queries
    preferences.forEach(preference => {
      queries.push({
        query: preference,
        category: this.inferCategoryFromPreference(preference),
        type: 'preference'
      })
    })

    // Add general discovery queries
    queries.push(
      { query: 'things to do', category: VenueCategory.ATTRACTION, type: 'general' },
      { query: 'popular places', category: VenueCategory.ATTRACTION, type: 'general' },
      { query: 'local favorites', category: VenueCategory.DINING, type: 'general' }
    )

    return queries.slice(0, 15) // Limit to avoid API quota issues
  }

  /**
   * Execute multiple searches with rate limiting
   */
  async executeSearches(coordinates, searchQueries) {
    const results = []
    
    for (const queryObj of searchQueries) {
      try {
        await this.rateLimitDelay()
        const searchResult = await this.performNearbySearch(coordinates, queryObj)
        results.push(...searchResult)
      } catch (error) {
        console.warn(`⚠️ GooglePlacesService: Search failed for "${queryObj.query}":`, error.message)
      }
    }

    return results
  }

  /**
   * Perform a nearby search using Google Places API
   */
  async performNearbySearch(coordinates, queryObj) {
    const cacheKey = `search_${coordinates.lat}_${coordinates.lng}_${queryObj.query}`
    
    // Check cache first
    if (this.options.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
        return cached.data
      }
    }

    try {
      this.requestCount++
      
      // Use proxy to avoid CORS issues
      const data = await this.callGooglePlacesAPI('nearbysearch', {
        location: `${coordinates.lat},${coordinates.lng}`,
        radius: this.options.radius,
        keyword: queryObj.query
      })

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`)
      }

      const results = data.results.map(place => ({
        ...place,
        searchCategory: queryObj.category,
        searchType: queryObj.type
      }))

      // Cache the result
      if (this.options.enableCaching) {
        this.cache.set(cacheKey, {
          data: results,
          timestamp: Date.now()
        })
      }

      console.log(`🔍 GooglePlacesService: Found ${results.length} results for "${queryObj.query}"`)
      return results

    } catch (error) {
      console.error(`❌ GooglePlacesService: Nearby search failed for "${queryObj.query}":`, error.message)
      return []
    }
  }

  /**
   * Process and convert search results to venue objects
   */
  processSearchResults(searchResults, destination) {
    const venueMap = new Map()
    
    searchResults.forEach(place => {
      // Skip if already processed (deduplicate by place_id)
      if (venueMap.has(place.place_id)) {
        return
      }

      const venue = this.convertPlaceToVenue(place, destination)
      if (venue) {
        venueMap.set(place.place_id, venue)
      }
    })

    return Array.from(venueMap.values())
      .sort((a, b) => b.popularity - a.popularity) // Sort by popularity
      .slice(0, this.options.maxResults) // Limit results
  }

  /**
   * Convert Google Places result to Venue object
   */
  convertPlaceToVenue(place, destination) {
    try {
      const venue = new Venue({
        id: place.place_id,
        name: place.name,
        category: this.mapGoogleTypesToCategory(place.types, place.searchCategory),
        description: this.generateDescription(place, destination),
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        address: place.vicinity || place.formatted_address,
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level || 0,
        photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : [],
        isOpen: place.opening_hours?.open_now,
        source: 'google_places',
        googlePlaceId: place.place_id,
        popularity: this.calculatePopularity(place)
      })

      return venue
    } catch (error) {
      console.warn(`⚠️ GooglePlacesService: Failed to convert place "${place.name}":`, error.message)
      return null
    }
  }

  /**
   * Process detailed venue information
   */
  processVenueDetails(placeDetails) {
    return {
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      coordinates: placeDetails.geometry.location,
      rating: placeDetails.rating,
      reviewCount: placeDetails.user_ratings_total,
      priceLevel: placeDetails.price_level,
      website: placeDetails.website,
      phone: placeDetails.formatted_phone_number,
      openingHours: placeDetails.opening_hours,
      photos: placeDetails.photos,
      reviews: placeDetails.reviews,
      types: placeDetails.types
    }
  }

  /**
   * Map Google Places types to our venue categories
   */
  mapGoogleTypesToCategory(types, searchCategory) {
    if (searchCategory) return searchCategory

    const typeMapping = {
      restaurant: VenueCategory.DINING,
      food: VenueCategory.DINING,
      cafe: VenueCategory.DINING,
      bar: VenueCategory.NIGHTLIFE,
      night_club: VenueCategory.NIGHTLIFE,
      museum: VenueCategory.CULTURE,
      art_gallery: VenueCategory.CULTURE,
      tourist_attraction: VenueCategory.ATTRACTION,
      park: VenueCategory.NATURE,
      shopping_mall: VenueCategory.SHOPPING,
      store: VenueCategory.SHOPPING
    }

    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type]
      }
    }

    return VenueCategory.ATTRACTION // Default category
  }

  /**
   * Generate venue description
   */
  generateDescription(place, destination) {
    const rating = place.rating ? `${place.rating}/5 stars` : 'Not rated'
    const reviews = place.user_ratings_total ? `${place.user_ratings_total} reviews` : 'No reviews'
    const priceLevel = place.price_level ? '$'.repeat(place.price_level) : 'Price not available'
    
    return `A popular ${this.getVenueTypeDescription(place.types)} in ${destination}. ${rating} with ${reviews}. Price level: ${priceLevel}.`
  }

  /**
   * Get venue type description from Google types
   */
  getVenueTypeDescription(types) {
    const descriptions = {
      restaurant: 'restaurant',
      cafe: 'cafe',
      bar: 'bar',
      museum: 'museum',
      art_gallery: 'art gallery',
      tourist_attraction: 'attraction',
      park: 'park',
      shopping_mall: 'shopping destination'
    }

    for (const type of types) {
      if (descriptions[type]) {
        return descriptions[type]
      }
    }

    return 'venue'
  }

  /**
   * Calculate venue popularity score
   */
  calculatePopularity(place) {
    let score = 0
    
    // Rating contribution (0-40 points)
    if (place.rating) {
      score += (place.rating / 5) * 40
    }
    
    // Review count contribution (0-30 points)
    if (place.user_ratings_total) {
      score += Math.min(30, Math.log10(place.user_ratings_total) * 10)
    }
    
    // Price level contribution (0-20 points, higher price = more exclusive)
    if (place.price_level) {
      score += place.price_level * 5
    }
    
    // Photo availability (0-10 points)
    if (place.photos && place.photos.length > 0) {
      score += Math.min(10, place.photos.length * 2)
    }

    return Math.round(score)
  }

  /**
   * Infer category from preference string
   */
  inferCategoryFromPreference(preference) {
    const pref = preference.toLowerCase()
    
    if (pref.includes('food') || pref.includes('dining') || pref.includes('restaurant')) {
      return VenueCategory.DINING
    }
    if (pref.includes('culture') || pref.includes('art') || pref.includes('museum') || pref.includes('history')) {
      return VenueCategory.CULTURE
    }
    if (pref.includes('nature') || pref.includes('outdoor') || pref.includes('park')) {
      return VenueCategory.NATURE
    }
    if (pref.includes('shopping') || pref.includes('market')) {
      return VenueCategory.SHOPPING
    }
    if (pref.includes('nightlife') || pref.includes('bar') || pref.includes('club')) {
      return VenueCategory.NIGHTLIFE
    }
    
    return VenueCategory.ATTRACTION
  }

  /**
   * Rate limiting helper
   */
  async rateLimitDelay() {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs))
  }

  /**
   * Get API usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate()
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    console.log('🧹 GooglePlacesService: Cache cleared')
  }

  /**
   * Calculate cache hit rate (placeholder)
   */
  calculateCacheHitRate() {
    // This would require tracking cache hits vs misses
    return 0.75 // Placeholder value
  }

  /**
   * Get hotel images using Google Places Photo API
   */
  async getHotelImages(hotelName, location, maxImages = 3) {
    try {
      console.log(`📸 Fetching images for hotel: ${hotelName} in ${location}`)
      
      // Search for the hotel specifically using proxy
      const searchQuery = `${hotelName} hotel ${location}`
      
      const data = await this.callGooglePlacesAPI('textsearch', {
        query: searchQuery,
        type: 'lodging'
      })
      
      if (data.results && data.results.length > 0) {
        const hotel = data.results[0] // Get the best match
        
        if (hotel.photos && hotel.photos.length > 0) {
          // Convert photo references to actual image URLs using proxy
          const imageUrls = hotel.photos.slice(0, maxImages).map(photo => {
            if (this.options.useProxy) {
              // Use proxy for photo URLs to avoid CORS
              return `${this.options.proxyUrl}?endpoint=photos&params.photoreference=${photo.photo_reference}&params.maxwidth=800`
            } else {
              // Direct API call (original method)
              return `${this.options.baseUrl}/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${this.options.apiKey}`
            }
          })
          
          console.log(`✅ Found ${imageUrls.length} images for ${hotelName}`)
          return imageUrls
        }
      }
      
      console.log(`⚠️ No images found for ${hotelName}`)
      return []
      
    } catch (error) {
      console.error(`❌ Error fetching hotel images:`, error.message)
      return []
    }
  }

  /**
   * Enhance hotel data with real images
   */
  async enhanceHotelWithImages(hotel) {
    try {
      if (!hotel.name || !hotel.location?.cityName) {
        return hotel // Return unchanged if missing required data
      }
      
      // Get real images from Google Places
      const realImages = await this.getHotelImages(hotel.name, hotel.location.cityName)
      
      if (realImages.length > 0) {
        return {
          ...hotel,
          images: realImages,
          imageSource: 'google_places'
        }
      }
      
      // If no real images found, use themed fallback images based on hotel name/location
      const fallbackImages = this.getThemedFallbackImages(hotel)
      
      return {
        ...hotel,
        images: fallbackImages,
        imageSource: 'themed_fallback'
      }
      
    } catch (error) {
      console.error(`❌ Error enhancing hotel with images:`, error.message)
      return hotel // Return unchanged on error
    }
  }

  /**
   * Get themed fallback images based on hotel characteristics
   */
  getThemedFallbackImages(hotel) {
    const { name, location, rating } = hotel
    const cityName = location?.cityName || 'destination'
    const isLuxury = rating >= 4.5
    const isBeach = location?.address?.toLowerCase().includes('beach') || cityName.toLowerCase().includes('beach')
    const isCity = location?.address?.toLowerCase().includes('downtown') || location?.address?.toLowerCase().includes('center')
    
    let images = []
    
    if (isLuxury) {
      images = [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop', // Luxury hotel exterior
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop', // Luxury hotel room
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop'  // Luxury hotel lobby
      ]
    } else if (isBeach) {
      images = [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop', // Beach hotel
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop', // Beach hotel room
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop'  // Beach hotel pool
      ]
    } else if (isCity) {
      images = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop', // City hotel exterior
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop', // City hotel room
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'  // City hotel view
      ]
    } else {
      // Standard hotel images
      images = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop'
      ]
    }
    
    return images
  }
} 