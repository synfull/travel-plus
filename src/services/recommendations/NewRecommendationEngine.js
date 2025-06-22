import { PipelineBuilder } from '../pipeline/RecommendationPipeline.js'
import { QualityController, QualityCheckers } from '../quality/QualityController.js'
import FallbackManager from '../fallback/FallbackManager.js'
import { 
  Venue, 
  VenueCategory, 
  DataSource, 
  PipelineStage, 
  ProcessingResult, 
  Recommendation,
  Coordinates,
  PriceRange
} from '../types/index.js'

// Import existing services (we'll integrate these gradually)
import redditAPI from '../reddit/redditAPI.js'
import contentParser from '../reddit/contentParser.js'
import venueEnrichment from '../enrichment/venueEnrichment.js'

/**
 * New recommendation engine built on the modular pipeline architecture
 */
export class NewRecommendationEngine {
  constructor(options = {}) {
    this.options = {
      enableRedditProcessing: options.enableRedditProcessing !== false,
      enableEnrichment: options.enableEnrichment !== false,
      qualityThreshold: options.qualityThreshold || 50,
      maxRecommendations: options.maxRecommendations || 30,
      cacheEnabled: options.cacheEnabled !== false,
      fallbackEnabled: options.fallbackEnabled !== false,
      ...options
    }

    this.qualityController = new QualityController({
      minConfidenceScore: this.options.qualityThreshold,
      enableCaching: this.options.cacheEnabled
    })

    this.fallbackManager = new FallbackManager({
      maxFallbackVenues: this.options.maxRecommendations
    })

    this.pipeline = this.createPipeline()
    this.cache = new Map()
  }

  /**
   * Generate recommendations using the new pipeline architecture
   */
  async generateRecommendations(tripData) {
    console.log(`🚀 NewRecommendationEngine: Starting recommendation generation for ${tripData.destination}`)
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(tripData)
      if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
        console.log(`💾 NewRecommendationEngine: Returning cached recommendations`)
        return this.cache.get(cacheKey)
      }

      // Execute the pipeline
      const pipelineResult = await this.pipeline.execute(tripData)

      if (pipelineResult.success && pipelineResult.data.length > 0) {
        console.log(`✅ NewRecommendationEngine: Pipeline successful - ${pipelineResult.data.length} recommendations`)
        
        // Cache the results
        if (this.options.cacheEnabled) {
          this.cache.set(cacheKey, pipelineResult)
        }

        return pipelineResult

      } else {
        console.warn(`⚠️ NewRecommendationEngine: Pipeline failed or returned no results`)
        
        if (this.options.fallbackEnabled) {
          return await this.executeFallback(tripData, pipelineResult.metadata?.failedAt || 'pipeline')
        } else {
          throw new Error('Pipeline failed and fallback disabled')
        }
      }

    } catch (error) {
      console.error(`❌ NewRecommendationEngine: Generation failed:`, error)
      
      if (this.options.fallbackEnabled) {
        return await this.executeFallback(tripData, 'error')
      } else {
        throw error
      }
    }
  }

  /**
   * Create the recommendation pipeline with all stages
   */
  createPipeline() {
    const builder = new PipelineBuilder()
      .withOptions({
        qualityThreshold: this.options.qualityThreshold,
        maxRecommendations: this.options.maxRecommendations,
        timeoutMs: 30000,
        retryAttempts: 2
      })

    // Stage 1: Reddit Data Collection
    if (this.options.enableRedditProcessing) {
      builder.addStage(new RedditDataStage())
    }

    // Stage 2: Content Parsing and Venue Extraction
    builder.addStage(new VenueExtractionStage())

    // Stage 3: Venue Enrichment
    if (this.options.enableEnrichment) {
      builder.addStage(new VenueEnrichmentStage())
    }

    // Stage 4: Quality Control and Filtering
    builder.addStage(new QualityControlStage(this.qualityController))

    // Stage 5: Recommendation Generation
    builder.addStage(new RecommendationGenerationStage())

    // Add fallback handlers
    builder
      .addFallback('RedditDataStage', this.fallbackManager.executeFallback.bind(this.fallbackManager))
      .addFallback('VenueExtractionStage', this.fallbackManager.executeFallback.bind(this.fallbackManager))
      .addFallback('VenueEnrichmentStage', this.fallbackManager.executeFallback.bind(this.fallbackManager))

    // Add quality checkers
    builder
      .addQualityCheck(QualityCheckers.duplicateCheck)
      .addQualityCheck(QualityCheckers.diversityCheck)
      .addQualityCheck(QualityCheckers.qualityDistributionCheck)

    return builder.build()
  }

  /**
   * Execute fallback strategy
   */
  async executeFallback(tripData, failedStage) {
    console.log(`🔄 NewRecommendationEngine: Executing fallback for stage: ${failedStage}`)
    
    const fallbackResult = await this.fallbackManager.executeFallback(tripData, failedStage)
    
    if (fallbackResult.venues.length > 0) {
      // Convert venues to recommendations
      const recommendations = fallbackResult.venues.map(venue => 
        new Recommendation(venue, {
          score: venue.confidenceScore,
          reasons: [`Fallback recommendation from ${fallbackResult.source}`],
          tags: ['fallback']
        })
      )

      return {
        success: true,
        data: recommendations,
        metadata: {
          source: 'fallback',
          fallbackLevel: fallbackResult.level,
          fallbackSource: fallbackResult.source,
          originalFailure: failedStage,
          ...fallbackResult.metadata
        }
      }
    } else {
      throw new Error('All fallback strategies failed')
    }
  }

  /**
   * Generate cache key for trip data
   */
  generateCacheKey(tripData) {
    const key = `new_engine_v1_${tripData.destination}_${(tripData.categories || []).sort().join('_')}_${tripData.startDate}_${tripData.endDate}`
    return key.toLowerCase().replace(/\s+/g, '_')
  }

  /**
   * Get pipeline metrics
   */
  getMetrics() {
    return this.pipeline.getMetrics()
  }

  /**
   * Reset all caches and metrics
   */
  reset() {
    this.cache.clear()
    this.pipeline.resetMetrics()
    this.qualityController.clearCache()
    console.log('🔄 NewRecommendationEngine: Reset completed')
  }
}

/**
 * Stage 1: Reddit Data Collection
 */
class RedditDataStage extends PipelineStage {
  constructor() {
    super('RedditDataStage', { timeout: 15000 })
  }

  async execute(tripData) {
    console.log(`🔍 RedditDataStage: Collecting Reddit data for ${tripData.destination}`)
    
    const destination = tripData.destination
    const preferences = tripData.categories || ['culture']
    
    // Generate search queries
    const queries = redditAPI.generateSearchQueries(destination, preferences)
    console.log(`📝 RedditDataStage: Generated ${queries.length} search queries`)
    
    const allPosts = []
    
    // Search Reddit for each query
    for (const query of queries.slice(0, 5)) { // Limit to 5 queries for performance
      try {
        const posts = await redditAPI.searchPosts(query, {
          limit: 10,
          sort: 'relevance',
          time: 'year'
        })
        allPosts.push(...posts)
      } catch (error) {
        console.warn(`⚠️ RedditDataStage: Query failed for "${query}":`, error)
      }
    }
    
    console.log(`✅ RedditDataStage: Collected ${allPosts.length} Reddit posts`)
    
    return {
      posts: allPosts,
      destination,
      preferences,
      metadata: {
        queriesUsed: queries.slice(0, 5),
        totalPosts: allPosts.length
      }
    }
  }
}

/**
 * Stage 2: Venue Extraction from Content
 */
class VenueExtractionStage extends PipelineStage {
  constructor() {
    super('VenueExtractionStage', { timeout: 10000 })
  }

  async execute(inputData) {
    // Handle both scenarios: redditData (with posts) or tripData (without posts)
    const hasRedditData = inputData.posts && Array.isArray(inputData.posts)
    
    if (!hasRedditData) {
      console.log(`🏗️ VenueExtractionStage: No Reddit data available, skipping venue extraction`)
      // Return empty result to trigger fallback
      throw new Error('No Reddit data available for venue extraction')
    }
    
    console.log(`🏗️ VenueExtractionStage: Extracting venues from ${inputData.posts.length} posts`)
    
    const venues = []
    const processedPosts = []
    
    // Parse each post
    for (const post of inputData.posts) {
      try {
        const parsedPost = contentParser.parsePost(post)
        processedPosts.push(parsedPost)
        
        // Extract venues from parsed content (now with confidence scores)
        for (const venueObj of parsedPost.venues) {
          // Handle both old string format and new object format
          const venueName = typeof venueObj === 'string' ? venueObj : venueObj.name
          const confidence = typeof venueObj === 'object' ? venueObj.confidence : 0.5
          const patternType = typeof venueObj === 'object' ? venueObj.type : 'unknown'
          
          const venue = new Venue({
            name: venueName,
            category: this.categorizeVenue(venueName),
            description: `Popular venue mentioned in Reddit discussions about ${inputData.destination}`
          })
          
          venue.addSource(DataSource.REDDIT, {
            postId: post.id,
            postTitle: post.title,
            postScore: post.score,
            subreddit: post.subreddit,
            confidence: confidence,
            patternType: patternType,
            context: venueObj.context || ''
          })
          
          // Set initial quality signals with confidence
          venue.qualitySignals.mentionFrequency = 1
          venue.qualitySignals.sentimentScore = parsedPost.sentiment
          venue.qualitySignals.passesNameValidation = true
          venue.qualitySignals.confidenceScore = confidence
          
          venues.push(venue)
        }
      } catch (error) {
        console.warn(`⚠️ VenueExtractionStage: Failed to parse post ${post.id}:`, error)
      }
    }
    
    // Aggregate venue mentions
    const aggregatedVenues = this.aggregateVenues(venues)
    
    console.log(`✅ VenueExtractionStage: Extracted ${aggregatedVenues.length} unique venues`)
    
    return {
      venues: aggregatedVenues,
      processedPosts,
      destination: inputData.destination,
      metadata: {
        originalVenueCount: venues.length,
        uniqueVenueCount: aggregatedVenues.length,
        postsProcessed: processedPosts.length
      }
    }
  }

  categorizeVenue(venueName) {
    const name = venueName.toLowerCase()
    
    if (name.includes('restaurant') || name.includes('cafe') || name.includes('bistro') || 
        name.includes('bar') && !name.includes('museum')) {
      return VenueCategory.DINING
    }
    
    if (name.includes('museum') || name.includes('gallery') || name.includes('temple') || 
        name.includes('church') || name.includes('cathedral') || name.includes('palace')) {
      return VenueCategory.CULTURE
    }
    
    if (name.includes('park') || name.includes('garden') || name.includes('beach') || 
        name.includes('nature') || name.includes('hiking')) {
      return VenueCategory.NATURE
    }
    
    if (name.includes('market') || name.includes('mall') || name.includes('shop')) {
      return VenueCategory.SHOPPING
    }
    
    if (name.includes('club') || name.includes('nightlife') || name.includes('bar')) {
      return VenueCategory.NIGHTLIFE
    }
    
    return VenueCategory.ATTRACTION
  }

  aggregateVenues(venues) {
    const venueMap = new Map()
    
    venues.forEach(venue => {
      const key = venue.name.toLowerCase().trim()
      
      if (venueMap.has(key)) {
        const existing = venueMap.get(key)
        existing.qualitySignals.mentionFrequency += 1
        
        // Merge sources
        venue.sources.forEach(source => existing.addSource(source.type, source.data))
        
        // Update sentiment (average)
        const currentSentiment = existing.qualitySignals.sentimentScore
        const newSentiment = venue.qualitySignals.sentimentScore
        existing.qualitySignals.sentimentScore = (currentSentiment + newSentiment) / 2
        
        // Update confidence score (take highest confidence)
        const currentConfidence = existing.qualitySignals.confidenceScore || 0
        const newConfidence = venue.qualitySignals.confidenceScore || 0
        existing.qualitySignals.confidenceScore = Math.max(currentConfidence, newConfidence)
        
      } else {
        venueMap.set(key, venue)
      }
    })
    
    // Update confidence scores
    venueMap.forEach(venue => venue.updateConfidenceScore())
    
    return Array.from(venueMap.values())
  }
}

/**
 * Stage 3: Venue Enrichment
 */
class VenueEnrichmentStage extends PipelineStage {
  constructor() {
    super('VenueEnrichmentStage', { timeout: 20000 })
  }

  async execute(extractionData) {
    console.log(`🔧 VenueEnrichmentStage: Enriching ${extractionData.venues.length} venues`)
    
    const enrichedVenues = []
    
    for (const venue of extractionData.venues) {
      try {
        // Enrich with external data
        const enrichmentData = await venueEnrichment.enrichVenue(
          venue.name, 
          extractionData.destination, 
          venue.category
        )
        
        // Update venue with enrichment data
        venue.enrichmentData = enrichmentData
        venue.description = enrichmentData.description || venue.description
        venue.shortDescription = enrichmentData.shortDescription || venue.shortDescription
        
        if (enrichmentData.coordinates) {
          venue.location = new Coordinates(enrichmentData.coordinates.lat, enrichmentData.coordinates.lng)
          venue.qualitySignals.hasRealLocation = true
        }
        
        if (enrichmentData.priceRange) {
          venue.priceRange = new PriceRange({
            description: enrichmentData.priceRange
          })
        }
        
        if (enrichmentData.rating) {
          venue.qualitySignals.hasUserRatings = true
        }
        
        venue.qualitySignals.hasValidBusinessInfo = !!(
          enrichmentData.address || 
          enrichmentData.phone || 
          enrichmentData.website
        )
        
        venue.updateConfidenceScore()
        enrichedVenues.push(venue)
        
      } catch (error) {
        console.warn(`⚠️ VenueEnrichmentStage: Failed to enrich ${venue.name}:`, error)
        // Keep venue even if enrichment fails
        enrichedVenues.push(venue)
      }
    }
    
    console.log(`✅ VenueEnrichmentStage: Enriched ${enrichedVenues.length} venues`)
    
    return {
      venues: enrichedVenues,
      destination: extractionData.destination,
      metadata: {
        enrichmentSuccessRate: (enrichedVenues.length / extractionData.venues.length) * 100
      }
    }
  }
}

/**
 * Stage 4: Quality Control
 */
class QualityControlStage extends PipelineStage {
  constructor(qualityController) {
    super('QualityControlStage', { timeout: 10000 })
    this.qualityController = qualityController
  }

  async execute(enrichmentData) {
    console.log(`🔍 QualityControlStage: Validating ${enrichmentData.venues.length} venues`)
    
    // Process venues through quality control
    const qualityResults = await this.qualityController.processBatch(enrichmentData.venues)
    
    // Filter by quality threshold
    const highQualityVenues = qualityResults.highQuality.concat(qualityResults.mediumQuality)
      .map(result => result.venue)
      .filter(venue => venue.confidenceScore >= this.qualityController.options.minConfidenceScore)
    
    console.log(`✅ QualityControlStage: ${highQualityVenues.length} venues passed quality control`)
    
    return {
      venues: highQualityVenues,
      qualityResults,
      destination: enrichmentData.destination,
      metadata: {
        originalCount: enrichmentData.venues.length,
        filteredCount: highQualityVenues.length,
        averageQualityScore: qualityResults.stats.averageScore,
        validationRate: qualityResults.stats.validationRate
      }
    }
  }
}

/**
 * Stage 5: Recommendation Generation
 */
class RecommendationGenerationStage extends PipelineStage {
  constructor() {
    super('RecommendationGenerationStage', { timeout: 5000 })
  }

  async execute(qualityData) {
    console.log(`🎯 RecommendationGenerationStage: Generating recommendations from ${qualityData.venues.length} venues`)
    
    const recommendations = qualityData.venues.map(venue => {
      const recommendation = new Recommendation(venue, {
        score: venue.confidenceScore,
        reasons: this.generateReasons(venue),
        tags: this.generateTags(venue)
      })
      
      // Add time slot preferences
      this.addTimeSlotPreferences(recommendation)
      
      return recommendation
    })
    
    // Sort by score
    recommendations.sort((a, b) => b.score - a.score)
    
    console.log(`✅ RecommendationGenerationStage: Generated ${recommendations.length} recommendations`)
    
    return recommendations
  }

  generateReasons(venue) {
    const reasons = []
    
    if (venue.qualitySignals.mentionFrequency > 3) {
      reasons.push(`Mentioned ${venue.qualitySignals.mentionFrequency} times in Reddit discussions`)
    }
    
    if (venue.qualitySignals.sentimentScore > 0.5) {
      reasons.push('Highly rated by travelers')
    }
    
    if (venue.qualitySignals.hasRealLocation) {
      reasons.push('Verified location')
    }
    
    if (venue.hasSource(DataSource.GOOGLE_PLACES)) {
      reasons.push('Verified business information')
    }
    
    return reasons
  }

  generateTags(venue) {
    const tags = [venue.category]
    
    if (venue.qualitySignals.mentionFrequency > 5) {
      tags.push('popular')
    }
    
    if (venue.qualitySignals.sentimentScore > 0.7) {
      tags.push('highly-rated')
    }
    
    if (venue.hasSource(DataSource.REDDIT)) {
      tags.push('reddit-recommended')
    }
    
    return tags
  }

  addTimeSlotPreferences(recommendation) {
    const category = recommendation.venue.category
    
    switch (category) {
      case VenueCategory.DINING:
        recommendation.addTimeSlot('afternoon').addTimeSlot('evening')
        break
      case VenueCategory.CULTURE:
        recommendation.addTimeSlot('morning').addTimeSlot('afternoon')
        break
      case VenueCategory.NATURE:
        recommendation.addTimeSlot('morning').addTimeSlot('afternoon')
        break
      case VenueCategory.NIGHTLIFE:
        recommendation.addTimeSlot('evening')
        break
      case VenueCategory.SHOPPING:
        recommendation.addTimeSlot('afternoon')
        break
      default:
        recommendation.addTimeSlot('morning').addTimeSlot('afternoon')
    }
  }
}

export default NewRecommendationEngine 