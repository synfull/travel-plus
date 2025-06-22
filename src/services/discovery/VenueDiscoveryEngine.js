/**
 * Intelligent Venue Discovery Engine
 * Phase 3: Multi-source venue aggregation with AI-powered ranking
 */

import { VenueAnalyzer } from '../ai/VenueAnalyzer.js'
import { GooglePlacesService } from '../api/GooglePlacesService.js'
import { VenueCategory, Venue } from '../types/index.js'

export class VenueDiscoveryEngine {
  constructor(options = {}) {
    this.options = {
      maxVenuesPerSource: 50,
      finalVenueLimit: 20,
      enableRedditSource: true,
      enableGooglePlacesSource: true,
      enableAIAnalysis: true,
      confidenceThreshold: 0.6,
      diversityWeight: 0.3,
      qualityWeight: 0.7,
      ...options
    }

    // Initialize services
    this.venueAnalyzer = new VenueAnalyzer({
      confidenceThreshold: this.options.confidenceThreshold
    })
    
    this.googlePlacesService = new GooglePlacesService({
      maxResults: this.options.maxVenuesPerSource
    })

    this.discoveryStats = {
      totalVenuesFound: 0,
      sourceBreakdown: {},
      processingTime: 0,
      qualityDistribution: {}
    }

    console.log('🎯 VenueDiscoveryEngine: Multi-source discovery system initialized')
  }

  /**
   * Main discovery method - orchestrates all venue sources
   */
  async discoverVenues(tripData) {
    console.log(`🔍 VenueDiscoveryEngine: Starting venue discovery for ${tripData.destination}`)
    const startTime = Date.now()

    try {
      // Step 1: Collect venues from all sources
      const allVenues = await this.collectFromAllSources(tripData)
      
      // Step 2: AI-powered analysis and filtering
      const analyzedVenues = await this.performAIAnalysis(allVenues, tripData)
      
      // Step 3: Intelligent ranking and diversification
      const rankedVenues = await this.rankAndDiversify(analyzedVenues, tripData)
      
      // Step 4: Final selection and optimization
      const finalVenues = this.selectFinalVenues(rankedVenues, tripData)

      // Update statistics
      this.discoveryStats.processingTime = Date.now() - startTime
      this.discoveryStats.totalVenuesFound = finalVenues.length
      
      console.log(`✅ VenueDiscoveryEngine: Discovered ${finalVenues.length} high-quality venues in ${this.discoveryStats.processingTime}ms`)
      
      return {
        venues: finalVenues,
        metadata: {
          stats: this.discoveryStats,
          sources: this.getSourceBreakdown(finalVenues),
          qualityMetrics: this.calculateQualityMetrics(finalVenues)
        }
      }

    } catch (error) {
      console.error(`❌ VenueDiscoveryEngine: Discovery failed for ${tripData.destination}:`, error.message)
      throw error
    }
  }

  /**
   * Collect venues from all available sources
   */
  async collectFromAllSources(tripData) {
    console.log('🌐 VenueDiscoveryEngine: Collecting venues from all sources')
    const venueCollections = []

    // Source 1: Google Places API
    if (this.options.enableGooglePlacesSource) {
      try {
        console.log('🔍 VenueDiscoveryEngine: Querying Google Places API')
        const googleVenues = await this.googlePlacesService.searchVenues(
          tripData.destination,
          this.extractCategories(tripData),
          this.extractPreferences(tripData)
        )
        
        venueCollections.push({
          source: 'google_places',
          venues: googleVenues,
          priority: 1.0 // Highest priority for real-time data
        })
        
        console.log(`✅ VenueDiscoveryEngine: Google Places found ${googleVenues.length} venues`)
      } catch (error) {
        console.warn('⚠️ VenueDiscoveryEngine: Google Places search failed:', error.message)
      }
    }

    // Source 2: Reddit Integration (if available)
    if (this.options.enableRedditSource) {
      try {
        console.log('🔍 VenueDiscoveryEngine: Querying Reddit data')
        const redditVenues = await this.collectFromReddit(tripData)
        
        if (redditVenues.length > 0) {
          venueCollections.push({
            source: 'reddit',
            venues: redditVenues,
            priority: 0.8 // High priority for local insights
          })
          
          console.log(`✅ VenueDiscoveryEngine: Reddit found ${redditVenues.length} venues`)
        }
      } catch (error) {
        console.warn('⚠️ VenueDiscoveryEngine: Reddit search failed:', error.message)
      }
    }

    // Source 3: Curated Database (fallback)
    try {
      console.log('🔍 VenueDiscoveryEngine: Checking curated database')
      const curatedVenues = await this.collectFromCuratedDatabase(tripData)
      
      if (curatedVenues.length > 0) {
        venueCollections.push({
          source: 'curated',
          venues: curatedVenues,
          priority: 0.6 // Lower priority but guaranteed quality
        })
        
        console.log(`✅ VenueDiscoveryEngine: Curated database found ${curatedVenues.length} venues`)
      }
    } catch (error) {
      console.warn('⚠️ VenueDiscoveryEngine: Curated database search failed:', error.message)
    }

    // Merge and deduplicate venues
    const allVenues = this.mergeVenueCollections(venueCollections)
    console.log(`🔄 VenueDiscoveryEngine: Merged ${allVenues.length} unique venues from ${venueCollections.length} sources`)
    
    return allVenues
  }

  /**
   * Perform AI analysis on all collected venues
   */
  async performAIAnalysis(venues, tripData) {
    if (!this.options.enableAIAnalysis || venues.length === 0) {
      return venues.map(venue => ({ venue, aiAnalysis: null }))
    }

    console.log(`🧠 VenueDiscoveryEngine: Performing AI analysis on ${venues.length} venues`)
    
    const context = {
      destination: tripData.destination,
      preferences: this.extractPreferences(tripData),
      categories: this.extractCategories(tripData),
      budget: tripData.budget,
      duration: this.calculateTripDuration(tripData)
    }

    try {
      const analyzedVenues = await this.venueAnalyzer.analyzeVenues(venues, context)
      console.log(`✅ VenueDiscoveryEngine: AI analysis completed for ${analyzedVenues.length} venues`)
      return analyzedVenues
    } catch (error) {
      console.warn('⚠️ VenueDiscoveryEngine: AI analysis failed, proceeding without AI insights:', error.message)
      return venues.map(venue => ({ venue, aiAnalysis: null }))
    }
  }

  /**
   * Intelligent ranking with diversity optimization
   */
  async rankAndDiversify(analyzedVenues, tripData) {
    console.log(`🎯 VenueDiscoveryEngine: Ranking and diversifying ${analyzedVenues.length} venues`)
    
    // Step 1: Calculate composite scores
    const scoredVenues = analyzedVenues.map(item => ({
      ...item,
      compositeScore: this.calculateCompositeScore(item, tripData)
    }))

    // Step 2: Apply diversity constraints
    const diversifiedVenues = this.applyDiversityConstraints(scoredVenues, tripData)
    
    // Step 3: Final ranking
    const rankedVenues = diversifiedVenues.sort((a, b) => b.compositeScore - a.compositeScore)
    
    console.log(`✅ VenueDiscoveryEngine: Ranked ${rankedVenues.length} venues with diversity optimization`)
    return rankedVenues
  }

  /**
   * Select final venues with optimization
   */
  selectFinalVenues(rankedVenues, tripData) {
    const finalVenues = []
    const categoryDistribution = new Map()
    const maxPerCategory = Math.ceil(this.options.finalVenueLimit / 3) // Rough distribution

    for (const item of rankedVenues) {
      if (finalVenues.length >= this.options.finalVenueLimit) break

      const venue = item.venue || item
      const category = venue.category || VenueCategory.ATTRACTION
      const currentCount = categoryDistribution.get(category) || 0

      // Ensure category diversity
      if (currentCount < maxPerCategory || finalVenues.length < this.options.finalVenueLimit * 0.8) {
        finalVenues.push(venue)
        categoryDistribution.set(category, currentCount + 1)
      }
    }

    return finalVenues
  }

  /**
   * Calculate composite score combining multiple factors
   */
  calculateCompositeScore(item, tripData) {
    let score = 0
    const venue = item.venue || item

    // Base popularity score (0-40 points)
    if (venue.popularity) {
      score += Math.min(40, venue.popularity)
    }

    // AI analysis score (0-30 points)
    if (item.aiAnalysis && item.aiAnalysis.aiScore) {
      score += (item.aiAnalysis.aiScore / 100) * 30
    }

    // Rating score (0-20 points)
    if (venue.rating) {
      score += (venue.rating / 5) * 20
    }

    // Source priority bonus (0-10 points)
    const sourcePriority = this.getSourcePriority(venue.source)
    score += sourcePriority * 10

    return score
  }

  /**
   * Apply diversity constraints to ensure variety
   */
  applyDiversityConstraints(venues, tripData) {
    const categoryGroups = new Map()
    
    // Group venues by category
    venues.forEach(item => {
      const category = item.venue?.category || VenueCategory.ATTRACTION
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      categoryGroups.get(category).push(item)
    })

    // Select top venues from each category
    const diversifiedVenues = []
    const maxPerCategory = Math.ceil(venues.length / categoryGroups.size)

    for (const [category, categoryVenues] of categoryGroups) {
      const sortedCategoryVenues = categoryVenues
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, maxPerCategory)
      
      diversifiedVenues.push(...sortedCategoryVenues)
    }

    return diversifiedVenues
  }

  /**
   * Merge venue collections and handle deduplication
   */
  mergeVenueCollections(collections) {
    const venueMap = new Map()
    const sourceStats = {}

    collections.forEach(collection => {
      sourceStats[collection.source] = collection.venues.length
      
      collection.venues.forEach(venue => {
        const key = this.generateVenueKey(venue)
        
        if (!venueMap.has(key)) {
          venueMap.set(key, {
            ...venue,
            source: collection.source,
            sourcePriority: collection.priority
          })
        } else {
          // Keep venue from higher priority source
          const existing = venueMap.get(key)
          if (collection.priority > existing.sourcePriority) {
            venueMap.set(key, {
              ...venue,
              source: collection.source,
              sourcePriority: collection.priority
            })
          }
        }
      })
    })

    this.discoveryStats.sourceBreakdown = sourceStats
    return Array.from(venueMap.values())
  }

  /**
   * Generate unique key for venue deduplication
   */
  generateVenueKey(venue) {
    // Use name and approximate location for deduplication
    const name = venue.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown'
    const lat = venue.coordinates?.lat ? Math.round(venue.coordinates.lat * 1000) : 0
    const lng = venue.coordinates?.lng ? Math.round(venue.coordinates.lng * 1000) : 0
    
    return `${name}_${lat}_${lng}`
  }

  /**
   * Collect venues from Reddit (placeholder - would integrate with existing Reddit system)
   */
  async collectFromReddit(tripData) {
    // This would integrate with the existing Reddit processing system
    // For now, return empty array as Reddit is handled by the pipeline
    return []
  }

  /**
   * Collect venues from curated database (placeholder)
   */
  async collectFromCuratedDatabase(tripData) {
    // This would integrate with the FallbackManager's curated database
    // For now, return empty array as curated data is handled by fallback
    return []
  }

  /**
   * Extract categories from trip data
   */
  extractCategories(tripData) {
    const categories = []
    
    if (tripData.categories) {
      if (Array.isArray(tripData.categories)) {
        categories.push(...tripData.categories)
      } else if (typeof tripData.categories === 'string') {
        categories.push(tripData.categories)
      }
    }

    // Map common preference strings to categories
    const preferences = this.extractPreferences(tripData)
    preferences.forEach(pref => {
      const category = this.mapPreferenceToCategory(pref)
      if (category && !categories.includes(category)) {
        categories.push(category)
      }
    })

    return categories.length > 0 ? categories : [VenueCategory.ATTRACTION, VenueCategory.DINING]
  }

  /**
   * Extract preferences from trip data
   */
  extractPreferences(tripData) {
    const preferences = []
    
    if (tripData.preferences) {
      if (Array.isArray(tripData.preferences)) {
        preferences.push(...tripData.preferences)
      } else if (typeof tripData.preferences === 'string') {
        preferences.push(tripData.preferences)
      }
    }

    // Check for category-based preferences
    if (tripData.categories) {
      const categoryPrefs = Array.isArray(tripData.categories) 
        ? tripData.categories 
        : [tripData.categories]
      preferences.push(...categoryPrefs)
    }

    return preferences
  }

  /**
   * Map preference string to venue category
   */
  mapPreferenceToCategory(preference) {
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
   * Calculate trip duration in days
   */
  calculateTripDuration(tripData) {
    if (tripData.startDate && tripData.endDate) {
      const start = new Date(tripData.startDate)
      const end = new Date(tripData.endDate)
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    }
    return 2 // Default to 2 days
  }

  /**
   * Get source priority for scoring
   */
  getSourcePriority(source) {
    const priorities = {
      'google_places': 1.0,
      'reddit': 0.8,
      'curated': 0.6,
      'fallback': 0.4
    }
    return priorities[source] || 0.5
  }

  /**
   * Get source breakdown for metadata
   */
  getSourceBreakdown(venues) {
    const breakdown = {}
    venues.forEach(venue => {
      const source = venue.source || 'unknown'
      breakdown[source] = (breakdown[source] || 0) + 1
    })
    return breakdown
  }

  /**
   * Calculate quality metrics for metadata
   */
  calculateQualityMetrics(venues) {
    if (venues.length === 0) return {}

    const ratings = venues.filter(v => v.rating > 0).map(v => v.rating)
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0
    
    const withPhotos = venues.filter(v => v.photos && v.photos.length > 0).length
    const withReviews = venues.filter(v => v.reviewCount > 0).length

    return {
      averageRating: Math.round(avgRating * 10) / 10,
      venuesWithPhotos: withPhotos,
      venuesWithReviews: withReviews,
      photoPercentage: Math.round((withPhotos / venues.length) * 100),
      reviewPercentage: Math.round((withReviews / venues.length) * 100)
    }
  }

  /**
   * Get discovery statistics
   */
  getStats() {
    return {
      ...this.discoveryStats,
      googlePlacesStats: this.googlePlacesService.getStats()
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.googlePlacesService.clearCache()
    console.log('🧹 VenueDiscoveryEngine: All caches cleared')
  }
} 