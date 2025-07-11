import recommendationEngine from '../reddit/recommendationEngine.js'
import NewRecommendationEngine from '../recommendations/NewRecommendationEngine.js'
import { DeepSeekEnhancer } from '../ai/DeepSeekEnhancer.js'
import { API_CONFIG } from '../api/config.js'

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
    
    // Feature flags - set BEFORE initializing engines
    this.useNewEngine = true // Set to true to test the new engine
    this.usePhase3Discovery = true // Enable Phase 3 AI-enhanced discovery
    
    // Phase 3.5A: DeepSeek Enhancement Flags (READY FOR PRODUCTION)
    this.enableDeepSeekEnhancement = true // ENABLED: API is working properly
    this.deepSeekEnhancementMode = 'descriptions_only' // Conservative mode
    this.deepSeekFallbackOnly = true // Only use when Google Places succeeds
    
    // Initialize the new recommendation engine with Phase 3 enabled
    this.newRecommendationEngine = new NewRecommendationEngine({
      qualityThreshold: 50,
      maxRecommendations: 30,
      enableRedditProcessing: true,
      enableEnrichment: true,
      cacheEnabled: true,
      fallbackEnabled: true,
      usePhase3Discovery: this.usePhase3Discovery // Now properly references the flag above
    })
    
    // Phase 3.5A: Initialize DeepSeek enhancer with API key
    const deepSeekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
    this.deepSeekEnhancer = new DeepSeekEnhancer({
      enabled: this.enableDeepSeekEnhancement,
      enhancementMode: this.deepSeekEnhancementMode,
      maxRetries: 2,
      timeoutMs: 30000, // Increased timeout for reliability
      enableQualityChecks: true,
      apiKey: deepSeekApiKey // Explicitly pass the API key
    })
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
      
      // Phase 3.5A: SAFE DeepSeek Enhancement (only if enabled and recommendations exist)
      if (this.enableDeepSeekEnhancement && recommendations.length > 0) {
        console.log('🤖 Phase 3.5A: Applying DeepSeek enhancements...')
        try {
          const enhancedRecommendations = await this.deepSeekEnhancer.enhanceVenues(
            recommendations, 
            {
              destination: tripData.destination,
              preferences: tripData.categories,
              categories: tripData.categories,
              duration: this.calculateDays(tripData.startDate, tripData.endDate)
            }
          )
          
          // Safety check: Only use enhanced if same count (critical safety measure)
          if (enhancedRecommendations.length === recommendations.length) {
            console.log(`✅ DeepSeek enhancement successful: ${enhancedRecommendations.length} venues enhanced`)
            recommendations = enhancedRecommendations
          } else {
            console.warn(`⚠️ DeepSeek enhancement count mismatch (${enhancedRecommendations.length} vs ${recommendations.length}), using original`)
          }
        } catch (error) {
          console.error('❌ DeepSeek enhancement failed, using original recommendations:', error.message)
          // recommendations stays unchanged (safe fallback)
        }
      } else if (this.enableDeepSeekEnhancement) {
        console.log('🤖 DeepSeek enhancement enabled but no recommendations to enhance')
      }

      // Execute all searches in parallel for better performance
      const [venues, hotels, flights] = await Promise.all([
        this.searchVenues(tripData),
        this.searchHotelsEnhanced(tripData),
        this.searchFlights(tripData)
      ])
      
      // Build itinerary using existing logic
      const numDays = this.calculateDays(tripData.startDate, tripData.endDate)
      const itinerary = this.buildItinerary(tripData, recommendations, numDays)
      
      // Add flights and hotels to the itinerary
      if (flights) {
        itinerary.flights = flights
      }
      
      if (hotels && hotels.length > 0) {
        itinerary.hotels = hotels
      }
      
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

  /**
   * Phase 3.5A: Enable/disable DeepSeek enhancement (SAFETY CONTROL)
   */
  enableDeepSeekEnhancements(enabled = true) {
    this.enableDeepSeekEnhancement = enabled
    this.deepSeekEnhancer.setEnabled(enabled)
    console.log(`🤖 SmartItineraryGenerator: DeepSeek enhancement ${enabled ? 'ENABLED' : 'DISABLED'}`)
  }

  /**
   * Phase 3.5A: Change DeepSeek enhancement mode
   */
  setDeepSeekMode(mode) {
    const validModes = ['descriptions_only', 'venue_insights', 'full_narrative']
    if (validModes.includes(mode)) {
      this.deepSeekEnhancementMode = mode
      this.deepSeekEnhancer.setMode(mode)
      console.log(`🤖 SmartItineraryGenerator: DeepSeek mode set to ${mode}`)
    } else {
      console.warn(`⚠️ SmartItineraryGenerator: Invalid DeepSeek mode ${mode}`)
    }
  }

  /**
   * Phase 3.5A: Get DeepSeek enhancement metrics
   */
  getDeepSeekMetrics() {
    return this.deepSeekEnhancer.getMetrics()
  }

  /**
   * Phase 3.5A: Emergency disable DeepSeek (if issues detected)
   */
  emergencyDisableDeepSeek() {
    this.enableDeepSeekEnhancement = false
    this.deepSeekEnhancer.setEnabled(false)
    console.warn('🚨 SmartItineraryGenerator: DeepSeek enhancement EMERGENCY DISABLED')
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

    // Fallback if no recommendations available - pass used activities for diversity
    const usedActivities = Array.from(usedRecommendations)
    const fallbackActivity = this.generateFallbackActivity(timeOfDay, tripData.destination, usedActivities)
    
    // Track the fallback activity to prevent future duplicates
    if (fallbackActivity) {
      usedRecommendations.add(fallbackActivity.activity)
      console.log(`  🔄 Added fallback activity "${fallbackActivity.activity}" to used list`)
    }
    
    return fallbackActivity
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

  generateFallbackActivity(timeOfDay, destination, usedActivities = []) {
    // Generate specific fallback activities based on destination with diversity
    const destinationSpecific = this.getDestinationSpecificFallbacks(destination, timeOfDay, usedActivities)
    
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

  getDestinationSpecificFallbacks(destination, timeOfDay, usedActivities = []) {
    const destLower = destination.toLowerCase()
    
    // New York City specific fallbacks with diversity
    if (destLower.includes('new york') || destLower.includes('nyc') || destLower.includes('manhattan') || destLower.includes('brooklyn')) {
      const fallbackOptions = {
        morning: [
          { activity: 'Metropolitan Museum Visit', description: 'Explore one of the world\'s largest and most prestigious art museums with collections spanning 5,000 years', type: 'culture' },
          { activity: 'Brooklyn Bridge Walk', description: 'Walk across the iconic Brooklyn Bridge for spectacular views of Manhattan skyline', type: 'sightseeing' },
          { activity: 'High Line Park Stroll', description: 'Explore this unique elevated park built on former railway tracks with art installations', type: 'nature' }
        ],
        afternoon: [
          { activity: 'Central Park Cultural Walk', description: 'Stroll through America\'s most famous urban park and visit cultural landmarks like Bethesda Fountain', type: 'culture' },
          { activity: 'Chelsea Market Food Tour', description: 'Sample diverse cuisines and artisanal foods in this historic market hall', type: 'dining' },
          { activity: 'SoHo Art Gallery Tour', description: 'Discover contemporary art galleries and boutique shops in trendy SoHo district', type: 'culture' }
        ],
        evening: [
          { activity: 'Broadway District Exploration', description: 'Experience the heart of American theater in Times Square and the Theater District', type: 'culture' },
          { activity: 'Top of the Rock Sunset', description: 'Watch the sunset from Rockefeller Center\'s observation deck with panoramic city views', type: 'sightseeing' },
          { activity: 'Little Italy Dining Experience', description: 'Enjoy authentic Italian-American cuisine in the historic Little Italy neighborhood', type: 'dining' }
        ]
      }
      return this.selectUnusedFallback(fallbackOptions[timeOfDay], usedActivities)
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
    
    // Paris, France specific fallbacks with diversity
    if (destLower.includes('paris') || destLower.includes('france')) {
      const fallbackOptions = {
        morning: [
          { activity: 'Louvre Museum Visit', description: 'Explore world-famous art collections including the Mona Lisa and Venus de Milo', type: 'culture' },
          { activity: 'Notre-Dame Cathedral Area', description: 'Visit the historic cathedral area and explore Île de la Cité with its medieval charm', type: 'culture' },
          { activity: 'Champs-Élysées Stroll', description: 'Walk down the famous avenue from Arc de Triomphe to Place de la Concorde', type: 'sightseeing' }
        ],
        afternoon: [
          { activity: 'Seine River Walk', description: 'Stroll along the Seine River and admire iconic Parisian architecture and bridges', type: 'sightseeing' },
          { activity: 'Latin Quarter Exploration', description: 'Discover narrow medieval streets, bookshops, and cafés in this historic student district', type: 'culture' },
          { activity: 'Tuileries Garden Visit', description: 'Relax in these beautiful formal gardens between the Louvre and Place de la Concorde', type: 'nature' }
        ],
        evening: [
          { activity: 'Montmartre District', description: 'Experience the artistic heart of Paris with street performers and panoramic city views', type: 'culture' },
          { activity: 'Marais District Dining', description: 'Explore trendy restaurants and historic Jewish quarter in Le Marais', type: 'dining' },
          { activity: 'Seine Evening Cruise', description: 'See illuminated Paris landmarks from the water during a romantic evening cruise', type: 'sightseeing' }
        ]
      }
      return this.selectUnusedFallback(fallbackOptions[timeOfDay], usedActivities)
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

  /**
   * Select an unused fallback activity from available options
   */
  selectUnusedFallback(fallbackOptions, usedActivities) {
    if (!fallbackOptions || fallbackOptions.length === 0) {
      return null
    }

    // Find unused activities
    const unusedFallbacks = fallbackOptions.filter(option => 
      !usedActivities.includes(option.activity)
    )

    // If all activities are used, return the first one (better than nothing)
    const selectedFallback = unusedFallbacks.length > 0 ? unusedFallbacks[0] : fallbackOptions[0]
    
    return selectedFallback
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

  /**
   * Search for flights using the same logic as the main API
   */
  async searchFlights(tripData) {
    try {
      console.log('✈️ Smart Generator: Searching for flights...')
      
      // Use the functions URL from API config
      const functionsUrl = API_CONFIG.FUNCTIONS_URL
      const response = await fetch(`${functionsUrl}/search-flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: tripData.origin,
          destination: tripData.destination,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          passengers: tripData.people
        })
      })

      if (!response.ok) {
        throw new Error(`Flight search failed: ${response.status}`)
      }

      const flightData = await response.json()
      
      if (flightData.success && flightData.flights.length > 0) {
        console.log('✅ Smart Generator: Found flights')
        // Return the best flight option (first result)
        const bestFlight = flightData.flights[0]
        
        return {
          outbound: bestFlight.outbound,
          return: bestFlight.return,
          totalPrice: bestFlight.totalPrice,
          currency: bestFlight.currency,
          bookingUrl: bestFlight.bookingUrl,
          source: 'amadeus'
        }
      } else {
        throw new Error('No flights found')
      }
      
    } catch (error) {
      console.warn('⚠️ Smart Generator: Flight search failed, using fallback:', error.message)
      
      // Fallback to mock data
      return {
        outbound: {
          airline: 'American Airlines',
          flightNumber: 'AA123',
          departure: `${tripData.startDate}T08:00:00`,
          arrival: `${tripData.startDate}T12:00:00`,
          price: 324 * tripData.people,
        },
        return: tripData.endDate ? {
          airline: 'American Airlines',
          flightNumber: 'AA456',
          departure: `${tripData.endDate}T16:00:00`,
          arrival: `${tripData.endDate}T23:00:00`,
          price: 324 * tripData.people,
        } : null,
        totalPrice: 648 * tripData.people,
        currency: 'USD',
        source: 'fallback'
      }
    }
  }

  /**
   * Search for hotels using the same logic as the main API
   */
  async searchHotels(tripData) {
    try {
      console.log('🏨 Smart Generator: Searching for hotels...')
      
      // Use the functions URL from API config
      const functionsUrl = API_CONFIG.FUNCTIONS_URL
      const response = await fetch(`${functionsUrl}/search-hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination: tripData.destination,
          checkinDate: tripData.startDate,
          checkoutDate: tripData.endDate,
          guests: tripData.people,
          maxPrice: tripData.budgetPerPerson ? Math.round(tripData.budgetPerPerson * 0.3) : null
        })
      })

      if (!response.ok) {
        throw new Error(`Hotel search failed: ${response.status}`)
      }

      const hotelData = await response.json()
      
      if (hotelData.success && hotelData.hotels.length > 0) {
        console.log(`✅ Smart Generator: Found ${hotelData.hotels.length} hotels`)
        // Return processed hotel data
        return hotelData.hotels.map(hotel => ({
          name: hotel.name,
          rating: hotel.rating,
          price: hotel.pricePerNight,
          currency: hotel.currency || 'USD',
          location: hotel.location,
          address: hotel.address,
          amenities: hotel.amenities,
          images: hotel.images,
          image: hotel.images?.[0] || 'https://via.placeholder.com/400x300',
          room: hotel.room,
          policies: hotel.policies,
          bookingUrl: hotel.bookingUrl,
          source: 'amadeus'
        }))
      } else {
        throw new Error('No hotels found')
      }
      
    } catch (error) {
      console.warn('⚠️ Smart Generator: Hotel search failed, using fallback:', error.message)
      
      // Fallback to mock data
      return [
        {
          name: 'Beachfront Resort & Spa',
          rating: 4.5,
          price: 180,
          currency: 'USD',
          location: 'Hotel Zone',
          amenities: ['Pool', 'Beach Access', 'Free WiFi', 'Breakfast'],
          images: ['https://via.placeholder.com/400x300'],
          image: 'https://via.placeholder.com/400x300',
          source: 'fallback'
        },
        {
          name: 'Downtown Boutique Hotel',
          rating: 4.3,
          price: 120,
          currency: 'USD',
          location: 'City Center',
          amenities: ['Rooftop Bar', 'Free WiFi', 'Gym'],
          images: ['https://via.placeholder.com/400x300'],
          image: 'https://via.placeholder.com/400x300',
          source: 'fallback'
        },
      ]
    }
  }

  // Enhanced hotel search with image fetching
  async searchHotelsEnhanced(tripData) {
    console.log('🏨 Searching for hotels with enhanced images...')
    
    try {
      // Get hotels from Amadeus (primary) or Hotels.com (fallback)
      let hotelResults = await this.amadeusService.searchHotels({
        destination: tripData.destination,
        checkInDate: tripData.dates.start,
        checkOutDate: tripData.dates.end,
        guests: tripData.travelers,
        rooms: Math.ceil(tripData.travelers / 2)
      })

      // If Amadeus fails, try Hotels.com fallback
      if (!hotelResults.hotels || hotelResults.hotels.length === 0) {
        console.log('🔄 Amadeus hotels unavailable, trying Hotels.com fallback...')
        hotelResults = await this.hotelsComService.searchHotels({
          destination: tripData.destination,
          checkInDate: tripData.dates.start,
          checkOutDate: tripData.dates.end,
          guests: tripData.travelers,
          rooms: Math.ceil(tripData.travelers / 2)
        })
      }

      // Enhance hotels with real images using Google Places API
      if (hotelResults.hotels && hotelResults.hotels.length > 0) {
        console.log('📸 Enhancing hotels with real images...')
        
        const enhancedHotels = await Promise.all(
          hotelResults.hotels.slice(0, 5).map(async (hotel) => {
            try {
              // Use Google Places API to get real hotel images
              const enhancedHotel = await this.googlePlacesService.enhanceHotelWithImages(hotel)
              return enhancedHotel
            } catch (error) {
              console.warn(`⚠️ Failed to enhance images for ${hotel.name}:`, error.message)
              return hotel // Return original hotel if enhancement fails
            }
          })
        )

        console.log(`✅ Enhanced ${enhancedHotels.length} hotels with images`)
        return enhancedHotels
      }

      return hotelResults.hotels || []
      
    } catch (error) {
      console.error('❌ Hotel search failed:', error.message)
      return this.getFallbackHotels(tripData.destination)
    }
  }
}

export default new SmartItineraryGenerator() 