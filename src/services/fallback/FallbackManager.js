import { Venue, VenueCategory, DataSource, Coordinates, PriceRange } from '../types/index.js'

/**
 * Hierarchical fallback system for recommendation generation
 */
export class FallbackManager {
  constructor(options = {}) {
    this.options = {
      enableGooglePlaces: options.enableGooglePlaces || true,
      enableCuratedDatabase: options.enableCuratedDatabase || true,
      enableGenericFallbacks: options.enableGenericFallbacks || true,
      maxFallbackVenues: options.maxFallbackVenues || 20,
      ...options
    }

    this.fallbackLevels = [
      { name: 'Curated Database', handler: this.curatedDatabaseFallback.bind(this) },
      { name: 'Google Places Only', handler: this.googlePlacesFallback.bind(this) },
      { name: 'Generic Activities', handler: this.genericActivitiesFallback.bind(this) }
    ]

    this.destinationDatabase = this.initializeDestinationDatabase()
    this.genericActivities = this.initializeGenericActivities()
  }

  /**
   * Execute fallback strategy with hierarchical approach
   */
  async executeFallback(tripData, failedStage = 'unknown') {
    console.log(`🔄 FallbackManager: Executing fallback for failed stage: ${failedStage}`)
    console.log(`🎯 FallbackManager: Target destination: ${tripData.destination}`)

    const results = {
      level: null,
      venues: [],
      source: null,
      metadata: {
        originalFailure: failedStage,
        destination: tripData.destination,
        preferences: tripData.categories || [],
        fallbacksAttempted: []
      }
    }

    // Try each fallback level in order
    for (let i = 0; i < this.fallbackLevels.length; i++) {
      const level = this.fallbackLevels[i]
      
      try {
        console.log(`🔄 FallbackManager: Attempting ${level.name} (Level ${i + 1})`)
        
        const venues = await level.handler(tripData)
        results.metadata.fallbacksAttempted.push({
          level: i + 1,
          name: level.name,
          success: venues.length > 0,
          venueCount: venues.length
        })

        if (venues.length > 0) {
          console.log(`✅ FallbackManager: ${level.name} successful - generated ${venues.length} venues`)
          
          results.level = i + 1
          results.venues = venues
          results.source = level.name
          
          return results
        }

      } catch (error) {
        console.warn(`⚠️ FallbackManager: ${level.name} failed:`, error)
        results.metadata.fallbacksAttempted.push({
          level: i + 1,
          name: level.name,
          success: false,
          error: error.message
        })
      }
    }

    console.error(`❌ FallbackManager: All fallback levels failed`)
    return results
  }

  /**
   * Level 1: Google Places only fallback
   */
  async googlePlacesFallback(tripData) {
    if (!this.options.enableGooglePlaces) {
      throw new Error('Google Places fallback disabled')
    }

    console.log(`🌐 FallbackManager: Searching Google Places for ${tripData.destination}`)
    
    const venues = []
    const categories = tripData.categories || ['culture', 'dining', 'attraction']
    
    // Generate search queries based on destination and preferences
    const searchQueries = this.generateGooglePlacesQueries(tripData.destination, categories)
    
    for (const query of searchQueries) {
      try {
        const placeVenues = await this.searchGooglePlaces(query, tripData.destination)
        venues.push(...placeVenues)
        
        if (venues.length >= this.options.maxFallbackVenues) {
          break
        }
      } catch (error) {
        console.warn(`⚠️ FallbackManager: Google Places query failed for "${query}":`, error)
      }
    }

    return this.deduplicateVenues(venues).slice(0, this.options.maxFallbackVenues)
  }

  /**
   * Level 2: Curated destination database fallback
   */
  async curatedDatabaseFallback(tripData) {
    if (!this.options.enableCuratedDatabase) {
      throw new Error('Curated database fallback disabled')
    }

    console.log(`📚 FallbackManager: Using curated database for ${tripData.destination}`)
    
    const destination = tripData.destination.toLowerCase()
    const preferences = tripData.categories || []
    
    // Try exact match first
    let destinationData = this.destinationDatabase.get(destination)
    
    // Try partial matches
    if (!destinationData) {
      for (const [key, data] of this.destinationDatabase.entries()) {
        if (destination.includes(key) || key.includes(destination)) {
          destinationData = data
          console.log(`📚 FallbackManager: Found partial match: ${key}`)
          break
        }
      }
    }

    if (!destinationData) {
      throw new Error(`No curated data available for ${tripData.destination}`)
    }

    // Filter venues by user preferences
    let venues = [...destinationData.venues]
    
    if (preferences.length > 0) {
      venues = venues.filter(venue => 
        preferences.some(pref => 
          venue.category === pref || 
          venue.tags?.includes(pref)
        )
      )
    }

    // Convert to Venue objects with quality scores
    return venues.map(venueData => {
      const venue = new Venue({
        name: venueData.name,
        category: venueData.category,
        description: venueData.description,
        location: venueData.coordinates ? new Coordinates(venueData.coordinates.lat, venueData.coordinates.lng) : null,
        priceRange: venueData.priceRange ? new PriceRange(venueData.priceRange) : null
      })

      venue.addSource(DataSource.CURATED, venueData)
      venue.qualitySignals.hasRealLocation = !!venueData.coordinates
      venue.qualitySignals.hasValidBusinessInfo = true
      venue.qualitySignals.passesNameValidation = true
      venue.qualitySignals.mentionFrequency = venueData.popularity || 5
      venue.updateConfidenceScore()

      return venue
    }).slice(0, this.options.maxFallbackVenues)
  }

  /**
   * Level 3: Generic activities fallback
   */
  async genericActivitiesFallback(tripData) {
    if (!this.options.enableGenericFallbacks) {
      throw new Error('Generic fallback disabled')
    }

    console.log(`🎭 FallbackManager: Using generic activities for ${tripData.destination}`)
    
    const preferences = tripData.categories || ['culture', 'dining', 'attraction']
    const venues = []

    // Generate generic activities based on preferences
    for (const category of preferences) {
      const categoryActivities = this.genericActivities.get(category) || []
      
      for (const activity of categoryActivities) {
        const venue = new Venue({
          name: activity.name.replace('{destination}', tripData.destination),
          category: category,
          description: activity.description.replace('{destination}', tripData.destination),
          location: this.generateRandomLocation(tripData.destination),
          priceRange: new PriceRange(activity.priceRange)
        })

        venue.addSource(DataSource.FALLBACK, activity)
        venue.qualitySignals.hasValidBusinessInfo = false
        venue.qualitySignals.passesNameValidation = true
        venue.qualitySignals.mentionFrequency = 1
        venue.updateConfidenceScore()

        venues.push(venue)

        if (venues.length >= this.options.maxFallbackVenues) {
          break
        }
      }

      if (venues.length >= this.options.maxFallbackVenues) {
        break
      }
    }

    return venues.slice(0, this.options.maxFallbackVenues)
  }

  /**
   * Generate Google Places search queries
   */
  generateGooglePlacesQueries(destination, categories) {
    const queries = []
    
    // Base queries
    queries.push(`things to do in ${destination}`)
    queries.push(`attractions in ${destination}`)
    queries.push(`restaurants in ${destination}`)

    // Category-specific queries
    categories.forEach(category => {
      switch (category) {
        case 'culture':
          queries.push(`museums in ${destination}`)
          queries.push(`cultural sites in ${destination}`)
          queries.push(`historical places in ${destination}`)
          break
        case 'dining':
          queries.push(`best restaurants in ${destination}`)
          queries.push(`local food in ${destination}`)
          queries.push(`cafes in ${destination}`)
          break
        case 'nature':
          queries.push(`parks in ${destination}`)
          queries.push(`gardens in ${destination}`)
          queries.push(`outdoor activities in ${destination}`)
          break
        case 'shopping':
          queries.push(`shopping in ${destination}`)
          queries.push(`markets in ${destination}`)
          queries.push(`malls in ${destination}`)
          break
        case 'nightlife':
          queries.push(`bars in ${destination}`)
          queries.push(`clubs in ${destination}`)
          queries.push(`nightlife in ${destination}`)
          break
      }
    })

    return queries.slice(0, 5) // Limit to avoid rate limits
  }

  /**
   * Search Google Places (mock implementation)
   */
  async searchGooglePlaces(query, destination) {
    // This would integrate with the actual Google Places API
    // For now, return mock data based on the query
    
    console.log(`🔍 FallbackManager: Searching Google Places for "${query}"`)
    
    // Mock venues based on query type
    const venues = []
    const venueCount = Math.floor(Math.random() * 3) + 2 // 2-4 venues per query

    for (let i = 0; i < venueCount; i++) {
      const mockVenue = this.generateMockGooglePlacesVenue(query, destination, i)
      venues.push(mockVenue)
    }

    return venues
  }

  /**
   * Generate mock Google Places venue
   */
  generateMockGooglePlacesVenue(query, destination, index) {
    const queryLower = query.toLowerCase()
    let category = VenueCategory.ATTRACTION
    let nameOptions = ['Local Landmark', 'Heritage Site', 'Cultural Center']

    if (queryLower.includes('restaurant') || queryLower.includes('food') || queryLower.includes('cafe')) {
      category = VenueCategory.DINING
      nameOptions = ['Spice Garden Restaurant', 'Ocean View Bistro', 'Traditional Kitchen', 'Sunset Terrace', 'Local Flavors Cafe']
    } else if (queryLower.includes('museum') || queryLower.includes('cultural') || queryLower.includes('historical')) {
      category = VenueCategory.CULTURE
      nameOptions = ['Heritage Museum', 'Art Gallery', 'History Center', 'Cultural Museum', 'Archaeological Site']
    } else if (queryLower.includes('park') || queryLower.includes('garden') || queryLower.includes('outdoor')) {
      category = VenueCategory.NATURE
      nameOptions = ['Botanical Gardens', 'National Park', 'Nature Reserve', 'Scenic Viewpoint', 'Wildlife Sanctuary']
    } else if (queryLower.includes('shopping') || queryLower.includes('market') || queryLower.includes('mall')) {
      category = VenueCategory.SHOPPING
      nameOptions = ['Central Market', 'Local Bazaar', 'Artisan Quarter', 'Shopping District', 'Night Market']
    } else if (queryLower.includes('bar') || queryLower.includes('club') || queryLower.includes('nightlife')) {
      category = VenueCategory.NIGHTLIFE
      nameOptions = ['Rooftop Lounge', 'Beach Bar', 'Jazz Club', 'Night Market Bar', 'Cocktail Lounge']
    }

    // Select a name based on index to ensure variety
    const selectedName = nameOptions[index % nameOptions.length]

    const venue = new Venue({
      name: selectedName,
      category: category,
      description: `A popular ${category} destination in ${destination}, highly rated by visitors.`,
      location: this.generateRandomLocation(destination),
      priceRange: new PriceRange({
        min: 15,
        max: 45,
        currency: 'USD',
        level: Math.floor(Math.random() * 3) + 1
      })
    })

    venue.addSource(DataSource.GOOGLE_PLACES, {
      query: query,
      mockGenerated: true,
      rating: 4.0 + Math.random(),
      reviews: Math.floor(Math.random() * 500) + 50
    })

    venue.qualitySignals.hasRealLocation = true
    venue.qualitySignals.hasValidBusinessInfo = true
    venue.qualitySignals.passesNameValidation = true
    venue.qualitySignals.mentionFrequency = Math.floor(Math.random() * 5) + 3
    venue.updateConfidenceScore()

    return venue
  }

  /**
   * Generate random location near destination
   */
  generateRandomLocation(destination) {
    const baseCoords = this.getDestinationCoordinates(destination)
    
    return new Coordinates(
      baseCoords.lat + (Math.random() - 0.5) * 0.02,
      baseCoords.lng + (Math.random() - 0.5) * 0.02
    )
  }

  /**
   * Get base coordinates for destination
   */
  getDestinationCoordinates(destination) {
    const coords = {
      'paris': { lat: 48.8566, lng: 2.3522 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'bali': { lat: -8.3405, lng: 115.0920 },
      'bangkok': { lat: 13.7563, lng: 100.5018 },
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 }
    }

    const destLower = destination.toLowerCase()
    
    // Try exact match
    if (coords[destLower]) {
      return coords[destLower]
    }

    // Try partial match
    for (const [key, coord] of Object.entries(coords)) {
      if (destLower.includes(key) || key.includes(destLower)) {
        return coord
      }
    }

    // Default to center of world
    return { lat: 0, lng: 0 }
  }

  /**
   * Remove duplicate venues
   */
  deduplicateVenues(venues) {
    const seen = new Set()
    const unique = []

    venues.forEach(venue => {
      const key = venue.name.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(venue)
      }
    })

    return unique
  }

  /**
   * Initialize curated destination database
   */
  initializeDestinationDatabase() {
    const database = new Map()

    // Paris
    database.set('paris', {
      venues: [
        {
          name: 'Louvre Museum',
          category: VenueCategory.CULTURE,
          description: 'World-famous art museum housing the Mona Lisa and thousands of other masterpieces',
          coordinates: { lat: 48.8606, lng: 2.3376 },
          priceRange: { min: 15, max: 17, currency: 'EUR' },
          popularity: 10,
          tags: ['culture', 'art', 'history']
        },
        {
          name: 'Eiffel Tower',
          category: VenueCategory.ATTRACTION,
          description: 'Iconic iron lattice tower and symbol of Paris',
          coordinates: { lat: 48.8584, lng: 2.2945 },
          priceRange: { min: 25, max: 29, currency: 'EUR' },
          popularity: 10,
          tags: ['culture', 'landmark', 'views']
        },
        {
          name: 'Le Comptoir du Relais',
          category: VenueCategory.DINING,
          description: 'Traditional French bistro with authentic Parisian atmosphere',
          coordinates: { lat: 48.8511, lng: 2.3398 },
          priceRange: { min: 35, max: 55, currency: 'EUR' },
          popularity: 8,
          tags: ['dining', 'french', 'bistro']
        }
      ]
    })

    // Barcelona
    database.set('barcelona', {
      venues: [
        {
          name: 'Sagrada Familia',
          category: VenueCategory.CULTURE,
          description: 'Gaudí\'s masterpiece basilica, a UNESCO World Heritage Site',
          coordinates: { lat: 41.4036, lng: 2.1744 },
          priceRange: { min: 20, max: 33, currency: 'EUR' },
          popularity: 10,
          tags: ['culture', 'architecture', 'gaudi']
        },
        {
          name: 'Park Güell',
          category: VenueCategory.NATURE,
          description: 'Colorful park designed by Antoni Gaudí with stunning city views',
          coordinates: { lat: 41.4145, lng: 2.1527 },
          priceRange: { min: 7, max: 10, currency: 'EUR' },
          popularity: 9,
          tags: ['nature', 'architecture', 'gaudi', 'views']
        },
        {
          name: 'Cal Pep',
          category: VenueCategory.DINING,
          description: 'Famous tapas bar serving fresh seafood and traditional Catalan dishes',
          coordinates: { lat: 41.3833, lng: 2.1834 },
          priceRange: { min: 25, max: 45, currency: 'EUR' },
          popularity: 8,
          tags: ['dining', 'tapas', 'seafood']
        }
      ]
    })

    // Bali
    database.set('bali', {
      venues: [
        {
          name: 'Tanah Lot Temple',
          category: VenueCategory.CULTURE,
          description: 'Ancient Hindu temple perched on a rock formation, one of Bali\'s most iconic landmarks',
          coordinates: { lat: -8.6211, lng: 115.0868 },
          priceRange: { min: 5, max: 8, currency: 'USD' },
          popularity: 10,
          tags: ['culture', 'temple', 'history', 'landmark']
        },
        {
          name: 'Uluwatu Temple',
          category: VenueCategory.CULTURE,
          description: 'Clifftop temple with stunning ocean views and traditional Kecak fire dance performances',
          coordinates: { lat: -8.8290, lng: 115.0850 },
          priceRange: { min: 3, max: 5, currency: 'USD' },
          popularity: 9,
          tags: ['culture', 'temple', 'history', 'sunset', 'dance']
        },
        {
          name: 'Besakih Temple',
          category: VenueCategory.CULTURE,
          description: 'Mother Temple of Bali, the largest and holiest temple complex on the island',
          coordinates: { lat: -8.3742, lng: 115.4508 },
          priceRange: { min: 10, max: 15, currency: 'USD' },
          popularity: 8,
          tags: ['culture', 'temple', 'history', 'sacred']
        },
        {
          name: 'Tegallalang Rice Terraces',
          category: VenueCategory.NATURE,
          description: 'UNESCO World Heritage rice terraces showcasing traditional Balinese agriculture',
          coordinates: { lat: -8.4346, lng: 115.2784 },
          priceRange: { min: 2, max: 5, currency: 'USD' },
          popularity: 9,
          tags: ['nature', 'agriculture', 'unesco', 'photography']
        },
        {
          name: 'Sacred Monkey Forest Sanctuary',
          category: VenueCategory.NATURE,
          description: 'Ancient temple complex in Ubud surrounded by lush forest and home to hundreds of monkeys',
          coordinates: { lat: -8.5191, lng: 115.2619 },
          priceRange: { min: 3, max: 5, currency: 'USD' },
          popularity: 8,
          tags: ['nature', 'wildlife', 'temple', 'forest']
        },
        {
          name: 'Warung Babi Guling Ibu Oka',
          category: VenueCategory.DINING,
          description: 'Famous traditional Balinese restaurant serving the best babi guling (roast pork) in Ubud',
          coordinates: { lat: -8.5069, lng: 115.2624 },
          priceRange: { min: 5, max: 12, currency: 'USD' },
          popularity: 9,
          tags: ['dining', 'traditional', 'local', 'pork']
        },
        {
          name: 'Locavore Restaurant',
          category: VenueCategory.DINING,
          description: 'Award-winning fine dining restaurant featuring modern Indonesian cuisine with local ingredients',
          coordinates: { lat: -8.5081, lng: 115.2625 },
          priceRange: { min: 80, max: 150, currency: 'USD' },
          popularity: 8,
          tags: ['dining', 'fine-dining', 'modern', 'indonesian']
        },
        {
          name: 'Naughty Nuri\'s',
          category: VenueCategory.DINING,
          description: 'Legendary warung famous for its BBQ ribs and strong martinis, a Ubud institution',
          coordinates: { lat: -8.5087, lng: 115.2634 },
          priceRange: { min: 15, max: 30, currency: 'USD' },
          popularity: 8,
          tags: ['dining', 'bbq', 'ribs', 'casual']
        }
      ]
    })

    // Tokyo
    database.set('tokyo', {
      venues: [
        {
          name: 'Tokyo National Museum',
          category: VenueCategory.CULTURE,
          description: 'Japan\'s oldest and largest museum, housing the world\'s largest collection of Japanese cultural artifacts',
          coordinates: { lat: 35.7188, lng: 139.7766 },
          priceRange: { min: 8, max: 12, currency: 'USD' },
          popularity: 10,
          tags: ['culture', 'museum', 'history', 'art']
        },
        {
          name: 'Senso-ji Temple',
          category: VenueCategory.CULTURE,
          description: 'Tokyo\'s oldest Buddhist temple, founded in 628 AD, located in historic Asakusa district',
          coordinates: { lat: 35.7148, lng: 139.7967 },
          priceRange: { min: 0, max: 5, currency: 'USD' },
          popularity: 10,
          tags: ['culture', 'temple', 'history', 'buddhist']
        },
        {
          name: 'Tokyo Metropolitan Museum of Art',
          category: VenueCategory.CULTURE,
          description: 'Premier art museum featuring Japanese and international contemporary and traditional art',
          coordinates: { lat: 35.7165, lng: 139.7725 },
          priceRange: { min: 6, max: 10, currency: 'USD' },
          popularity: 9,
          tags: ['culture', 'art', 'museum', 'contemporary']
        },
        {
          name: 'Nezu Shrine',
          category: VenueCategory.CULTURE,
          description: 'Historic Shinto shrine famous for its azalea garden and traditional architecture',
          coordinates: { lat: 35.7281, lng: 139.7617 },
          priceRange: { min: 0, max: 3, currency: 'USD' },
          popularity: 8,
          tags: ['culture', 'shrine', 'history', 'garden']
        },
        {
          name: 'Tokyo Station Gallery',
          category: VenueCategory.CULTURE,
          description: 'Art gallery housed in the historic Tokyo Station building, showcasing modern Japanese art',
          coordinates: { lat: 35.6812, lng: 139.7671 },
          priceRange: { min: 5, max: 8, currency: 'USD' },
          popularity: 7,
          tags: ['culture', 'art', 'gallery', 'modern']
        },
        {
          name: 'Sushi Dai',
          category: VenueCategory.DINING,
          description: 'World-famous sushi restaurant in Tsukiji, known for the freshest tuna and traditional preparation',
          coordinates: { lat: 35.6654, lng: 139.7707 },
          priceRange: { min: 25, max: 40, currency: 'USD' },
          popularity: 10,
          tags: ['dining', 'sushi', 'traditional', 'tsukiji']
        },
        {
          name: 'Kozasa',
          category: VenueCategory.DINING,
          description: 'Traditional tempura restaurant serving exquisite seasonal vegetables and seafood',
          coordinates: { lat: 35.6762, lng: 139.7653 },
          priceRange: { min: 40, max: 80, currency: 'USD' },
          popularity: 9,
          tags: ['dining', 'tempura', 'traditional', 'seasonal']
        },
        {
          name: 'Kanda Matsuya',
          category: VenueCategory.DINING,
          description: 'Historic soba noodle shop established in 1884, serving traditional buckwheat noodles',
          coordinates: { lat: 35.6938, lng: 139.7707 },
          priceRange: { min: 12, max: 25, currency: 'USD' },
          popularity: 8,
          tags: ['dining', 'soba', 'traditional', 'historic']
        }
      ]
    })

    // New York
    database.set('new york', {
      venues: [
        {
          name: 'Metropolitan Museum of Art',
          category: VenueCategory.CULTURE,
          description: 'One of the world\'s largest and most prestigious art museums, housing over 2 million works',
          coordinates: { lat: 40.7794, lng: -73.9632 },
          priceRange: { min: 25, max: 30, currency: 'USD' },
          popularity: 10,
          tags: ['culture', 'art', 'museum', 'history']
        },
        {
          name: 'Museum of Modern Art (MoMA)',
          category: VenueCategory.CULTURE,
          description: 'World-renowned modern and contemporary art museum featuring works by Picasso, Van Gogh, and Warhol',
          coordinates: { lat: 40.7614, lng: -73.9776 },
          priceRange: { min: 25, max: 30, currency: 'USD' },
          popularity: 10,
          tags: ['culture', 'art', 'museum', 'modern']
        },
        {
          name: 'Guggenheim Museum',
          category: VenueCategory.CULTURE,
          description: 'Iconic spiral-designed museum by Frank Lloyd Wright, showcasing modern and contemporary art',
          coordinates: { lat: 40.7829, lng: -73.9589 },
          priceRange: { min: 25, max: 30, currency: 'USD' },
          popularity: 9,
          tags: ['culture', 'art', 'museum', 'architecture']
        },
        {
          name: 'Brooklyn Museum',
          category: VenueCategory.CULTURE,
          description: 'Second-largest art museum in NYC, known for its Egyptian collection and contemporary art',
          coordinates: { lat: 40.6712, lng: -73.9636 },
          priceRange: { min: 16, max: 20, currency: 'USD' },
          popularity: 8,
          tags: ['culture', 'art', 'museum', 'egyptian']
        },
        {
          name: 'New York Historical Society',
          category: VenueCategory.CULTURE,
          description: 'Oldest museum in New York City, dedicated to the history of New York and the nation',
          coordinates: { lat: 40.7791, lng: -73.9739 },
          priceRange: { min: 20, max: 25, currency: 'USD' },
          popularity: 7,
          tags: ['culture', 'history', 'museum', 'american']
        },
        {
          name: 'Tenement Museum',
          category: VenueCategory.CULTURE,
          description: 'Preserved tenement building telling the stories of immigrant families in Lower East Side',
          coordinates: { lat: 40.7188, lng: -73.9900 },
          priceRange: { min: 25, max: 35, currency: 'USD' },
          popularity: 8,
          tags: ['culture', 'history', 'museum', 'immigration']
        },
        {
          name: 'Peter Luger Steakhouse',
          category: VenueCategory.DINING,
          description: 'Legendary Brooklyn steakhouse serving dry-aged porterhouse steaks since 1887',
          coordinates: { lat: 40.7081, lng: -73.9571 },
          priceRange: { min: 60, max: 120, currency: 'USD' },
          popularity: 10,
          tags: ['dining', 'steakhouse', 'legendary', 'brooklyn']
        },
        {
          name: 'Katz\'s Delicatessen',
          category: VenueCategory.DINING,
          description: 'Iconic Jewish deli famous for its pastrami sandwiches and "When Harry Met Sally" scene',
          coordinates: { lat: 40.7223, lng: -73.9873 },
          priceRange: { min: 15, max: 30, currency: 'USD' },
          popularity: 9,
          tags: ['dining', 'deli', 'pastrami', 'iconic']
        },
        {
          name: 'Joe\'s Pizza',
          category: VenueCategory.DINING,
          description: 'Classic New York pizza joint serving authentic NY-style thin crust pizza since 1975',
          coordinates: { lat: 40.7505, lng: -73.9934 },
          priceRange: { min: 3, max: 8, currency: 'USD' },
          popularity: 8,
          tags: ['dining', 'pizza', 'classic', 'casual']
        }
      ]
    })

    // Add more destinations as needed...

    return database
  }

  /**
   * Initialize generic activities
   */
  initializeGenericActivities() {
    const activities = new Map()

    activities.set(VenueCategory.CULTURE, [
      {
        name: 'Local History Museum',
        description: 'Explore the rich history and cultural heritage of {destination}',
        priceRange: { min: 10, max: 20, currency: 'USD', level: 2 }
      },
      {
        name: 'Cultural District Walking Tour',
        description: 'Self-guided tour through the historic and cultural heart of {destination}',
        priceRange: { min: 0, max: 15, currency: 'USD', level: 1 }
      },
      {
        name: 'Traditional Art Gallery',
        description: 'Discover local artists and traditional art forms in {destination}',
        priceRange: { min: 5, max: 15, currency: 'USD', level: 1 }
      }
    ])

    activities.set(VenueCategory.DINING, [
      {
        name: 'Local Cuisine Restaurant',
        description: 'Authentic local dishes and traditional flavors of {destination}',
        priceRange: { min: 20, max: 50, currency: 'USD', level: 3 }
      },
      {
        name: 'Traditional Market Food Tour',
        description: 'Sample local street food and market specialties in {destination}',
        priceRange: { min: 15, max: 30, currency: 'USD', level: 2 }
      },
      {
        name: 'Neighborhood Café',
        description: 'Cozy local café perfect for experiencing daily life in {destination}',
        priceRange: { min: 5, max: 15, currency: 'USD', level: 1 }
      }
    ])

    activities.set(VenueCategory.NATURE, [
      {
        name: 'City Central Park',
        description: 'Green oasis in the heart of {destination} perfect for relaxation',
        priceRange: { min: 0, max: 5, currency: 'USD', level: 1 }
      },
      {
        name: 'Scenic Viewpoint',
        description: 'Panoramic views of {destination} and surrounding landscape',
        priceRange: { min: 0, max: 10, currency: 'USD', level: 1 }
      },
      {
        name: 'Botanical Garden',
        description: 'Beautiful gardens showcasing native plants and peaceful walking paths',
        priceRange: { min: 5, max: 15, currency: 'USD', level: 2 }
      }
    ])

    activities.set(VenueCategory.SHOPPING, [
      {
        name: 'Traditional Market',
        description: 'Local market with handcrafted goods and regional specialties',
        priceRange: { min: 10, max: 100, currency: 'USD', level: 2 }
      },
      {
        name: 'Artisan Quarter',
        description: 'Browse unique handmade items from local craftspeople in {destination}',
        priceRange: { min: 15, max: 75, currency: 'USD', level: 2 }
      }
    ])

    activities.set(VenueCategory.NIGHTLIFE, [
      {
        name: 'Local Wine Bar',
        description: 'Intimate setting to enjoy regional wines and meet locals',
        priceRange: { min: 8, max: 20, currency: 'USD', level: 2 }
      },
      {
        name: 'Traditional Music Venue',
        description: 'Experience local music and cultural performances in {destination}',
        priceRange: { min: 15, max: 35, currency: 'USD', level: 3 }
      }
    ])

    return activities
  }
}

export default FallbackManager 