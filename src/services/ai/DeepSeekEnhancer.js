/**
 * DeepSeek Enhancement Service
 * Phase 3.5A: Safe AI enhancement that only improves existing venues
 * 
 * SAFETY PRINCIPLES:
 * - Never discovers new venues (only enhances existing ones)
 * - Always falls back gracefully on API failures
 * - Maintains venue count consistency
 * - Includes duplicate detection
 */

// Environment variables should be loaded by the calling application

export class DeepSeekEnhancer {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled || false,
      maxRetries: options.maxRetries || 2,
      timeoutMs: options.timeoutMs || 30000, // Increased to 30 seconds for better reliability
      enhancementMode: options.enhancementMode || 'descriptions_only',
      enableQualityChecks: options.enableQualityChecks !== false,
      ...options
    }

    // Get API key with fallback options
    this.apiKey = options.apiKey || this.getApiKey()
    this.baseUrl = 'https://api.deepseek.com/v1/chat/completions'
    
    // Enhancement modes
    this.MODES = {
      DESCRIPTIONS_ONLY: 'descriptions_only',
      VENUE_INSIGHTS: 'venue_insights',
      FULL_NARRATIVE: 'full_narrative'
    }

    // Safety metrics
    this.metrics = {
      enhancementsAttempted: 0,
      enhancementsSuccessful: 0,
      enhancementsFailed: 0,
      averageProcessingTime: 0,
      apiErrors: 0
    }

    console.log(`🤖 DeepSeekEnhancer: Initialized in ${this.options.enhancementMode} mode`)
    console.log(`🔑 DeepSeekEnhancer: API Key configured: ${this.apiKey ? 'YES' : 'NO'}`)
  }

  /**
   * Get API key with multiple fallback options
   */
  getApiKey() {
    let apiKey = null
    
    // Try Node.js environment variables first
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY
      if (apiKey) {
        console.log('🔑 DeepSeekEnhancer: Found API key in process.env')
        return apiKey
      }
    }
    
    // Try browser environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
      if (apiKey) {
        console.log('🔑 DeepSeekEnhancer: Found API key in import.meta.env')
        return apiKey
      }
    }
    
    // Debug: Show what environment variables are available
    if (typeof process !== 'undefined' && process.env) {
      const envKeys = Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('deepseek') || key.toLowerCase().includes('api')
      )
      console.log('🔍 DeepSeekEnhancer: Available env keys:', envKeys.length > 0 ? envKeys : 'none found')
    }
    
    console.warn('⚠️ DeepSeekEnhancer: No API key found in any environment')
    return null
  }

  /**
   * Main enhancement method - safely enhances existing venues
   */
  async enhanceVenues(venues, tripContext) {
    if (!this.options.enabled) {
      console.log('🤖 DeepSeekEnhancer: Enhancement disabled, returning original venues')
      return venues
    }

    if (!this.apiKey) {
      console.warn('🤖 DeepSeekEnhancer: No API key found, returning original venues')
      return venues
    }

    console.log(`🤖 DeepSeekEnhancer: Starting enhancement for ${venues.length} venues`)
    const startTime = Date.now()

    try {
      // Safety check: Validate input venues
      const validatedVenues = this.validateInputVenues(venues)
      if (validatedVenues.length === 0) {
        console.warn('🤖 DeepSeekEnhancer: No valid venues to enhance')
        return venues
      }

      // Enhance based on selected mode
      let enhancedVenues
      switch (this.options.enhancementMode) {
        case this.MODES.DESCRIPTIONS_ONLY:
          enhancedVenues = await this.enhanceDescriptions(validatedVenues, tripContext)
          break
        case this.MODES.VENUE_INSIGHTS:
          enhancedVenues = await this.enhanceWithInsights(validatedVenues, tripContext)
          break
        case this.MODES.FULL_NARRATIVE:
          enhancedVenues = await this.enhanceWithNarrative(validatedVenues, tripContext)
          break
        default:
          enhancedVenues = validatedVenues
      }

      // Safety check: Validate enhanced results
      const safeResults = this.validateEnhancedVenues(venues, enhancedVenues)
      
      // Update metrics
      this.updateMetrics(true, Date.now() - startTime)
      
      console.log(`✅ DeepSeekEnhancer: Successfully enhanced ${safeResults.length} venues`)
      return safeResults

    } catch (error) {
      console.error('❌ DeepSeekEnhancer: Enhancement failed:', error.message)
      this.updateMetrics(false, Date.now() - startTime)
      
      // SAFE FALLBACK: Always return original venues on any error
      return venues
    }
  }

  /**
   * Mode 1: Enhance venue descriptions only
   */
  async enhanceDescriptions(venues, tripContext) {
    console.log('🎨 DeepSeekEnhancer: Enhancing descriptions...')
    
    const prompt = this.createDescriptionPrompt(venues, tripContext)
    const aiResponse = await this.callDeepSeekAPI(prompt)
    
    if (!aiResponse) {
      throw new Error('Failed to get AI response for descriptions')
    }

    return this.parseDescriptionEnhancements(venues, aiResponse)
  }

  /**
   * Mode 2: Add venue insights and recommendations
   */
  async enhanceWithInsights(venues, tripContext) {
    console.log('💡 DeepSeekEnhancer: Adding venue insights...')
    
    const prompt = this.createInsightsPrompt(venues, tripContext)
    const aiResponse = await this.callDeepSeekAPI(prompt)
    
    if (!aiResponse) {
      throw new Error('Failed to get AI response for insights')
    }

    return this.parseInsightEnhancements(venues, aiResponse)
  }

  /**
   * Mode 3: Full narrative enhancement
   */
  async enhanceWithNarrative(venues, tripContext) {
    console.log('📖 DeepSeekEnhancer: Creating narrative enhancements...')
    
    const prompt = this.createNarrativePrompt(venues, tripContext)
    const aiResponse = await this.callDeepSeekAPI(prompt)
    
    if (!aiResponse) {
      throw new Error('Failed to get AI response for narrative')
    }

    return this.parseNarrativeEnhancements(venues, aiResponse)
  }

  /**
   * Call DeepSeek API with retry logic and error handling
   */
  async callDeepSeekAPI(prompt, retryCount = 0) {
    try {
      console.log(`🌐 DeepSeekEnhancer: Calling API (attempt ${retryCount + 1})`)
      
      // Create abort controller for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs)
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert who enhances venue information with engaging, accurate descriptions. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content received from DeepSeek API')
      }

      console.log('✅ DeepSeekEnhancer: API call successful')
      return content

    } catch (error) {
      console.warn(`⚠️ DeepSeekEnhancer: API call failed (attempt ${retryCount + 1}):`, error.message)
      
      if (error.name === 'AbortError') {
        console.warn(`⏰ DeepSeekEnhancer: Request timed out after ${this.options.timeoutMs}ms`)
      }
      
      if (retryCount < this.options.maxRetries) {
        console.log(`🔄 DeepSeekEnhancer: Retrying in 2 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return this.callDeepSeekAPI(prompt, retryCount + 1)
      }
      
      this.metrics.apiErrors++
      return null
    }
  }

  /**
   * Create prompt for description enhancement
   */
  createDescriptionPrompt(venues, tripContext) {
    const venueList = venues.map(v => `- ${v.name}: ${v.category || 'Unknown'}`).join('\n')
    
    return `Enhance these venue descriptions for a trip to ${tripContext.destination}:

${venueList}

Trip Context:
- Destination: ${tripContext.destination}
- Preferences: ${tripContext.preferences?.join(', ') || 'General'}
- Categories: ${tripContext.categories?.join(', ') || 'Mixed'}

Please respond with a JSON object containing enhanced descriptions:
{
  "enhancements": [
    {
      "name": "exact venue name",
      "description": "engaging 2-3 sentence description focusing on what makes this place special",
      "highlights": ["key feature 1", "key feature 2"],
      "bestTime": "when to visit for optimal experience"
    }
  ]
}

Keep descriptions factual, engaging, and relevant to the trip preferences.`
  }

  /**
   * Create prompt for insights enhancement
   */
  createInsightsPrompt(venues, tripContext) {
    const venueList = venues.map(v => `- ${v.name}: ${v.category || 'Unknown'}`).join('\n')
    
    return `Provide travel insights for these venues in ${tripContext.destination}:

${venueList}

Please respond with JSON containing insights:
{
  "insights": [
    {
      "name": "exact venue name",
      "whyVisit": "compelling reason to visit",
      "localTip": "insider tip or local knowledge",
      "experienceType": "what type of experience this offers",
      "pairsWith": "what other activities complement this"
    }
  ]
}

Focus on practical, actionable insights that enhance the travel experience.`
  }

  /**
   * Create prompt for narrative enhancement
   */
  createNarrativePrompt(venues, tripContext) {
    const venueList = venues.map(v => `- ${v.name}: ${v.category || 'Unknown'}`).join('\n')
    
    return `Create a cohesive narrative for these venues in ${tripContext.destination}:

${venueList}

Trip Context:
- Destination: ${tripContext.destination}
- Duration: ${tripContext.duration || 'Multi-day'}
- Style: ${tripContext.preferences?.join(' + ') || 'Exploratory'}

Please respond with JSON:
{
  "narrative": {
    "theme": "overarching theme for this collection of venues",
    "story": "2-3 sentences connecting these venues into a cohesive experience",
    "flow": "suggested order or grouping for optimal experience"
  },
  "venues": [
    {
      "name": "exact venue name",
      "storyRole": "how this venue fits into the overall narrative",
      "transitionNote": "how to connect this to the next experience"
    }
  ]
}

Create a compelling story that makes the trip feel intentional and connected.`
  }

  /**
   * Parse description enhancements from AI response
   */
  parseDescriptionEnhancements(originalVenues, aiResponse) {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const parsed = JSON.parse(cleanResponse)
      const enhancements = parsed.enhancements || []
      
      return originalVenues.map(venue => {
        const enhancement = enhancements.find(e => 
          e.name && venue.name && 
          e.name.toLowerCase().includes(venue.name.toLowerCase()) ||
          venue.name.toLowerCase().includes(e.name.toLowerCase())
        )
        
        if (enhancement) {
          return {
            ...venue,
            enhancedDescription: enhancement.description,
            highlights: enhancement.highlights || [],
            bestTime: enhancement.bestTime,
            enhanced: true,
            enhancementType: 'descriptions'
          }
        }
        
        return venue
      })
      
    } catch (error) {
      console.warn('⚠️ DeepSeekEnhancer: Failed to parse description enhancements:', error.message)
      return originalVenues
    }
  }

  /**
   * Parse insights enhancements from AI response
   */
  parseInsightEnhancements(originalVenues, aiResponse) {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const parsed = JSON.parse(cleanResponse)
      const insights = parsed.insights || []
      
      return originalVenues.map(venue => {
        const insight = insights.find(i => 
          i.name && venue.name && 
          i.name.toLowerCase().includes(venue.name.toLowerCase()) ||
          venue.name.toLowerCase().includes(i.name.toLowerCase())
        )
        
        if (insight) {
          return {
            ...venue,
            whyVisit: insight.whyVisit,
            localTip: insight.localTip,
            experienceType: insight.experienceType,
            pairsWith: insight.pairsWith,
            enhanced: true,
            enhancementType: 'insights'
          }
        }
        
        return venue
      })
      
    } catch (error) {
      console.warn('⚠️ DeepSeekEnhancer: Failed to parse insight enhancements:', error.message)
      return originalVenues
    }
  }

  /**
   * Parse narrative enhancements from AI response
   */
  parseNarrativeEnhancements(originalVenues, aiResponse) {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const parsed = JSON.parse(cleanResponse)
      const narrative = parsed.narrative || {}
      const venueNarratives = parsed.venues || []
      
      const enhancedVenues = originalVenues.map(venue => {
        const venueNarrative = venueNarratives.find(v => 
          v.name && venue.name && 
          v.name.toLowerCase().includes(venue.name.toLowerCase()) ||
          venue.name.toLowerCase().includes(v.name.toLowerCase())
        )
        
        if (venueNarrative) {
          return {
            ...venue,
            storyRole: venueNarrative.storyRole,
            transitionNote: venueNarrative.transitionNote,
            enhanced: true,
            enhancementType: 'narrative'
          }
        }
        
        return venue
      })
      
      // Add narrative metadata to the first venue
      if (enhancedVenues.length > 0 && narrative.theme) {
        enhancedVenues[0] = {
          ...enhancedVenues[0],
          narrativeTheme: narrative.theme,
          narrativeStory: narrative.story,
          narrativeFlow: narrative.flow
        }
      }
      
      return enhancedVenues
      
    } catch (error) {
      console.warn('⚠️ DeepSeekEnhancer: Failed to parse narrative enhancements:', error.message)
      return originalVenues
    }
  }

  /**
   * Validate input venues before enhancement
   */
  validateInputVenues(venues) {
    if (!Array.isArray(venues)) {
      console.warn('🤖 DeepSeekEnhancer: Input is not an array')
      return []
    }
    
    const validVenues = venues.filter(venue => 
      venue && 
      typeof venue === 'object' && 
      venue.name && 
      typeof venue.name === 'string' &&
      venue.name.trim().length > 0
    )
    
    console.log(`🔍 DeepSeekEnhancer: Validated ${validVenues.length}/${venues.length} venues`)
    return validVenues
  }

  /**
   * Validate enhanced venues against original venues (CRITICAL SAFETY CHECK)
   */
  validateEnhancedVenues(originalVenues, enhancedVenues) {
    // Safety check 1: Count consistency
    if (enhancedVenues.length !== originalVenues.length) {
      console.warn(`⚠️ DeepSeekEnhancer: Venue count mismatch! Original: ${originalVenues.length}, Enhanced: ${enhancedVenues.length}`)
      return originalVenues // SAFE FALLBACK
    }
    
    // Safety check 2: No duplicates introduced
    const enhancedNames = enhancedVenues.map(v => v.name.toLowerCase())
    const uniqueNames = new Set(enhancedNames)
    if (uniqueNames.size !== enhancedNames.length) {
      console.warn('⚠️ DeepSeekEnhancer: Duplicates detected in enhanced venues!')
      return originalVenues // SAFE FALLBACK
    }
    
    // Safety check 3: All original venues still present
    const originalNames = new Set(originalVenues.map(v => v.name.toLowerCase()))
    const allPresent = enhancedNames.every(name => originalNames.has(name))
    if (!allPresent) {
      console.warn('⚠️ DeepSeekEnhancer: Some original venues missing from enhanced results!')
      return originalVenues // SAFE FALLBACK
    }
    
    console.log('✅ DeepSeekEnhancer: Enhanced venues passed all safety checks')
    return enhancedVenues
  }

  /**
   * Update performance metrics
   */
  updateMetrics(success, processingTime) {
    this.metrics.enhancementsAttempted++
    
    if (success) {
      this.metrics.enhancementsSuccessful++
    } else {
      this.metrics.enhancementsFailed++
    }
    
    // Update rolling average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.enhancementsAttempted - 1) + processingTime
    this.metrics.averageProcessingTime = totalTime / this.metrics.enhancementsAttempted
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.enhancementsAttempted > 0 
        ? (this.metrics.enhancementsSuccessful / this.metrics.enhancementsAttempted * 100).toFixed(1) + '%'
        : '0%'
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      enhancementsAttempted: 0,
      enhancementsSuccessful: 0,
      enhancementsFailed: 0,
      averageProcessingTime: 0,
      apiErrors: 0
    }
  }

  /**
   * Enable/disable enhancement
   */
  setEnabled(enabled) {
    this.options.enabled = enabled
    console.log(`🤖 DeepSeekEnhancer: ${enabled ? 'Enabled' : 'Disabled'}`)
  }

  /**
   * Change enhancement mode
   */
  setMode(mode) {
    if (Object.values(this.MODES).includes(mode)) {
      this.options.enhancementMode = mode
      console.log(`🤖 DeepSeekEnhancer: Mode changed to ${mode}`)
    } else {
      console.warn(`⚠️ DeepSeekEnhancer: Invalid mode ${mode}`)
    }
  }
} 