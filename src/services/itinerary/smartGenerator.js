import recommendationEngine from '../reddit/recommendationEngine.js'
import NewRecommendationEngine from '../recommendations/NewRecommendationEngine.js'

class SmartItineraryGenerator {
  constructor() {
    this.destinationCoords = {
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
    }
    
    // Initialize the new recommendation engine
    this.newRecommendationEngine = new NewRecommendationEngine({
      qualityThreshold: 50,
      maxRecommendations: 30,
      enableRedditProcessing: true,
      enableEnrichment: true,
      cacheEnabled: true,
      fallbackEnabled: true
    })
    
    // Feature flag to control which engine to use
    this.useNewEngine = true // Set to true to test the new engine
  }

  async generateSmartItinerary(tripData) {
    console.log('🧠 Generating smart itinerary with Reddit research for:', tripData.destination)
    
    try {
      let recommendations = []
      
      // Choose which recommendation engine to use
      if (this.useNewEngine) {
        console.log('🆕 Using new recommendation engine')
        const result = await this.newRecommendationEngine.generateRecommendations(tripData)
        
        if (result.success && result.data.length > 0) {
          console.log(`✅ New engine generated ${result.data.length} recommendations`)
          recommendations = this.convertNewRecommendationsToOldFormat(result.data)
        } else {
          console.warn('⚠️ New engine failed, falling back to old engine')
          recommendations = await this.generateRecommendationsOldWay(tripData)
        }
      } else {
        console.log('📜 Using legacy recommendation engine')
        recommendations = await this.generateRecommendationsOldWay(tripData)
      }
      
      if (recommendations.length === 0) {
        console.warn('⚠️ No recommendations generated, using fallback')
        return this.generateBasicItinerary(tripData)
      }
      
      console.log(`📊 Generated ${recommendations.length} recommendations for itinerary building`)
      
      // Build itinerary using existing logic
      const numDays = this.calculateDays(tripData.startDate, tripData.endDate)
      const itinerary = this.buildItinerary(tripData, recommendations, numDays)
      
      return itinerary
      
    } catch (error) {
      console.error('❌ Smart itinerary generation failed:', error)
      return this.generateBasicItinerary(tripData)
    }
  }

  /**
   * Convert new recommendation format to old format for compatibility
   */
  convertNewRecommendationsToOldFormat(newRecommendations) {
    return newRecommendations.map(recommendation => {
      const venue = recommendation.venue
      
      return {
        name: venue.name,
        category: venue.category,
        description: venue.description || venue.shortDescription || 'Popular venue',
        shortDescription: venue.shortDescription || venue.description || 'Popular venue',
        whyRecommended: recommendation.reasons.join('. ') || 'Recommended by travelers',
        avgPrice: venue.priceRange?.min || this.getDefaultPrice(venue.category),
        confidence: venue.confidenceScore,
        avgSentiment: venue.qualitySignals.sentimentScore || 0.5,
        enrichedData: venue.enrichmentData || {},
        sources: venue.sources.map(s => s.type),
        coordinates: venue.location ? {
          lat: venue.location.lat,
          lng: venue.location.lng
        } : null,
        timeSlots: recommendation.timeSlots || [],
        tags: recommendation.tags || [],
        metadata: {
          newEngineGenerated: true,
          qualityScore: venue.confidenceScore,
          mentionFrequency: venue.qualitySignals.mentionFrequency,
          hasRealLocation: venue.qualitySignals.hasRealLocation
        }
      }
    })
  }

  /**
   * Legacy recommendation generation (existing logic)
   */
  async generateRecommendationsOldWay(tripData) {
    // This is the existing logic from the old recommendationEngine
    const recommendationEngine = await import('../reddit/recommendationEngine.js')
    const recommendations = await recommendationEngine.default.generateRecommendations(tripData)
    return recommendations
  }

  /**
   * Get metrics from the new engine
   */
  getNewEngineMetrics() {
    if (this.newRecommendationEngine) {
      return this.newRecommendationEngine.getMetrics()
    }
    return null
  }

  /**
   * Reset the new engine caches
   */
  resetNewEngine() {
    if (this.newRecommendationEngine) {
      this.newRecommendationEngine.reset()
    }
  }

  /**
   * Switch between old and new engines
   */
  setEngineMode(useNewEngine) {
    this.useNewEngine = useNewEngine
    console.log(`🔄 SmartItineraryGenerator: Switched to ${useNewEngine ? 'new' : 'old'} engine`)
  }

  organizeRecommendations(recommendations) {
    const organized = {
      morning: {
        culture: [],
        nature: [],
        attraction: [],
        shopping: []
      },
      afternoon: {
        dining: [],
        culture: [],
        nature: [],
        attraction: [],
        shopping: []
      },
      evening: {
        dining: [],
        nightlife: [],
        culture: []
      }
    }

    console.log(`📝 Organizing ${recommendations.length} recommendations by time slot...`)

    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. Processing: "${rec.name}" (category: ${rec.category})`)
      
      // Determine best time of day for this recommendation
      if (rec.category === 'dining') {
        // Restaurants can be lunch or dinner
        if (rec.name.toLowerCase().includes('breakfast') || rec.name.toLowerCase().includes('cafe')) {
          organized.morning.dining = organized.morning.dining || []
          organized.morning.dining.push(rec)
          console.log(`    → Added to MORNING dining (breakfast/cafe)`)
        } else {
          organized.afternoon[rec.category].push(rec)
          organized.evening[rec.category].push(rec)
          console.log(`    → Added to AFTERNOON and EVENING dining`)
        }
      } else if (rec.category === 'nightlife') {
        organized.evening[rec.category].push(rec)
        console.log(`    → Added to EVENING nightlife`)
      } else if (rec.category === 'culture' || rec.category === 'attraction') {
        // Distribute cultural sites across morning/afternoon to avoid duplicates
        const morningCount = organized.morning[rec.category].length
        const afternoonCount = organized.afternoon[rec.category].length
        
        if (morningCount <= afternoonCount) {
          organized.morning[rec.category].push(rec)
          console.log(`    → Added to MORNING ${rec.category} (balance: morning=${morningCount+1}, afternoon=${afternoonCount})`)
        } else {
          organized.afternoon[rec.category].push(rec)
          console.log(`    → Added to AFTERNOON ${rec.category} (balance: morning=${morningCount}, afternoon=${afternoonCount+1})`)
        }
        
        // Also add some culture venues to evening for variety (every 3rd culture venue)
        if (rec.category === 'culture' && (morningCount + afternoonCount) % 3 === 0) {
          organized.evening[rec.category] = organized.evening[rec.category] || []
          organized.evening[rec.category].push(rec)
          console.log(`    → Also added to EVENING culture for variety`)
        }
      } else {
        // Default to afternoon
        organized.afternoon[rec.category] = organized.afternoon[rec.category] || []
        organized.afternoon[rec.category].push(rec)
        console.log(`    → Added to AFTERNOON ${rec.category} (default)`)
      }
    })

    // Log final organization summary
    console.log(`📊 Final organization summary:`)
    console.log(`  Morning: culture=${organized.morning.culture.length}, nature=${organized.morning.nature.length}, attraction=${organized.morning.attraction.length}, shopping=${organized.morning.shopping.length}`)
    console.log(`  Afternoon: dining=${organized.afternoon.dining.length}, culture=${organized.afternoon.culture.length}, nature=${organized.afternoon.nature.length}, attraction=${organized.afternoon.attraction.length}, shopping=${organized.afternoon.shopping.length}`)
    console.log(`  Evening: dining=${organized.evening.dining.length}, nightlife=${organized.evening.nightlife.length}, culture=${organized.evening.culture.length}`)

    return organized
  }

  buildItinerary(tripData, recommendations, numDays) {
    const itineraryId = `smart-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    // Handle both old organized format and new flat array format
    let organizedRecommendations
    if (Array.isArray(recommendations)) {
      // New format: flat array of recommendations
      console.log(`🔄 Converting ${recommendations.length} flat recommendations to organized format`)
      organizedRecommendations = this.organizeRecommendations(recommendations)
    } else {
      // Old format: already organized by time slots
      console.log(`📋 Using pre-organized recommendations`)
      organizedRecommendations = recommendations
    }
    
    const days = []
    let usedRecommendations = new Set()

    for (let i = 0; i < numDays; i++) {
      const dayDate = new Date(tripData.startDate)
      dayDate.setDate(dayDate.getDate() + i)
      
      const day = {
        dayNumber: i + 1,
        date: dayDate.toISOString().split('T')[0],
        title: `Day ${i + 1} in ${tripData.destination}`,
        morning: this.selectActivity(organizedRecommendations.morning, usedRecommendations, 'morning', tripData),
        afternoon: this.selectActivity(organizedRecommendations.afternoon, usedRecommendations, 'afternoon', tripData),
        evening: this.selectActivity(organizedRecommendations.evening, usedRecommendations, 'evening', tripData)
      }
      
      days.push(day)
    }

    // Calculate budget breakdown
    const budgetSummary = this.calculateBudgetSummary(days, tripData)

    return {
      id: itineraryId,
      destination: tripData.destination,
      title: `Your ${tripData.destination} Adventure`,
      overview: this.generateOverview(tripData, days),
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      people: tripData.people,
      budget: tripData.budget,
      days,
      budgetSummary,
      insiderTips: this.generateInsiderTips(tripData.destination, organizedRecommendations),
      generatedBy: this.useNewEngine ? 'new-engine' : 'reddit-research'
    }
  }

  selectActivity(timeSlotRecommendations, usedRecommendations, timeOfDay, tripData) {
    console.log(`🎯 Selecting ${timeOfDay} activity from:`, timeSlotRecommendations)
    console.log(`🔍 Currently used recommendations:`, Array.from(usedRecommendations))
    
    // Find best unused recommendation for this time slot
    for (const category of Object.keys(timeSlotRecommendations)) {
      const categoryRecs = timeSlotRecommendations[category]
      console.log(`  📂 ${category}: ${categoryRecs.length} recommendations`)
      
      // Log all recommendations in this category for debugging
      categoryRecs.forEach((rec, index) => {
        const isUsed = usedRecommendations.has(rec.name)
        console.log(`    ${index + 1}. "${rec.name}" - ${isUsed ? '❌ ALREADY USED' : '✅ AVAILABLE'}`)
      })
      
      for (const rec of categoryRecs) {
        if (!usedRecommendations.has(rec.name)) {
          usedRecommendations.add(rec.name)
          console.log(`  ✅ Selected: "${rec.name}" (${rec.category}) for ${timeOfDay}`)
          console.log(`  🔄 Updated used recommendations:`, Array.from(usedRecommendations))
          
          return {
            time: this.getTimeForSlot(timeOfDay),
            activity: rec.name,
            description: rec.enrichedData?.description || rec.description || rec.shortDescription || `Experience ${rec.name}, a popular ${rec.category} destination.`,
            estimatedCost: rec.avgPrice || this.getDefaultPrice(rec.category),
            type: rec.category,
            location: this.generateLocationForVenue(rec.name, rec.addresses, rec.enrichedData?.coordinates),
            whyRecommended: rec.whyRecommended,
            redditMentions: rec.mentionCount,
            confidence: rec.confidence,
            // Enhanced data from Google Places API
            rating: rec.enrichedData?.rating,
            totalRatings: rec.enrichedData?.totalRatings,
            phone: rec.enrichedData?.phone,
            address: rec.enrichedData?.address,
            hours: rec.enrichedData?.hours || rec.hours,
            priceRange: rec.enrichedData?.priceRange || rec.priceRange,
            website: rec.enrichedData?.website || rec.website,
            features: rec.enrichedData?.features || rec.features,
            photos: rec.enrichedData?.photos || [],
            businessStatus: rec.enrichedData?.businessStatus,
            sources: rec.enrichedData?.sources || ['reddit']
          }
        } else {
          console.log(`    ⏭️ Skipping "${rec.name}" - already used`)
        }
      }
    }
    
    console.log(`  ⚠️ No unused recommendations found for ${timeOfDay}, using fallback`)
    console.log(`  📊 Total used recommendations so far:`, usedRecommendations.size)

    // Fallback if no recommendations available
    return this.generateFallbackActivity(timeOfDay, tripData.destination)
  }

  generateLocationForVenue(venueName, addresses, coordinates) {
    // Prioritize Google Places coordinates if available
    if (coordinates && coordinates.lat && coordinates.lng) {
      return {
        lat: coordinates.lat,
        lng: coordinates.lng,
        address: addresses?.[0] || 'Address available on-site'
      }
    }

    // Try to use address information if available
    if (addresses && addresses.length > 0) {
      // Use first address and try to geocode it (simplified)
      const baseCoords = this.getDestinationCoords(venueName)
      return {
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.02,
        address: addresses[0]
      }
    }

    // Generate random location near destination
    return this.generateRandomLocation(venueName)
  }

  generateRandomLocation(destination) {
    const baseCoords = this.getDestinationCoords(destination)
    
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.02
    }
  }

  getDestinationCoords(destination) {
    // Try exact match first
    let baseCoords = this.destinationCoords[destination]
    
    if (!baseCoords) {
      // Try partial match
      const destLower = destination.toLowerCase()
      for (const [key, coords] of Object.entries(this.destinationCoords)) {
        if (destLower.includes(key.toLowerCase()) || key.toLowerCase().includes(destLower)) {
          baseCoords = coords
          break
        }
      }
    }
    
    return baseCoords || { lat: 0, lng: 0 }
  }

  getTimeForSlot(timeOfDay) {
    switch (timeOfDay) {
      case 'morning': return '9:00 AM'
      case 'afternoon': return '2:00 PM'
      case 'evening': return '7:00 PM'
      default: return '12:00 PM'
    }
  }

  getDefaultPrice(category) {
    const defaultPrices = {
      dining: 35,
      culture: 25,
      attraction: 45,
      nature: 30,
      nightlife: 40,
      shopping: 50
    }
    
    return defaultPrices[category] || 30
  }

  generateFallbackActivity(timeOfDay, destination) {
    // Generate specific fallback activities based on destination
    const destinationSpecific = this.getDestinationSpecificFallbacks(destination, timeOfDay)
    
    if (destinationSpecific) {
      return {
        time: this.getTimeForSlot(timeOfDay),
        activity: destinationSpecific.activity,
        description: destinationSpecific.description,
        estimatedCost: this.getDefaultPrice(destinationSpecific.type),
        type: destinationSpecific.type,
        location: this.generateRandomLocation(destination),
        whyRecommended: 'Popular activity for this destination',
        sources: ['fallback']
      }
    }

    // Generic fallbacks as last resort
    const genericFallbacks = {
      morning: {
        activity: 'City Walking Tour',
        description: `Take a self-guided walking tour to discover the highlights of ${destination}`,
        type: 'sightseeing'
      },
      afternoon: {
        activity: 'Local Market Visit',
        description: `Explore local markets and try authentic regional specialties`,
        type: 'dining'
      },
      evening: {
        activity: 'Sunset Viewing',
        description: `Find a scenic spot to watch the sunset and experience the local atmosphere`,
        type: 'nature'
      }
    }

    const fallback = genericFallbacks[timeOfDay] || genericFallbacks.afternoon
    
    return {
      time: this.getTimeForSlot(timeOfDay),
      activity: fallback.activity,
      description: fallback.description,
      estimatedCost: this.getDefaultPrice(fallback.type),
      type: fallback.type,
      location: this.generateRandomLocation(destination),
      whyRecommended: 'Recommended activity type',
      sources: ['fallback']
    }
  }

  getDestinationSpecificFallbacks(destination, timeOfDay) {
    const destLower = destination.toLowerCase()
    
    // New York City specific fallbacks
    if (destLower.includes('new york') || destLower.includes('nyc') || destLower.includes('manhattan') || destLower.includes('brooklyn')) {
      const fallbacks = {
        morning: {
          activity: 'Metropolitan Museum Visit',
          description: 'Explore one of the world\'s largest and most prestigious art museums with collections spanning 5,000 years',
          type: 'culture'
        },
        afternoon: {
          activity: 'Central Park Cultural Walk',
          description: 'Stroll through America\'s most famous urban park and visit cultural landmarks like Bethesda Fountain',
          type: 'culture'
        },
        evening: {
          activity: 'Broadway District Exploration',
          description: 'Experience the heart of American theater in Times Square and the Theater District',
          type: 'culture'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Bali, Indonesia specific fallbacks
    if (destLower.includes('bali') || destLower.includes('indonesia')) {
      const fallbacks = {
        morning: {
          activity: 'Traditional Temple Visit',
          description: 'Visit ancient Hindu temples like Tanah Lot or Uluwatu and experience Balinese spiritual culture',
          type: 'culture'
        },
        afternoon: {
          activity: 'Tegallalang Rice Terraces',
          description: 'Explore the famous stepped rice terraces and learn about traditional Balinese agriculture',
          type: 'nature'
        },
        evening: {
          activity: 'Ubud Art Market',
          description: 'Browse traditional crafts, textiles, and artwork in Ubud\'s vibrant cultural center',
          type: 'shopping'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Paris, France specific fallbacks
    if (destLower.includes('paris') || destLower.includes('france')) {
      const fallbacks = {
        morning: {
          activity: 'Louvre Museum Visit',
          description: 'Explore world-famous art collections including the Mona Lisa and Venus de Milo',
          type: 'culture'
        },
        afternoon: {
          activity: 'Seine River Walk',
          description: 'Stroll along the Seine River and admire iconic Parisian architecture and bridges',
          type: 'sightseeing'
        },
        evening: {
          activity: 'Montmartre District',
          description: 'Experience the artistic heart of Paris with street performers and panoramic city views',
          type: 'culture'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Barcelona, Spain specific fallbacks
    if (destLower.includes('barcelona') || destLower.includes('spain')) {
      const fallbacks = {
        morning: {
          activity: 'Sagrada Familia Visit',
          description: 'Marvel at Gaudí\'s masterpiece and learn about Barcelona\'s unique architectural heritage',
          type: 'culture'
        },
        afternoon: {
          activity: 'Gothic Quarter Exploration',
          description: 'Wander through medieval streets and discover hidden plazas in the historic city center',
          type: 'culture'
        },
        evening: {
          activity: 'Tapas Tour',
          description: 'Experience authentic Spanish culture through traditional tapas and local wine',
          type: 'dining'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Tokyo, Japan specific fallbacks
    if (destLower.includes('tokyo') || destLower.includes('japan')) {
      const fallbacks = {
        morning: {
          activity: 'Traditional Temple Visit',
          description: 'Visit Senso-ji Temple or Meiji Shrine to experience Japan\'s spiritual traditions',
          type: 'culture'
        },
        afternoon: {
          activity: 'Traditional Market Tour',
          description: 'Explore Tsukiji Outer Market or Ameya-Yokocho for authentic Japanese street food',
          type: 'dining'
        },
        evening: {
          activity: 'Traditional District Walk',
          description: 'Stroll through Asakusa or Shibuya to experience Tokyo\'s blend of traditional and modern culture',
          type: 'culture'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Thailand specific fallbacks
    if (destLower.includes('thailand') || destLower.includes('bangkok') || destLower.includes('phuket') || destLower.includes('chiang mai')) {
      const fallbacks = {
        morning: {
          activity: 'Buddhist Temple Visit',
          description: 'Visit golden temples like Wat Pho or Wat Arun to experience Thai Buddhist culture',
          type: 'culture'
        },
        afternoon: {
          activity: 'Floating Market Tour',
          description: 'Experience traditional Thai commerce at colorful floating markets',
          type: 'culture'
        },
        evening: {
          activity: 'Thai Street Food Tour',
          description: 'Sample authentic Thai cuisine from local street vendors and night markets',
          type: 'dining'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Italy specific fallbacks
    if (destLower.includes('italy') || destLower.includes('rome') || destLower.includes('florence') || destLower.includes('venice')) {
      const fallbacks = {
        morning: {
          activity: 'Historical Site Visit',
          description: 'Explore ancient Roman ruins, Renaissance art, or medieval architecture',
          type: 'culture'
        },
        afternoon: {
          activity: 'Traditional Piazza Tour',
          description: 'Visit historic city squares and admire Italian architecture and fountains',
          type: 'culture'
        },
        evening: {
          activity: 'Italian Cuisine Experience',
          description: 'Enjoy authentic pasta, pizza, or gelato in a traditional Italian setting',
          type: 'dining'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Cancun/Riviera Maya specific fallbacks
    if (destLower.includes('cancun') || destLower.includes('riviera maya') || destLower.includes('playa del carmen')) {
      const fallbacks = {
        morning: {
          activity: 'Mayan Ruins Exploration',
          description: 'Explore ancient Mayan archaeological sites and learn about pre-Columbian history',
          type: 'culture'
        },
        afternoon: {
          activity: 'Cenote Swimming',
          description: 'Swim in crystal-clear cenotes (natural sinkholes) unique to the Yucatan Peninsula',
          type: 'nature'
        },
        evening: {
          activity: 'Mexican Cuisine Tasting',
          description: 'Sample authentic Yucatecan dishes like cochinita pibil and sopa de lima',
          type: 'dining'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    // Greece specific fallbacks
    if (destLower.includes('greece') || destLower.includes('athens') || destLower.includes('santorini') || destLower.includes('mykonos')) {
      const fallbacks = {
        morning: {
          activity: 'Ancient Greek Site Visit',
          description: 'Explore ancient temples, amphitheaters, or archaeological museums',
          type: 'culture'
        },
        afternoon: {
          activity: 'Traditional Village Tour',
          description: 'Wander through whitewashed villages and experience authentic Greek island life',
          type: 'culture'
        },
        evening: {
          activity: 'Greek Taverna Experience',
          description: 'Enjoy traditional Greek cuisine with mezze, fresh seafood, and local wine',
          type: 'dining'
        }
      }
      return fallbacks[timeOfDay]
    }
    
    return null
  }

  generateOverview(tripData, days) {
    const numDays = days.length
    const destination = tripData.destination
    
    return `Experience the best of ${destination} with this carefully planned ${numDays}-day itinerary. ` +
           `Based on real traveler recommendations from Reddit, this guide will help you explore the ` +
           `destination's highlights while staying within your budget of $${tripData.budget}.`
  }

  generateInsiderTips(destination, recommendations) {
    const tips = [
      `Book accommodations in advance for better rates in ${destination}`,
      `Always carry local currency for small vendors and tips`,
      `Download offline maps before exploring to save on data costs`
    ]

    // Add Reddit-specific tips if available
    if (recommendations.length > 0) {
      tips.push('These recommendations are based on real traveler experiences from Reddit')
      
      const budgetTips = recommendations.filter(r => r.avgPrice && r.avgPrice < 30)
      if (budgetTips.length > 0) {
        tips.push(`Look for budget-friendly options like ${budgetTips[0].name} for great value`)
      }
    }

    return tips
  }

  calculateBudgetSummary(days, tripData) {
    const totalActivitiesCost = days.reduce((sum, day) => {
      return sum + 
        (day.morning?.estimatedCost || 0) + 
        (day.afternoon?.estimatedCost || 0) + 
        (day.evening?.estimatedCost || 0)
    }, 0)

    const estimatedMeals = totalActivitiesCost * 0.4
    const estimatedTransport = totalActivitiesCost * 0.2
    
    return {
      activities: totalActivitiesCost,
      food: Math.round(estimatedMeals),
      transportation: Math.round(estimatedTransport),
      accommodation: Math.round(tripData.budget * 0.4), // Estimate 40% for accommodation
      total: Math.round(totalActivitiesCost + estimatedMeals + estimatedTransport + (tripData.budget * 0.4))
    }
  }

  calculateDays(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  generateBasicItinerary(tripData) {
    console.log('🔄 Falling back to basic itinerary generation')
    
    // This is a simplified fallback - you could import the existing generator here
    const days = this.calculateDays(tripData.startDate, tripData.endDate)
    const itineraryId = `basic-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    return {
      id: itineraryId,
      destination: tripData.destination,
      title: `Your ${tripData.destination} Adventure`,
      overview: `A ${days}-day adventure in ${tripData.destination}`,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      people: tripData.people,
      budget: tripData.budget,
      days: [],
      budgetSummary: { total: tripData.budget },
      insiderTips: ['Basic itinerary - Reddit research unavailable'],
      generatedBy: 'basic-fallback'
    }
  }
}

export default new SmartItineraryGenerator() 