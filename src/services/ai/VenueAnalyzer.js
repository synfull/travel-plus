/**
 * AI-Powered Venue Analyzer
 * Phase 3: Advanced semantic analysis and intelligent venue validation
 */

import { VenueCategory, Venue, QualitySignals } from '../types/index.js'

export class VenueAnalyzer {
  constructor(options = {}) {
    this.options = {
      confidenceThreshold: 0.6,
      semanticAnalysisDepth: 'deep',
      enableContextualScoring: true,
      enableBusinessValidation: true,
      ...options
    }

    // Initialize AI models and patterns
    this.initializeSemanticPatterns()
    this.initializeBusinessPatterns()
    this.initializeCategoryClassifiers()
    
    console.log('🧠 VenueAnalyzer: AI analysis engine initialized')
  }

  /**
   * Main analysis method - processes venues through multiple AI stages
   */
  async analyzeVenues(venues, context = {}) {
    console.log(`🔍 VenueAnalyzer: Analyzing ${venues.length} venues with AI`)
    
    const results = []
    const startTime = Date.now()

    for (const venue of venues) {
      try {
        const analysis = await this.performDeepAnalysis(venue, context)
        if (analysis.confidence >= this.options.confidenceThreshold) {
          results.push(analysis)
        }
      } catch (error) {
        console.warn(`⚠️ VenueAnalyzer: Failed to analyze venue "${venue.name}":`, error.message)
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ VenueAnalyzer: Analyzed ${results.length}/${venues.length} venues in ${processingTime}ms`)
    
    return this.rankVenues(results)
  }

  /**
   * Deep AI analysis of individual venue
   */
  async performDeepAnalysis(venue, context) {
    const analysis = {
      venue: venue,
      confidence: 0,
      aiScore: 0,
      businessValidation: {},
      semanticAnalysis: {},
      categoryPrediction: {},
      qualitySignals: new QualitySignals(),
      recommendations: []
    }

    // Stage 1: Semantic Analysis
    analysis.semanticAnalysis = await this.performSemanticAnalysis(venue, context)
    
    // Stage 2: Business Validation
    analysis.businessValidation = await this.validateBusinessEntity(venue, context)
    
    // Stage 3: Category Classification
    analysis.categoryPrediction = await this.classifyVenueCategory(venue, context)
    
    // Stage 4: Quality Signal Extraction
    analysis.qualitySignals = await this.extractQualitySignals(venue, context)
    
    // Stage 5: Confidence Scoring
    analysis.confidence = this.calculateAIConfidence(analysis)
    analysis.aiScore = this.calculateAIScore(analysis)

    // Stage 6: Generate Recommendations
    analysis.recommendations = this.generateImprovementRecommendations(analysis)

    return analysis
  }

  /**
   * Advanced semantic analysis using NLP techniques
   */
  async performSemanticAnalysis(venue, context) {
    const analysis = {
      nameQuality: 0,
      contextRelevance: 0,
      semanticCoherence: 0,
      languagePatterns: {},
      entityRecognition: {},
      sentimentAnalysis: {}
    }

    // Name Quality Analysis
    analysis.nameQuality = this.analyzeNameQuality(venue.name)
    
    // Context Relevance (how well venue fits the destination/preferences)
    analysis.contextRelevance = this.analyzeContextRelevance(venue, context)
    
    // Semantic Coherence (does the venue description make sense?)
    analysis.semanticCoherence = this.analyzeSemanticCoherence(venue)
    
    // Language Pattern Recognition
    analysis.languagePatterns = this.recognizeLanguagePatterns(venue.name)
    
    // Named Entity Recognition
    analysis.entityRecognition = this.performEntityRecognition(venue)
    
    // Sentiment Analysis on descriptions/reviews
    analysis.sentimentAnalysis = this.analyzeSentiment(venue)

    return analysis
  }

  /**
   * Business entity validation using multiple signals
   */
  async validateBusinessEntity(venue, context) {
    const validation = {
      isLegitimateEntity: false,
      businessType: 'unknown',
      operationalStatus: 'unknown',
      locationVerification: {},
      onlinePresence: {},
      reviewSignals: {},
      confidence: 0
    }

    // Check if venue name follows business naming conventions
    validation.isLegitimateEntity = this.validateBusinessNaming(venue.name)
    
    // Classify type of business
    validation.businessType = this.classifyBusinessType(venue)
    
    // Verify location makes sense for destination
    validation.locationVerification = this.verifyLocationLogic(venue, context)
    
    // Check for online presence indicators
    validation.onlinePresence = this.analyzeOnlinePresenceSignals(venue)
    
    // Analyze review patterns and authenticity
    validation.reviewSignals = this.analyzeReviewAuthenticity(venue)
    
    validation.confidence = this.calculateValidationConfidence(validation)

    return validation
  }

  /**
   * AI-powered venue category classification
   */
  async classifyVenueCategory(venue, context) {
    const classification = {
      primaryCategory: VenueCategory.ATTRACTION,
      secondaryCategories: [],
      confidence: 0,
      reasoning: [],
      categoryScores: {}
    }

    // Calculate scores for each category using multiple signals
    for (const category of Object.values(VenueCategory)) {
      classification.categoryScores[category] = this.calculateCategoryScore(venue, category)
    }

    // Find primary category (highest score)
    const sortedCategories = Object.entries(classification.categoryScores)
      .sort(([,a], [,b]) => b - a)
    
    classification.primaryCategory = sortedCategories[0][0]
    classification.confidence = sortedCategories[0][1]
    
    // Add secondary categories (scores > 0.3)
    classification.secondaryCategories = sortedCategories
      .slice(1)
      .filter(([,score]) => score > 0.3)
      .map(([category]) => category)

    // Generate reasoning
    classification.reasoning = this.generateCategoryReasoning(venue, classification)

    return classification
  }

  /**
   * Extract quality signals using AI
   */
  async extractQualitySignals(venue, context) {
    const signals = new QualitySignals()

    // Standard quality signals expected by QualitySignals class
    signals.mentionFrequency = this.calculateMentionFrequency(venue, context) * 10 // Scale to 0-10
    signals.sentimentScore = this.analyzeSocialProofSignals(venue) // 0-1 scale
    signals.hasRealLocation = venue.location && venue.location.isValid && venue.location.isValid()
    signals.hasValidBusinessInfo = this.assessBusinessLegitimacy(venue) > 0.5
    signals.passesNameValidation = this.validateBusinessNaming(venue.name)
    signals.crossSourceVerified = venue.sources && venue.sources.length > 1
    signals.hasUserRatings = venue.rating && venue.rating > 0
    signals.hasRecentActivity = this.assessOperationalStatus(venue) > 0.5
    
    // Add custom signals using the signals Map
    signals.addSignal('reviewQuality', this.analyzeReviewQuality(venue), 0.1)
    signals.addSignal('contentRichness', this.analyzeContentRichness(venue), 0.1)
    signals.addSignal('locationRelevance', this.analyzeLocationRelevance(venue, context), 0.15)
    signals.addSignal('accessibilityScore', this.calculateAccessibilityScore(venue), 0.05)

    return signals
  }

  /**
   * Calculate AI confidence score
   */
  calculateAIConfidence(analysis) {
    const weights = {
      semanticAnalysis: 0.3,
      businessValidation: 0.3,
      categoryPrediction: 0.2,
      qualitySignals: 0.2
    }

    let confidence = 0
    confidence += (analysis.semanticAnalysis.nameQuality || 0) * weights.semanticAnalysis
    confidence += (analysis.businessValidation.confidence || 0) * weights.businessValidation
    confidence += (analysis.categoryPrediction.confidence || 0) * weights.categoryPrediction
    confidence += (analysis.qualitySignals.calculateOverallScore() / 100) * weights.qualitySignals

    return Math.min(1.0, Math.max(0.0, confidence))
  }

  /**
   * Calculate overall AI score
   */
  calculateAIScore(analysis) {
    const baseScore = analysis.confidence * 100
    
    // Bonus points for high-quality signals
    let bonus = 0
    if (analysis.businessValidation.isLegitimateEntity) bonus += 10
    if (analysis.semanticAnalysis.contextRelevance > 0.8) bonus += 5
    if (analysis.qualitySignals.sentimentScore > 0.7) bonus += 5

    return Math.min(100, baseScore + bonus)
  }

  /**
   * Rank venues by AI score and quality
   */
  rankVenues(analyses) {
    return analyses
      .sort((a, b) => {
        // Primary: AI Score
        if (b.aiScore !== a.aiScore) return b.aiScore - a.aiScore
        
        // Secondary: Confidence
        if (b.confidence !== a.confidence) return b.confidence - a.confidence
        
        // Tertiary: Quality Signals
        return b.qualitySignals.calculateOverallScore() - a.qualitySignals.calculateOverallScore()
      })
      .map((analysis, index) => ({
        ...analysis,
        rank: index + 1,
        tier: this.calculateVenueTier(analysis, index)
      }))
  }

  // ==================== SEMANTIC ANALYSIS METHODS ====================

  analyzeNameQuality(name) {
    if (!name || typeof name !== 'string') return 0

    let score = 0.5 // Base score

    // Proper capitalization (+0.2)
    if (/^[A-Z]/.test(name) && /[a-z]/.test(name)) score += 0.2

    // Reasonable length (+0.1)
    if (name.length >= 3 && name.length <= 50) score += 0.1

    // Contains business indicators (+0.1)
    if (this.businessIndicators.some(indicator => 
      name.toLowerCase().includes(indicator.toLowerCase())
    )) score += 0.1

    // No obvious garbage patterns (+0.1)
    if (!this.garbagePatterns.some(pattern => pattern.test(name))) score += 0.1

    return Math.min(1.0, score)
  }

  analyzeContextRelevance(venue, context) {
    let relevance = 0.5 // Base relevance

    // Check destination match
    if (context.destination && venue.name) {
      const destinationWords = context.destination.toLowerCase().split(/[\s,]+/)
      const venueWords = venue.name.toLowerCase().split(/[\s,]+/)
      
      const matches = destinationWords.filter(word => 
        venueWords.some(vWord => vWord.includes(word) || word.includes(vWord))
      )
      
      if (matches.length > 0) relevance += 0.2
    }

    // Check category preference match
    if (context.preferences && venue.category) {
      const prefWords = context.preferences.join(' ').toLowerCase()
      const categoryWords = venue.category.toLowerCase()
      
      if (prefWords.includes(categoryWords) || categoryWords.includes(prefWords)) {
        relevance += 0.3
      }
    }

    return Math.min(1.0, relevance)
  }

  analyzeSemanticCoherence(venue) {
    // Check if venue name and description are coherent
    let coherence = 0.7 // Base coherence

    if (venue.description && venue.name) {
      const nameWords = venue.name.toLowerCase().split(/\s+/)
      const descWords = venue.description.toLowerCase().split(/\s+/)
      
      // Check for word overlap
      const overlap = nameWords.filter(word => 
        descWords.some(dWord => dWord.includes(word) || word.includes(dWord))
      )
      
      if (overlap.length > 0) coherence += 0.2
      if (overlap.length > 2) coherence += 0.1
    }

    return Math.min(1.0, coherence)
  }

  // ==================== BUSINESS VALIDATION METHODS ====================

  validateBusinessNaming(name) {
    if (!name) return false

    // Check for business naming patterns
    const businessPatterns = [
      /^[A-Z][a-zA-Z\s&'-]+$/,  // Proper business name format
      /\b(Restaurant|Cafe|Hotel|Museum|Gallery|Bar|Club|Store|Shop)\b/i,
      /\b(The\s+[A-Z][a-zA-Z\s]+|[A-Z][a-zA-Z\s]+\s+&\s+[A-Z][a-zA-Z\s]+)\b/
    ]

    return businessPatterns.some(pattern => pattern.test(name))
  }

  classifyBusinessType(venue) {
    const types = {
      restaurant: ['restaurant', 'cafe', 'bistro', 'kitchen', 'grill', 'bar'],
      accommodation: ['hotel', 'inn', 'lodge', 'resort', 'hostel'],
      cultural: ['museum', 'gallery', 'theater', 'centre', 'center'],
      retail: ['shop', 'store', 'market', 'mall', 'boutique'],
      entertainment: ['club', 'lounge', 'cinema', 'arcade']
    }

    const name = venue.name?.toLowerCase() || ''
    
    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return type
      }
    }

    return 'unknown'
  }

  // ==================== INITIALIZATION METHODS ====================

  initializeSemanticPatterns() {
    this.businessIndicators = [
      'Restaurant', 'Cafe', 'Hotel', 'Museum', 'Gallery', 'Bar', 'Club',
      'Store', 'Shop', 'Market', 'Center', 'Centre', 'House', 'Kitchen',
      'Bistro', 'Grill', 'Lounge', 'Inn', 'Lodge', 'Resort'
    ]

    this.garbagePatterns = [
      /^(the|a|an|and|or|but|in|on|at|to|for|of|with|by)$/i,
      /^\d+$/,
      /^[a-z\s]+$/,
      /\b(re-doing|also|kids|doing|currently|due to)\b/i
    ]
  }

  initializeBusinessPatterns() {
    this.businessNamePatterns = [
      /^[A-Z][a-zA-Z\s&'-]*[a-zA-Z]$/,
      /\b(Restaurant|Cafe|Hotel|Museum)\b/i,
      /^The\s+[A-Z][a-zA-Z\s]+$/
    ]
  }

  initializeCategoryClassifiers() {
    this.categoryKeywords = {
      [VenueCategory.DINING]: ['restaurant', 'cafe', 'bistro', 'kitchen', 'grill', 'bar', 'food'],
      [VenueCategory.CULTURE]: ['museum', 'gallery', 'theater', 'cultural', 'art', 'history'],
      [VenueCategory.NATURE]: ['park', 'garden', 'beach', 'forest', 'mountain', 'lake'],
      [VenueCategory.SHOPPING]: ['shop', 'store', 'market', 'mall', 'boutique'],
      [VenueCategory.NIGHTLIFE]: ['club', 'bar', 'lounge', 'pub', 'nightclub'],
      [VenueCategory.ATTRACTION]: ['attraction', 'landmark', 'monument', 'site', 'tower']
    }
  }

  // ==================== HELPER METHODS ====================

  calculateCategoryScore(venue, category) {
    const keywords = this.categoryKeywords[category] || []
    const name = venue.name?.toLowerCase() || ''
    const description = venue.description?.toLowerCase() || ''
    
    let score = 0
    keywords.forEach(keyword => {
      if (name.includes(keyword)) score += 0.3
      if (description.includes(keyword)) score += 0.2
    })

    return Math.min(1.0, score)
  }

  calculateVenueTier(analysis, rank) {
    if (analysis.aiScore >= 90 && rank < 5) return 'premium'
    if (analysis.aiScore >= 75 && rank < 10) return 'excellent'
    if (analysis.aiScore >= 60 && rank < 20) return 'good'
    return 'standard'
  }

  generateCategoryReasoning(venue, classification) {
    const reasons = []
    const name = venue.name?.toLowerCase() || ''
    
    // Add reasoning based on keywords found
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => name.includes(keyword))
      if (matches.length > 0 && category === classification.primaryCategory) {
        reasons.push(`Contains ${category} keywords: ${matches.join(', ')}`)
      }
    }

    return reasons
  }

  generateImprovementRecommendations(analysis) {
    const recommendations = []

    if (analysis.confidence < 0.7) {
      recommendations.push('Consider additional validation sources')
    }

    if (analysis.semanticAnalysis.nameQuality < 0.6) {
      recommendations.push('Venue name may need verification')
    }

    if (analysis.businessValidation.confidence < 0.5) {
      recommendations.push('Business legitimacy requires verification')
    }

    return recommendations
  }

  // Placeholder methods for complex analysis (to be implemented)
  recognizeLanguagePatterns(name) { return {} }
  performEntityRecognition(venue) { return {} }
  analyzeSentiment(venue) { return { score: 0, confidence: 0 } }
  verifyLocationLogic(venue, context) { return { isValid: true } }
  analyzeOnlinePresenceSignals(venue) { return {} }
  analyzeReviewAuthenticity(venue) { return {} }
  calculateValidationConfidence(validation) { return 0.7 }
  calculateMentionFrequency(venue, context) { return 0.5 }
  analyzeSocialProofSignals(venue) { return 0.5 }
  analyzeReviewQuality(venue) { return 0.5 }
  analyzeContentRichness(venue) { return 0.5 }
  analyzeLocationRelevance(venue, context) { return 0.5 }
  calculateAccessibilityScore(venue) { return 0.5 }
  assessBusinessLegitimacy(venue) { return 0.5 }
  assessOperationalStatus(venue) { return 0.5 }
} 