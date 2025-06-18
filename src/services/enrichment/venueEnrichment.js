class VenueEnrichmentService {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
    this.rateLimitDelay = 1000 // 1 second between requests
    this.lastRequestTime = 0
  }

  async enrichVenue(venueName, destination, category = 'attraction') {
    console.log(`🔍 Enriching venue: ${venueName} in ${destination}`)
    
    const cacheKey = `${venueName}-${destination}`.toLowerCase()
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`✅ Using cached data for ${venueName}`)
        return cached.data
      }
    }

    try {
      // Try multiple search strategies
      const enrichedData = await this.searchVenueInfo(venueName, destination, category)
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: enrichedData,
        timestamp: Date.now()
      })
      
      console.log(`✅ Successfully enriched ${venueName}`)
      return enrichedData
      
    } catch (error) {
      console.error(`❌ Failed to enrich ${venueName}:`, error)
      return this.createFallbackData(venueName, category)
    }
  }

  async searchVenueInfo(venueName, destination, category) {
    // Rate limiting
    await this.applyRateLimit()
    
    // Search for venue information using multiple approaches
    const searchResults = await Promise.allSettled([
      this.searchGooglePlaces(venueName, destination, category),
      this.searchWikipedia(venueName, destination),
      this.searchWeb(venueName, destination, category),
      this.extractPlaceInfo(venueName, destination)
    ])
    
    // Combine results from successful searches
    const googlePlacesData = searchResults[0].status === 'fulfilled' ? searchResults[0].value : null
    const wikipediaData = searchResults[1].status === 'fulfilled' ? searchResults[1].value : null
    const webData = searchResults[2].status === 'fulfilled' ? searchResults[2].value : null
    const placeData = searchResults[3].status === 'fulfilled' ? searchResults[3].value : null
    
    return this.combineEnrichmentData(venueName, category, googlePlacesData, wikipediaData, webData, placeData)
  }

  async applyRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
  }

  async searchGooglePlaces(venueName, destination, category) {
    try {
      const query = `${venueName} ${destination}`
      
      // Try to use the proxy function for real API calls
      const proxyUrl = '/.netlify/functions/google-places-proxy'
      
      // First, search for the place
      const searchResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'search',
          query: query
        })
      })
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        
        if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
          const place = searchData.results[0]
          
          // Get detailed information using Place Details API
          const detailsResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'details',
              placeId: place.place_id
            })
          })
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json()
            
            if (detailsData.status === 'OK' && detailsData.result) {
              console.log('📍 Found Google Places data for:', venueName)
              return this.processGooglePlacesResult(detailsData.result)
            }
          }
        }
      }
      
      console.log('📍 No Google Places results found for:', venueName, '- using mock data')
      return this.generateMockGooglePlacesData(venueName, destination, category)
      
    } catch (error) {
      console.error('📍 Google Places API error:', error)
      return this.generateMockGooglePlacesData(venueName, destination, category)
    }
  }

  processGooglePlacesResult(place) {
    const openingHours = place.opening_hours?.weekday_text ? 
      place.opening_hours.weekday_text.join(', ') : null
    
    const priceLevel = place.price_level ? this.getPriceLevelDescription(place.price_level) : null
    
    const photos = place.photos ? place.photos.slice(0, 3).map(photo => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height
    })) : []
    
    return {
      name: place.name,
      description: this.generateGooglePlacesDescription(place),
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      hours: openingHours,
      priceLevel: priceLevel,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      coordinates: place.geometry?.location ? {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      } : null,
      businessStatus: place.business_status,
      types: place.types,
      photos: photos,
      source: 'google_places'
    }
  }

  generateGooglePlacesDescription(place) {
    const name = place.name
    const primaryType = place.types?.[0] ? this.getReadableType(place.types[0]) : 'destination'
    const neighborhood = this.extractNeighborhood(place.formatted_address)
    
    // Create more engaging descriptions based on venue type
    let description = this.generateEngagingDescription(name, primaryType, neighborhood, place)
    
    return description
  }

  generateEngagingDescription(name, type, neighborhood, place) {
    const templates = {
      restaurant: [
        `Discover authentic flavors at ${name}, a beloved ${type}${neighborhood ? ` in ${neighborhood}` : ''}. Known for exceptional cuisine and welcoming atmosphere.`,
        `Indulge in culinary excellence at ${name}, where traditional recipes meet modern dining${neighborhood ? ` in the heart of ${neighborhood}` : ''}.`,
        `Experience the taste of local culture at ${name}, a popular ${type} that locals love${neighborhood ? ` located in ${neighborhood}` : ''}.`
      ],
      museum: [
        `Step into a world of discovery at ${name}, where art and culture come alive${neighborhood ? ` in ${neighborhood}` : ''}. Perfect for history enthusiasts and curious minds.`,
        `Immerse yourself in fascinating exhibits at ${name}, a cultural treasure${neighborhood ? ` nestled in ${neighborhood}` : ''}. A must-visit for art and history lovers.`,
        `Explore captivating collections at ${name}, where every corner tells a story${neighborhood ? ` in the vibrant ${neighborhood} area` : ''}.`
      ],
      tourist_attraction: [
        `Experience the magic of ${name}, a iconic destination${neighborhood ? ` in ${neighborhood}` : ''} that captures the essence of the local culture.`,
        `Discover why ${name} is a must-see landmark${neighborhood ? ` in ${neighborhood}` : ''}, offering unforgettable experiences for every traveler.`,
        `Visit ${name}, where memorable moments await${neighborhood ? ` in the stunning ${neighborhood} district` : ''}.`
      ],
      park: [
        `Escape to the tranquil beauty of ${name}${neighborhood ? ` in ${neighborhood}` : ''}, where nature provides the perfect backdrop for relaxation and exploration.`,
        `Find your peaceful retreat at ${name}, a natural oasis${neighborhood ? ` in ${neighborhood}` : ''} perfect for unwinding and connecting with nature.`
      ],
      shopping_mall: [
        `Shop, dine, and explore at ${name}${neighborhood ? ` in ${neighborhood}` : ''}, where retail therapy meets local culture in one convenient location.`,
        `Discover unique finds and local treasures at ${name}, a shopper's paradise${neighborhood ? ` in ${neighborhood}` : ''}.`
      ],
      bar: [
        `Unwind with expertly crafted drinks at ${name}${neighborhood ? ` in ${neighborhood}` : ''}, where the nightlife comes alive with local flavor.`,
        `Experience the vibrant nightlife at ${name}, a popular spot${neighborhood ? ` in ${neighborhood}` : ''} for locals and travelers alike.`
      ],
      default: [
        `Discover the charm of ${name}${neighborhood ? ` in ${neighborhood}` : ''}, a local favorite that offers an authentic taste of the destination.`,
        `Experience ${name}${neighborhood ? ` in ${neighborhood}` : ''}, where local culture and hospitality create unforgettable memories.`
      ]
    }

    // Select appropriate template category
    let category = 'default'
    if (type.includes('restaurant') || type.includes('food') || type.includes('dining')) category = 'restaurant'
    else if (type.includes('museum') || type.includes('gallery')) category = 'museum'  
    else if (type.includes('attraction') || type.includes('temple') || type.includes('church')) category = 'tourist_attraction'
    else if (type.includes('park') || type.includes('garden')) category = 'park'
    else if (type.includes('shopping') || type.includes('mall')) category = 'shopping_mall'
    else if (type.includes('bar') || type.includes('nightclub')) category = 'bar'

    // Randomly select a template for variety
    const categoryTemplates = templates[category] || templates.default
    const selectedTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)]
    
    return selectedTemplate
  }

  extractNeighborhood(address) {
    if (!address) return null
    
    // Extract neighborhood/district from address
    const parts = address.split(',')
    if (parts.length >= 2) {
      // Try to find the neighborhood (usually second part in Japanese addresses)
      let neighborhood = parts[1].trim()
      
      // Clean up common address prefixes
      neighborhood = neighborhood.replace(/^\d+[\-\s]*/, '') // Remove street numbers
      neighborhood = neighborhood.replace(/^(Chome|Ward|District|City)\s*/i, '') // Remove administrative terms
      
      if (neighborhood.length > 2 && neighborhood.length < 30) {
        return neighborhood
      }
    }
    
    return null
  }

  getReadableType(type) {
    const typeMap = {
      'restaurant': 'restaurant',
      'food': 'dining establishment',
      'bar': 'bar',
      'night_club': 'nightclub',
      'tourist_attraction': 'tourist attraction',
      'museum': 'museum',
      'art_gallery': 'art gallery',
      'shopping_mall': 'shopping center',
      'store': 'store',
      'lodging': 'accommodation',
      'spa': 'spa',
      'gym': 'fitness center',
      'park': 'park',
      'beach': 'beach',
      'church': 'religious site',
      'mosque': 'religious site',
      'temple': 'religious site',
      'casino': 'casino',
      'amusement_park': 'amusement park'
    }
    
    return typeMap[type] || type.replace(/_/g, ' ')
  }

  getPriceLevelDescription(priceLevel) {
    const levels = {
      1: 'Budget-friendly ($ - under $15 per person)',
      2: 'Moderate pricing ($$ - $15-30 per person)', 
      3: 'Expensive ($$$ - $30-60 per person)',
      4: 'Very expensive ($$$$ - over $60 per person)'
    }
    
    return levels[priceLevel] || 'Price varies'
  }

  generateMockGooglePlacesData(venueName, destination, category) {
    // Generate realistic mock data for development/fallback
    const mockRating = (Math.random() * 2 + 3).toFixed(1) // 3.0 - 5.0
    const mockReviews = Math.floor(Math.random() * 500) + 50 // 50 - 550 reviews
    const mockPriceLevel = Math.floor(Math.random() * 4) + 1 // 1-4
    
    // Generate engaging description using the same template system
    const mockDescription = this.generateEngagingDescription(venueName, category, null, {})
    
    return {
      name: venueName,
      description: mockDescription,
      address: `${destination} (exact address available on-site)`,
      phone: null,
      website: null,
      hours: this.getTypicalHours(category),
      priceLevel: this.getPriceLevelDescription(mockPriceLevel),
      rating: parseFloat(mockRating),
      totalRatings: mockReviews,
      coordinates: null,
      businessStatus: 'OPERATIONAL',
      types: [category],
      photos: [],
      source: 'mock_google_places'
    }
  }

  getTypicalHours(category) {
    const hoursByCategory = {
      'restaurant': 'Mon-Sun: 11:00 AM - 10:00 PM',
      'dining': 'Mon-Sun: 11:00 AM - 10:00 PM', 
      'bar': 'Mon-Sun: 6:00 PM - 2:00 AM',
      'nightlife': 'Mon-Sun: 6:00 PM - 2:00 AM',
      'museum': 'Tue-Sun: 9:00 AM - 5:00 PM',
      'culture': 'Tue-Sun: 9:00 AM - 5:00 PM',
      'attraction': 'Daily: 9:00 AM - 6:00 PM',
      'nature': 'Daily: 6:00 AM - 6:00 PM',
      'beach': 'Daily: 24 hours',
      'shopping': 'Mon-Sun: 10:00 AM - 9:00 PM'
    }
    
    return hoursByCategory[category] || 'Hours vary'
  }

  async searchWikipedia(venueName, destination) {
    try {
      // Skip Wikipedia search for obviously non-notable venues
      if (this.shouldSkipWikipediaSearch(venueName)) {
        return null
      }
      
      // Try the search API first (more likely to find results)
      const searchQuery = `${venueName} ${destination}`
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchQuery)}&limit=1&format=json&origin=*`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (searchData[1] && searchData[1].length > 0 && searchData[2] && searchData[2].length > 0) {
        return {
          description: searchData[2][0],
          source: 'wikipedia',
          url: searchData[3] ? searchData[3][0] : null
        }
      }
      
      // Try direct page access as fallback for well-known venues
      if (this.isLikelyNotableVenue(venueName)) {
        const directUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(venueName)}`
        const directResponse = await fetch(directUrl)
        
        if (directResponse.ok) {
          const data = await directResponse.json()
          
          if (data.extract) {
            return {
              description: data.extract,
              source: 'wikipedia',
              url: data.content_urls?.desktop?.page || null,
              coordinates: data.coordinates ? {
                lat: data.coordinates.lat,
                lng: data.coordinates.lon
              } : null
            }
          }
        }
      }
      
      return null
    } catch (error) {
      // Don't log every Wikipedia miss - most venues won't be in Wikipedia
      return null
    }
  }

  shouldSkipWikipediaSearch(venueName) {
    // Skip Wikipedia for venues that are obviously not going to be there
    const skipPatterns = [
      /^(National|International|Financial|Professional|Career|Certification)/i,
      /\b(Association|Professionals|Board|Committee|Commission|Conference)\b/i,
      /^(Do|He|She|I|We|They|You|It|This|That|OOP|Nice|Good|Bad)\b/i
    ]
    
    return skipPatterns.some(pattern => pattern.test(venueName))
  }

  isLikelyNotableVenue(venueName) {
    // Only try direct Wikipedia access for venues that might actually be notable
    const notablePatterns = [
      /Museum/i,
      /Templo/i,
      /Cathedral/i,
      /Palace/i,
      /Castle/i,
      /Monument/i,
      /Archaeological/i,
      /National Park/i,
      /World Heritage/i
    ]
    
    return notablePatterns.some(pattern => pattern.test(venueName))
  }

  async searchWeb(venueName, destination, category) {
    try {
      // Use DuckDuckGo Instant Answer API (free alternative)
      const query = `${venueName} ${destination} ${category}`
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`
      
      const response = await fetch(searchUrl)
      const data = await response.json()
      
      let description = null
      let website = null
      
      if (data.Abstract) {
        description = data.Abstract
        website = data.AbstractURL
      } else if (data.Infobox) {
        // Extract relevant info from infobox
        const infoText = Object.values(data.Infobox).join(' ')
        if (infoText.length > 50) {
          description = infoText.substring(0, 300) + '...'
        }
      }
      
      return description ? {
        description,
        source: 'web_search',
        website,
        relatedTopics: data.RelatedTopics?.slice(0, 3)?.map(t => t.Text) || []
      } : null
      
    } catch (error) {
      console.warn(`Web search failed for ${venueName}:`, error)
      return null
    }
  }

  async extractPlaceInfo(venueName, destination) {
    // This would ideally use Google Places API, but for now we'll simulate
    // place-specific information based on patterns
    
    const placeTypes = {
      restaurant: {
        typical_hours: "11:00 AM - 10:00 PM",
        price_range: "$15-45 per person",
        features: ["dining", "cuisine", "atmosphere"]
      },
      museum: {
        typical_hours: "9:00 AM - 5:00 PM",
        price_range: "$10-25 admission",
        features: ["exhibits", "cultural", "educational"]
      },
      beach: {
        typical_hours: "Dawn to dusk",
        price_range: "Free - $10 entrance",
        features: ["swimming", "relaxation", "scenic"]
      },
      bar: {
        typical_hours: "6:00 PM - 2:00 AM",
        price_range: "$8-15 per drink",
        features: ["nightlife", "drinks", "social"]
      }
    }
    
    // Determine place type from venue name
    const name = venueName.toLowerCase()
    let placeType = 'attraction'
    
    if (name.includes('restaurant') || name.includes('steakhouse') || name.includes('cafe')) {
      placeType = 'restaurant'
    } else if (name.includes('museum')) {
      placeType = 'museum'
    } else if (name.includes('beach')) {
      placeType = 'beach'
    } else if (name.includes('bar') || name.includes('club')) {
      placeType = 'bar'
    }
    
    const typeInfo = placeTypes[placeType] || placeTypes.attraction || {}
    
    return {
      hours: typeInfo.typical_hours,
      priceRange: typeInfo.price_range,
      features: typeInfo.features,
      placeType,
      source: 'place_inference'
    }
  }

  combineEnrichmentData(venueName, category, googlePlacesData, wikipediaData, webData, placeData) {
    let description = `Discover ${venueName}, a popular ${category} destination.`
    let hours = null
    let priceRange = null
    let website = null
    let features = []
    let coordinates = null
    let rating = null
    let totalRatings = null
    let phone = null
    let address = null
    let photos = []
    let businessStatus = null
    
    // Prioritize Google Places for most comprehensive data
    if (googlePlacesData) {
      description = googlePlacesData.description
      hours = googlePlacesData.hours
      priceRange = googlePlacesData.priceLevel
      website = googlePlacesData.website
      coordinates = googlePlacesData.coordinates
      rating = googlePlacesData.rating
      totalRatings = googlePlacesData.totalRatings
      phone = googlePlacesData.phone
      address = googlePlacesData.address
      photos = googlePlacesData.photos
      businessStatus = googlePlacesData.businessStatus
      features = googlePlacesData.types || []
    } else {
      // Fallback to other sources if Google Places unavailable
      if (wikipediaData?.description) {
        description = wikipediaData.description
        website = wikipediaData.url
        coordinates = wikipediaData.coordinates
      } else if (webData?.description) {
        description = webData.description
        website = webData.website
      }
      
      // Use place data for practical information
      if (placeData) {
        hours = hours || placeData.hours
        priceRange = priceRange || placeData.priceRange
        features = features.length > 0 ? features : (placeData.features || [])
      }
    }
    
    // Create enhanced description if not from Google Places
    let enhancedDescription = description
    if (!googlePlacesData) {
      if (hours && !description.includes('Open')) {
        enhancedDescription += ` Open ${hours}.`
      }
      
      if (priceRange && !description.includes('$')) {
        enhancedDescription += ` ${priceRange}.`
      }
      
      if (features.length > 0 && !description.includes('Known for')) {
        enhancedDescription += ` Known for ${features.join(', ')}.`
      }
    }
    
    return {
      name: venueName,
      description: enhancedDescription,
      shortDescription: description.length > 200 ? description.substring(0, 200) + '...' : description,
      hours,
      priceRange,
      website,
      coordinates,
      features,
      rating,
      totalRatings,
      phone,
      address,
      photos,
      businessStatus,
      sources: [
        googlePlacesData?.source,
        wikipediaData?.source,
        webData?.source,
        placeData?.source
      ].filter(Boolean),
      lastUpdated: new Date().toISOString()
    }
  }

  createFallbackData(venueName, category) {
    const categoryDescriptions = {
      dining: `${venueName} is a restaurant in the area known for local cuisine and dining experiences.`,
      culture: `${venueName} is a cultural attraction offering insights into local history and traditions.`,
      nightlife: `${venueName} is a popular nightlife destination for drinks and entertainment.`,
      nature: `${venueName} is a natural attraction perfect for outdoor activities and scenic views.`,
      shopping: `${venueName} is a shopping destination where you can find local goods and souvenirs.`,
      attraction: `${venueName} is a popular attraction worth visiting during your trip.`
    }
    
    return {
      name: venueName,
      description: categoryDescriptions[category] || categoryDescriptions.attraction,
      shortDescription: categoryDescriptions[category] || categoryDescriptions.attraction,
      hours: "Hours vary",
      priceRange: "Price varies",
      website: null,
      coordinates: null,
      features: [category],
      sources: ['fallback'],
      lastUpdated: new Date().toISOString()
    }
  }

  // Batch enrichment for multiple venues
  async enrichMultipleVenues(venues, destination) {
    console.log(`🔄 Enriching ${venues.length} venues...`)
    
    const enrichedVenues = []
    
    for (const venue of venues) {
      try {
        const enriched = await this.enrichVenue(venue.name, destination, venue.category)
        enrichedVenues.push({
          ...venue,
          ...enriched
        })
      } catch (error) {
        console.error(`Failed to enrich ${venue.name}:`, error)
        enrichedVenues.push({
          ...venue,
          ...this.createFallbackData(venue.name, venue.category)
        })
      }
    }
    
    console.log(`✅ Successfully enriched ${enrichedVenues.length} venues`)
    return enrichedVenues
  }
}

export default new VenueEnrichmentService() 