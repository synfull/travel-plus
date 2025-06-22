import { Venue, QualitySignals, QualitySignalType, ValidationUtils, VenueCategory } from '../types/index.js'

/**
 * Quality control system for venue validation and scoring
 */
export class QualityController {
  constructor(options = {}) {
    this.options = {
      minConfidenceScore: options.minConfidenceScore || 40,
      strictMode: options.strictMode || false,
      enableCaching: options.enableCaching || true,
      ...options
    }
    
    this.validators = new Map()
    this.scorers = new Map()
    this.cache = new Map()
    
    this.initializeDefaultValidators()
    this.initializeDefaultScorers()
  }

  /**
   * Initialize default validation rules
   */
  initializeDefaultValidators() {
    // Name validation
    this.addValidator('name', (venue) => {
      const name = venue.name
      if (!ValidationUtils.isValidVenueName(name)) {
        return { valid: false, reason: 'Invalid venue name format' }
      }
      
      // Check for obvious non-venue patterns
      const invalidPatterns = [
        /^(Do|He|She|I|We|They|You|It|This|That|These|Those|There|Here|When|Where|What|Why|How|Who)\b/i,
        /\b(comment|comments|information|confirmed|pregnancy|transplant|descent|motorcycle|story|fake|time|living|went|been|stuck|adds|credit|stuff|trip|having|event|discussed|wished|knew|booked|seen|only|most|city|our|from|when|where|what|why|how|who|goes|never|around|better|see|likely|break|up|down|over|under|through|across|between|among|within|without|inside|outside|left|right)\b/i,
        /^(Period Has Now Ended|The Key Specs|Basic Troubleshooting|Create Token Lineup|The Tv Guide Is Based|Tv Addons|Darcy Lapier|Gaber Is Interested|Njpw Dojo|Tna Tapings|Lesnar Made|Chinese Reddit|Sol This Year|Also Reports Of Objects|Posted This|Raf Brize Norton|Emptying The House|Columbia Engineering|Common App|Animal Reaction|Mark Jindrak|Antonio Inoki|Luigi Mangione Appears|Congressional District|Republican Town Hall|Monster Hunter Wilds|The Addition Of Liger|Spy Hunter)$/i
      ]
      
      if (invalidPatterns.some(pattern => pattern.test(name))) {
        return { valid: false, reason: 'Name matches invalid pattern' }
      }
      
      return { valid: true }
    })

    // Category validation
    this.addValidator('category', (venue) => {
      if (!ValidationUtils.isValidCategory(venue.category)) {
        return { valid: false, reason: 'Invalid venue category' }
      }
      return { valid: true }
    })

    // Location validation
    this.addValidator('location', (venue) => {
      if (venue.location && !ValidationUtils.isValidCoordinates(venue.location)) {
        return { valid: false, reason: 'Invalid coordinates' }
      }
      return { valid: true }
    })

    // Business name pattern validation
    this.addValidator('businessPattern', (venue) => {
      const name = venue.name
      
      // Must look like a business name
      const businessPatterns = [
        /^[A-Z][a-zA-Z\s'&-]+\s+(Restaurant|Restaurante|Steakhouse|Grill|Bar|Cafe|Café|Cantina|Taqueria|Pizzeria|Bistro|Kitchen|House|Raw\s+Bar)$/i,
        /^[A-Z][a-zA-Z\s'&-]+\s+(Hotel|Resort|Lodge|Inn|Hostel|Casa|Hacienda|Rancho)$/i,
        /^[A-Z][a-zA-Z\s'&-]+\s+(Museum|Museo|Gallery|Galeria|Theater|Theatre|Cinema|Library|Biblioteca|Temple|Templo|Church|Iglesia|Cathedral|Catedral|Palace|Palacio|Centro|Plaza)$/i,
        /^[A-Z][a-zA-Z\s'&-]+\s+(Beach|Playa|Cenote|Laguna|Reserve|Reserva|Garden|Jardin|Park|Parque|Zone|Zona)$/i,
        /^[A-Z][a-zA-Z\s'&-]+\s+(Market|Mall|Store|Shop|Tienda|Mercado|Plaza)$/i,
        /^[A-Z][a-zA-Z]+[''][sS]\s+[A-Z][a-zA-Z\s]+$/,
        /^(Las|Los|La|El|San|Santa|Santo|Nuestra|Señora)\s+[A-Z][a-zA-Z\s]+$/i,
        /^[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*$/
      ]
      
      // Allow some flexibility in strict mode
      if (this.options.strictMode) {
        if (!businessPatterns.some(pattern => pattern.test(name))) {
          return { valid: false, reason: 'Name does not match business patterns' }
        }
      }
      
      return { valid: true }
    })

    // Source validation
    this.addValidator('sources', (venue) => {
      if (!venue.sources || venue.sources.length === 0) {
        return { valid: false, reason: 'No data sources' }
      }
      return { valid: true }
    })
  }

  /**
   * Initialize default scoring mechanisms
   */
  initializeDefaultScorers() {
    // Mention frequency scorer
    this.addScorer('mentionFrequency', (venue) => {
      const frequency = venue.qualitySignals.mentionFrequency || 0
      return Math.min(frequency * 10, 30) // Max 30 points
    })

    // Sentiment scorer
    this.addScorer('sentiment', (venue) => {
      const sentiment = venue.qualitySignals.sentimentScore || 0
      return Math.max(0, sentiment * 20) // Max 20 points for positive sentiment
    })

    // Location verification scorer
    this.addScorer('location', (venue) => {
      if (venue.qualitySignals.hasRealLocation) {
        return 25 // High value for verified location
      }
      return 0
    })

    // Business info completeness scorer
    this.addScorer('businessInfo', (venue) => {
      if (venue.qualitySignals.hasValidBusinessInfo) {
        return 15
      }
      return 0
    })

    // Cross-source verification scorer
    this.addScorer('crossSource', (venue) => {
      if (venue.qualitySignals.crossSourceVerified) {
        return 10
      }
      return 0
    })
  }

  /**
   * Add a custom validator
   */
  addValidator(name, validatorFn) {
    this.validators.set(name, validatorFn)
    console.log(`🔍 QualityController: Added validator "${name}"`)
  }

  /**
   * Add a custom scorer
   */
  addScorer(name, scorerFn) {
    this.scorers.set(name, scorerFn)
    console.log(`📊 QualityController: Added scorer "${name}"`)
  }

  /**
   * Validate a single venue
   */
  async validateVenue(venue) {
    if (!(venue instanceof Venue)) {
      venue = new Venue(venue)
    }

    const cacheKey = `validate_${venue.id}`
    if (this.options.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const results = {
      valid: true,
      errors: [],
      warnings: [],
      validationResults: new Map()
    }

    // Run all validators
    for (const [name, validator] of this.validators) {
      try {
        const result = await validator(venue)
        results.validationResults.set(name, result)
        
        if (!result.valid) {
          results.valid = false
          results.errors.push(`${name}: ${result.reason}`)
        } else if (result.warning) {
          results.warnings.push(`${name}: ${result.warning}`)
        }
      } catch (error) {
        results.warnings.push(`${name}: Validation error - ${error.message}`)
      }
    }

    if (this.options.enableCaching) {
      this.cache.set(cacheKey, results)
    }

    return results
  }

  /**
   * Calculate quality score for a venue
   */
  async calculateQualityScore(venue) {
    if (!(venue instanceof Venue)) {
      venue = new Venue(venue)
    }

    const cacheKey = `score_${venue.id}`
    if (this.options.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    let totalScore = 0
    const scoreBreakdown = new Map()

    // Run all scorers
    for (const [name, scorer] of this.scorers) {
      try {
        const score = await scorer(venue)
        scoreBreakdown.set(name, score)
        totalScore += score
      } catch (error) {
        console.warn(`⚠️ QualityController: Scorer "${name}" failed:`, error)
        scoreBreakdown.set(name, 0)
      }
    }

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(Math.max(totalScore, 0), 100)

    const result = {
      score: normalizedScore,
      breakdown: Object.fromEntries(scoreBreakdown),
      isHighQuality: normalizedScore >= 70,
      isMediumQuality: normalizedScore >= 40 && normalizedScore < 70,
      isLowQuality: normalizedScore < 40
    }

    if (this.options.enableCaching) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * Process and validate a batch of venues
   */
  async processBatch(venues) {
    console.log(`🔄 QualityController: Processing batch of ${venues.length} venues`)
    
    const results = {
      processed: [],
      valid: [],
      invalid: [],
      highQuality: [],
      mediumQuality: [],
      lowQuality: [],
      stats: {
        total: venues.length,
        validCount: 0,
        invalidCount: 0,
        averageScore: 0
      }
    }

    let totalScore = 0

    for (const venue of venues) {
      try {
        // Validate venue
        const validation = await this.validateVenue(venue)
        
        // Calculate quality score
        const scoring = await this.calculateQualityScore(venue)
        
        // Update venue with quality data
        if (venue instanceof Venue) {
          venue.confidenceScore = scoring.score
          venue.qualitySignals.passesNameValidation = validation.valid
        }

        const processedVenue = {
          venue,
          validation,
          scoring,
          isValid: validation.valid,
          qualityScore: scoring.score
        }

        results.processed.push(processedVenue)
        totalScore += scoring.score

        // Categorize by validation
        if (validation.valid) {
          results.valid.push(processedVenue)
          results.stats.validCount++
        } else {
          results.invalid.push(processedVenue)
          results.stats.invalidCount++
        }

        // Categorize by quality
        if (scoring.isHighQuality) {
          results.highQuality.push(processedVenue)
        } else if (scoring.isMediumQuality) {
          results.mediumQuality.push(processedVenue)
        } else {
          results.lowQuality.push(processedVenue)
        }

      } catch (error) {
        console.error(`❌ QualityController: Failed to process venue:`, error)
        results.invalid.push({
          venue,
          validation: { valid: false, errors: [error.message] },
          scoring: { score: 0 },
          isValid: false,
          qualityScore: 0
        })
        results.stats.invalidCount++
      }
    }

    results.stats.averageScore = venues.length > 0 ? totalScore / venues.length : 0
    results.stats.validationRate = (results.stats.validCount / venues.length) * 100

    console.log(`✅ QualityController: Processed ${venues.length} venues`)
    console.log(`📊 QualityController: ${results.stats.validCount} valid, ${results.stats.invalidCount} invalid`)
    console.log(`📊 QualityController: Average quality score: ${results.stats.averageScore.toFixed(1)}`)

    return results
  }

  /**
   * Filter venues by quality threshold
   */
  filterByQuality(venues, threshold = null) {
    const qualityThreshold = threshold || this.options.minConfidenceScore
    
    const filtered = venues.filter(venue => {
      if (venue instanceof Venue) {
        return venue.confidenceScore >= qualityThreshold
      }
      
      if (venue.venue instanceof Venue) {
        return venue.venue.confidenceScore >= qualityThreshold
      }
      
      if (typeof venue.qualityScore === 'number') {
        return venue.qualityScore >= qualityThreshold
      }
      
      return false
    })

    console.log(`🎯 QualityController: Filtered ${venues.length} venues to ${filtered.length} high-quality venues (threshold: ${qualityThreshold})`)
    
    return filtered
  }

  /**
   * Get quality statistics for a set of venues
   */
  getQualityStats(venues) {
    const stats = {
      total: venues.length,
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      averageScore: 0,
      scoreDistribution: {
        '90-100': 0,
        '80-89': 0,
        '70-79': 0,
        '60-69': 0,
        '50-59': 0,
        '40-49': 0,
        '30-39': 0,
        '20-29': 0,
        '10-19': 0,
        '0-9': 0
      }
    }

    let totalScore = 0

    venues.forEach(venue => {
      let score = 0
      
      if (venue instanceof Venue) {
        score = venue.confidenceScore
      } else if (venue.venue instanceof Venue) {
        score = venue.venue.confidenceScore
      } else if (typeof venue.qualityScore === 'number') {
        score = venue.qualityScore
      }

      totalScore += score

      // Quality categories
      if (score >= 70) stats.highQuality++
      else if (score >= 40) stats.mediumQuality++
      else stats.lowQuality++

      // Score distribution
      const bucket = Math.floor(score / 10) * 10
      const key = `${bucket}-${bucket + 9}`
      if (stats.scoreDistribution[key] !== undefined) {
        stats.scoreDistribution[key]++
      }
    })

    stats.averageScore = venues.length > 0 ? totalScore / venues.length : 0

    return stats
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.cache.clear()
    console.log('🗑️ QualityController: Cache cleared')
  }
}

/**
 * Built-in quality checker functions for pipeline
 */
export const QualityCheckers = {
  /**
   * Check for duplicate venues
   */
  duplicateCheck: (venues) => {
    const names = new Set()
    const duplicates = []
    
    venues.forEach(venue => {
      const name = venue.name || venue.venue?.name
      if (name) {
        if (names.has(name.toLowerCase())) {
          duplicates.push(name)
        } else {
          names.add(name.toLowerCase())
        }
      }
    })
    
    return {
      passed: duplicates.length === 0,
      duplicates,
      message: duplicates.length > 0 ? `Found ${duplicates.length} duplicate venues` : 'No duplicates found'
    }
  },

  /**
   * Check venue diversity across categories
   */
  diversityCheck: (venues) => {
    const categories = new Map()
    
    venues.forEach(venue => {
      const category = venue.category || venue.venue?.category
      if (category) {
        categories.set(category, (categories.get(category) || 0) + 1)
      }
    })
    
    const categoryCount = categories.size
    const expectedMinCategories = Math.min(3, Object.keys(VenueCategory).length)
    
    return {
      passed: categoryCount >= expectedMinCategories,
      categoryCount,
      categories: Object.fromEntries(categories),
      message: `Found ${categoryCount} different venue categories`
    }
  },

  /**
   * Check overall quality score distribution
   */
  qualityDistributionCheck: (venues) => {
    const qualityController = new QualityController()
    const stats = qualityController.getQualityStats(venues)
    
    const highQualityPercentage = (stats.highQuality / stats.total) * 100
    const minHighQualityPercentage = 30 // At least 30% should be high quality
    
    return {
      passed: highQualityPercentage >= minHighQualityPercentage,
      stats,
      highQualityPercentage,
      message: `${highQualityPercentage.toFixed(1)}% of venues are high quality`
    }
  }
}

export default QualityController 