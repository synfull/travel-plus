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
      maxResults: 20,
      radius: 5000, // 5km radius
      enableCaching: true,
      cacheTimeout: 3600000, // 1 hour
      ...options
    }

    this.cache = new Map()
    this.requestCount = 0
    this.rateLimitDelayMs = 100 // ms between requests
    
    console.log('🌐 GooglePlacesService: Real API integration initialized')
    console.log(`🔑 GooglePlacesService: API Key configured: ${this.options.apiKey ? 'YES' : 'NO'}`)
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
      const url = `${this.options.baseUrl}/details/json`
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,opening_hours,photos,reviews,website,formatted_phone_number,types',
        key: this.options.apiKey
      })

      await this.rateLimitDelay()
      const response = await fetch(`${url}?${params}`)
      const data = await response.json()

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
      const url = 'https://maps.googleapis.com/maps/api/geocode/json'
      const params = new URLSearchParams({
        address: destination,
        key: this.options.apiKey
      })

      await this.rateLimitDelay()
      const response = await fetch(`${url}?${params}`)
      const data = await response.json()

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
      const url = `${this.options.baseUrl}/nearbysearch/json`
      const params = new URLSearchParams({
        location: `${coordinates.lat},${coordinates.lng}`,
        radius: this.options.radius,
        keyword: queryObj.query,
        key: this.options.apiKey
      })

      this.requestCount++
      const response = await fetch(`${url}?${params}`)
      const data = await response.json()

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
} 