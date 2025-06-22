/**
 * Core data types and interfaces for the Travel+ recommendation system
 */

// Venue Categories
export const VenueCategory = {
  DINING: 'dining',
  CULTURE: 'culture',
  NATURE: 'nature',
  SHOPPING: 'shopping',
  NIGHTLIFE: 'nightlife',
  ACCOMMODATION: 'accommodation',
  TRANSPORTATION: 'transportation',
  WELLNESS: 'wellness',
  ATTRACTION: 'attraction'
}

// Data Sources
export const DataSource = {
  REDDIT: 'reddit',
  GOOGLE_PLACES: 'google_places',
  FOURSQUARE: 'foursquare',
  WIKIPEDIA: 'wikipedia',
  TRIPADVISOR: 'tripadvisor',
  YELP: 'yelp',
  OPENSTREETMAP: 'openstreetmap',
  FALLBACK: 'fallback',
  CURATED: 'curated'
}

// Quality Signal Types
export const QualitySignalType = {
  MENTION_FREQUENCY: 'mention_frequency',
  SENTIMENT_SCORE: 'sentiment_score',
  LOCATION_VERIFIED: 'location_verified',
  BUSINESS_INFO_COMPLETE: 'business_info_complete',
  NAME_VALIDATION_PASSED: 'name_validation_passed',
  CROSS_SOURCE_VERIFIED: 'cross_source_verified',
  USER_RATING_HIGH: 'user_rating_high',
  RECENT_ACTIVITY: 'recent_activity'
}

// Processing Status
export const ProcessingStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
}

/**
 * Core venue data structure
 */
export class Venue {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || ''
    this.category = data.category || VenueCategory.ATTRACTION
    this.confidenceScore = data.confidenceScore || 0
    this.sources = data.sources || []
    this.location = data.location || null
    this.priceRange = data.priceRange || null
    this.description = data.description || ''
    this.shortDescription = data.shortDescription || ''
    this.qualitySignals = new QualitySignals(data.qualitySignals)
    this.enrichmentData = data.enrichmentData || {}
    this.metadata = data.metadata || {}
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  generateId() {
    return `venue_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  updateConfidenceScore() {
    this.confidenceScore = this.qualitySignals.calculateOverallScore()
    this.updatedAt = new Date().toISOString()
    return this.confidenceScore
  }

  addSource(source, data = {}) {
    const existingIndex = this.sources.findIndex(s => s.type === source)
    const sourceData = {
      type: source,
      data: data,
      timestamp: new Date().toISOString()
    }

    if (existingIndex !== -1) {
      this.sources[existingIndex] = sourceData
    } else {
      this.sources.push(sourceData)
    }
    
    this.updatedAt = new Date().toISOString()
  }

  hasSource(source) {
    return this.sources.some(s => s.type === source)
  }

  getSourceData(source) {
    const sourceObj = this.sources.find(s => s.type === source)
    return sourceObj ? sourceObj.data : null
  }

  isHighQuality() {
    return this.confidenceScore >= 70
  }

  isMediumQuality() {
    return this.confidenceScore >= 40 && this.confidenceScore < 70
  }

  isLowQuality() {
    return this.confidenceScore < 40
  }
}

/**
 * Quality signals for venue validation
 */
export class QualitySignals {
  constructor(data = {}) {
    this.mentionFrequency = data.mentionFrequency || 0
    this.sentimentScore = data.sentimentScore || 0
    this.hasRealLocation = data.hasRealLocation || false
    this.hasValidBusinessInfo = data.hasValidBusinessInfo || false
    this.passesNameValidation = data.passesNameValidation || false
    this.crossSourceVerified = data.crossSourceVerified || false
    this.hasUserRatings = data.hasUserRatings || false
    this.hasRecentActivity = data.hasRecentActivity || false
    this.signals = data.signals || new Map()
  }

  addSignal(type, value, weight = 1.0) {
    this.signals.set(type, { value, weight, timestamp: new Date().toISOString() })
  }

  getSignal(type) {
    return this.signals.get(type)
  }

  calculateOverallScore() {
    let totalScore = 0
    let totalWeight = 0

    // Base signals with predefined weights
    const baseSignals = [
      { value: this.mentionFrequency, weight: 0.15, max: 10 },
      { value: this.sentimentScore, weight: 0.10, max: 1 },
      { value: this.hasRealLocation ? 1 : 0, weight: 0.20, max: 1 },
      { value: this.hasValidBusinessInfo ? 1 : 0, weight: 0.15, max: 1 },
      { value: this.passesNameValidation ? 1 : 0, weight: 0.15, max: 1 },
      { value: this.crossSourceVerified ? 1 : 0, weight: 0.10, max: 1 },
      { value: this.hasUserRatings ? 1 : 0, weight: 0.10, max: 1 },
      { value: this.hasRecentActivity ? 1 : 0, weight: 0.05, max: 1 }
    ]

    // Calculate base score
    baseSignals.forEach(signal => {
      const normalizedValue = Math.min(signal.value / signal.max, 1)
      totalScore += normalizedValue * signal.weight * 100
      totalWeight += signal.weight
    })

    // Add custom signals
    this.signals.forEach(signal => {
      totalScore += signal.value * signal.weight
      totalWeight += signal.weight
    })

    // Normalize to 0-100 scale
    return totalWeight > 0 ? Math.min(Math.max(totalScore, 0), 100) : 0
  }
}

/**
 * Coordinates data structure
 */
export class Coordinates {
  constructor(lat, lng) {
    this.lat = parseFloat(lat) || 0
    this.lng = parseFloat(lng) || 0
  }

  isValid() {
    return this.lat !== 0 && this.lng !== 0 && 
           this.lat >= -90 && this.lat <= 90 &&
           this.lng >= -180 && this.lng <= 180
  }

  distanceTo(other) {
    const R = 6371 // Earth's radius in km
    const dLat = (other.lat - this.lat) * Math.PI / 180
    const dLng = (other.lng - this.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.lat * Math.PI / 180) * Math.cos(other.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

/**
 * Price range data structure
 */
export class PriceRange {
  constructor(data = {}) {
    this.min = data.min || 0
    this.max = data.max || 0
    this.currency = data.currency || 'USD'
    this.level = data.level || 1 // 1-4 scale ($ to $$$$)
    this.description = data.description || ''
  }

  getDisplayString() {
    if (this.min && this.max) {
      return `${this.currency} ${this.min}-${this.max}`
    }
    return this.description || '$'.repeat(this.level)
  }
}

/**
 * Processing result for pipeline stages
 */
export class ProcessingResult {
  constructor(status = ProcessingStatus.PENDING) {
    this.status = status
    this.data = null
    this.errors = []
    this.warnings = []
    this.metadata = {}
    this.timestamp = new Date().toISOString()
    this.processingTime = 0
  }

  setSuccess(data, metadata = {}) {
    this.status = ProcessingStatus.COMPLETED
    this.data = data
    this.metadata = { ...this.metadata, ...metadata }
    return this
  }

  setError(error, metadata = {}) {
    this.status = ProcessingStatus.FAILED
    this.errors.push(error)
    this.metadata = { ...this.metadata, ...metadata }
    return this
  }

  addWarning(warning) {
    this.warnings.push(warning)
    return this
  }

  setProcessingTime(startTime) {
    this.processingTime = Date.now() - startTime
    return this
  }

  isSuccess() {
    return this.status === ProcessingStatus.COMPLETED
  }

  isFailed() {
    return this.status === ProcessingStatus.FAILED
  }
}

/**
 * Pipeline stage interface
 */
export class PipelineStage {
  constructor(name, options = {}) {
    this.name = name
    this.options = options
    this.metrics = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      averageProcessingTime: 0
    }
  }

  async process(input) {
    const startTime = Date.now()
    const result = new ProcessingResult()
    
    try {
      console.log(`🔄 ${this.name}: Starting processing...`)
      
      const output = await this.execute(input)
      result.setSuccess(output)
      
      this.updateMetrics(true, Date.now() - startTime)
      console.log(`✅ ${this.name}: Processing completed successfully`)
      
    } catch (error) {
      result.setError(error.message)
      this.updateMetrics(false, Date.now() - startTime)
      console.error(`❌ ${this.name}: Processing failed:`, error)
    }
    
    result.setProcessingTime(startTime)
    return result
  }

  async execute(input) {
    throw new Error(`${this.name}: execute() method must be implemented`)
  }

  updateMetrics(success, processingTime) {
    this.metrics.totalProcessed++
    if (success) {
      this.metrics.successCount++
    } else {
      this.metrics.errorCount++
    }
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) + processingTime
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalProcessed
  }

  getSuccessRate() {
    return this.metrics.totalProcessed > 0 
      ? (this.metrics.successCount / this.metrics.totalProcessed) * 100 
      : 0
  }
}

/**
 * Recommendation data structure
 */
export class Recommendation {
  constructor(venue, metadata = {}) {
    this.venue = venue instanceof Venue ? venue : new Venue(venue)
    this.score = metadata.score || venue.confidenceScore || 0
    this.reasons = metadata.reasons || []
    this.timeSlots = metadata.timeSlots || []
    this.estimatedDuration = metadata.estimatedDuration || null
    this.bestTimeToVisit = metadata.bestTimeToVisit || null
    this.tags = metadata.tags || []
    this.alternatives = metadata.alternatives || []
    this.createdAt = new Date().toISOString()
  }

  addReason(reason) {
    this.reasons.push(reason)
    return this
  }

  addTimeSlot(timeSlot) {
    if (!this.timeSlots.includes(timeSlot)) {
      this.timeSlots.push(timeSlot)
    }
    return this
  }

  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
    }
    return this
  }

  isValidForTimeSlot(timeSlot) {
    return this.timeSlots.length === 0 || this.timeSlots.includes(timeSlot)
  }
}

// Export validation utilities
export const ValidationUtils = {
  isValidVenueName(name) {
    if (!name || typeof name !== 'string') return false
    if (name.length < 2 || name.length > 100) return false
    if (!/^[A-Za-z]/.test(name)) return false
    return true
  },

  isValidCategory(category) {
    return Object.values(VenueCategory).includes(category)
  },

  isValidCoordinates(coords) {
    return coords instanceof Coordinates && coords.isValid()
  },

  isValidConfidenceScore(score) {
    return typeof score === 'number' && score >= 0 && score <= 100
  }
} 