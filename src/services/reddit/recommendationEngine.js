import redditAPI from './redditAPI.js'
import contentParser from './contentParser.js'
import venueEnrichment from '../enrichment/venueEnrichment.js'

class RecommendationEngine {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
  }

  async generateRecommendations(tripData) {
    console.log('🔍 Starting Reddit-based recommendation generation for:', tripData.destination)
    
    const cacheKey = this.generateCacheKey(tripData)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('✅ Using cached Reddit recommendations')
        return this.filterRecommendationsByPreferences(cached.data, tripData)
      }
    }

    try {
      // Step 1: Research Reddit for recommendations
      const redditData = await this.researchDestination(tripData.destination, tripData.categories, tripData.budget)
      
      // Step 2: Process and extract venue information
      const venues = await this.processRedditData(redditData, tripData.destination)
      
      // Step 3: Cache the results
      this.cache.set(cacheKey, {
        data: venues,
        timestamp: Date.now()
      })
      
      // Step 4: Filter and rank based on user preferences
      const recommendations = this.filterRecommendationsByPreferences(venues, tripData)
      
      console.log(`✅ Generated ${recommendations.length} Reddit-based recommendations`)
      return recommendations
      
    } catch (error) {
      console.error('❌ Reddit recommendation generation failed:', error)
      return this.getFallbackRecommendations(tripData)
    }
  }

  async researchDestination(destination, preferences = [], budget = null) {
    console.log(`🔍 Researching ${destination} on Reddit...`)
    
    const subreddits = redditAPI.getRelevantSubreddits(destination)
    const queries = redditAPI.generateSearchQueries(destination, preferences, budget)
    
    const allPosts = []
    const allComments = []
    
    // Search across multiple subreddits and queries (limit to avoid rate limiting)
    const searchTasks = []
    
    // Search general subreddits
    for (const query of queries.slice(0, 5)) { // Limit queries
      searchTasks.push(
        redditAPI.searchPosts(query, { time: 'year', limit: 15 })
      )
    }
    
    // Search destination-specific subreddits
    for (const subreddit of subreddits.slice(0, 3)) { // Limit subreddits
      for (const query of queries.slice(0, 3)) {
        searchTasks.push(
          redditAPI.searchPosts(query, { subreddit, time: 'year', limit: 10 })
        )
      }
    }
    
    // Execute searches with rate limiting
    const searchResults = await this.executeWithRateLimit(searchTasks)
    
    // Flatten results
    searchResults.forEach(posts => {
      allPosts.push(...posts)
    })
    
    // Get comments for top posts
    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Top 20 posts
    
    for (const post of topPosts) {
      try {
        const comments = await redditAPI.getPostComments(post.id, post.subreddit)
        allComments.push(...comments)
      } catch (error) {
        console.warn(`Failed to get comments for post ${post.id}:`, error)
      }
    }
    
    console.log(`📊 Collected ${allPosts.length} posts and ${allComments.length} comments`)
    
    return { posts: allPosts, comments: allComments }
  }

  async processRedditData(redditData, destination) {
    console.log('🔄 Processing Reddit data to extract venues...')
    
    // Parse posts and comments
    const parsedPosts = redditData.posts.map(post => contentParser.parsePost(post))
    const parsedComments = contentParser.parseComments(redditData.comments)
    
    // Aggregate venue data
    const venues = contentParser.aggregateVenueData(parsedPosts, parsedComments)
    
    // Enhance venues with Reddit data first
    const redditEnhancedVenues = venues.map(venue => this.enhanceVenueWithRedditData(venue))
    
    // Filter out low-quality venues
    const qualityVenues = redditEnhancedVenues.filter(venue => this.isHighQualityVenue(venue))
    
    // Enrich with web search data
    console.log('🌐 Enriching venues with web search data...')
    const webEnrichedVenues = await venueEnrichment.enrichMultipleVenues(qualityVenues, destination)
    
    return webEnrichedVenues
  }

  enhanceVenueWithRedditData(venue) {
    // Calculate average price
    const prices = venue.prices.filter(p => p.amount > 0)
    const avgPrice = prices.length > 0 
      ? prices.reduce((sum, p) => sum + p.amount, 0) / prices.length 
      : null
    
    // Determine category
    const category = contentParser.categorizeVenue(venue.name, venue.addresses.join(' '))
    
    // Extract best timing info
    const timing = venue.timing.length > 0 ? venue.timing[0] : null
    
    // Generate description from sources
    const description = this.generateDescription(venue)
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(venue)
    
    return {
      name: venue.name,
      category,
      avgPrice: avgPrice ? Math.round(avgPrice) : null,
      mentionCount: venue.mentionCount,
      avgSentiment: venue.avgSentiment,
      confidence,
      timing,
      description,
      addresses: venue.addresses,
      redditSources: venue.sources.length,
      whyRecommended: this.generateWhyRecommended(venue)
    }
  }

  generateDescription(venue) {
    // Create a description based on Reddit mentions
    const positiveWords = ['amazing', 'excellent', 'fantastic', 'great', 'perfect', 'wonderful']
    const hasPositiveMention = venue.sentiments.some(s => s > 0.5)
    
    let description = `Popular ${venue.name.toLowerCase().includes('restaurant') ? 'restaurant' : 'destination'}`
    
    if (hasPositiveMention) {
      description += ' highly praised by Reddit travelers'
    }
    
    if (venue.mentionCount > 5) {
      description += ` with ${venue.mentionCount} mentions across travel discussions`
    }
    
    if (venue.avgPrice) {
      description += `. Average cost around $${venue.avgPrice}`
    }
    
    return description + '.'
  }

  generateWhyRecommended(venue) {
    const reasons = []
    
    if (venue.avgSentiment > 0.5) {
      reasons.push('Highly rated by Reddit travelers')
    }
    
    if (venue.mentionCount > 10) {
      reasons.push('Frequently mentioned in travel discussions')
    }
    
    if (venue.avgSentiment > 0.3 && venue.mentionCount > 5) {
      reasons.push('Consistently positive reviews')
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Recommended by travelers'
  }

  calculateConfidence(venue) {
    // Confidence based on mention frequency, sentiment, and source quality
    let confidence = 0
    
    // Mention frequency (0-0.4)
    confidence += Math.min(venue.mentionCount / 20, 0.4)
    
    // Sentiment (0-0.3)
    confidence += Math.max(0, venue.avgSentiment) * 0.3
    
    // Source quality (0-0.3)
    const avgSourceScore = venue.sources.reduce((sum, s) => sum + s.score, 0) / venue.sources.length
    confidence += Math.min(avgSourceScore / 100, 0.3)
    
    return Math.min(confidence, 1.0)
  }

  isHighQualityVenue(venue) {
    // Filter criteria for high-quality venues
    return venue.mentionCount >= 2 &&
           venue.confidence > 0.3 &&
           venue.avgSentiment > -0.5 &&
           venue.name.length > 3
  }

  filterRecommendationsByPreferences(venues, tripData) {
    const { categories, budget, people } = tripData
    const budgetPerPerson = budget / people
    
    let filtered = venues
    
    // Filter by budget
    if (budgetPerPerson) {
      filtered = filtered.filter(venue => {
        if (!venue.avgPrice) return true // Include venues without price info
        return venue.avgPrice <= budgetPerPerson * 0.3 // Max 30% of daily budget per activity
      })
    }
    
    // Filter by categories
    if (categories && categories.length > 0) {
      filtered = filtered.filter(venue => {
        return categories.some(category => {
          switch (category) {
            case 'food':
              return venue.category === 'dining'
            case 'culture':
              return venue.category === 'culture' || venue.category === 'attraction'
            case 'adventure':
              return venue.category === 'nature' || venue.category === 'attraction'
            case 'nightlife':
              return venue.category === 'nightlife'
            case 'shopping':
              return venue.category === 'shopping'
            case 'relaxation':
              return venue.category === 'nature' || venue.category === 'attraction'
            default:
              return true
          }
        })
      })
    }
    
    // Sort by confidence and sentiment
    return filtered
      .sort((a, b) => {
        const scoreA = a.confidence * (1 + a.avgSentiment)
        const scoreB = b.confidence * (1 + b.avgSentiment)
        return scoreB - scoreA
      })
      .slice(0, 50) // Top 50 recommendations
  }

  async executeWithRateLimit(tasks) {
    const results = []
    
    for (const task of tasks) {
      try {
        const result = await task
        results.push(result)
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.warn('Search task failed:', error)
        results.push([]) // Empty result for failed task
      }
    }
    
    return results
  }

  generateCacheKey(tripData) {
    return `reddit_${tripData.destination}_${tripData.categories?.join('_') || 'all'}`
  }

  getFallbackRecommendations(tripData) {
    console.log('🔄 Generating fallback recommendations...')
    
    // Return some basic recommendations based on destination
    const destination = tripData.destination.toLowerCase()
    
    if (destination.includes('cancun')) {
      return [
        {
          name: 'Chichen Itza',
          category: 'culture',
          avgPrice: 89,
          description: 'UNESCO World Heritage Maya archaeological site',
          whyRecommended: 'Top-rated historical attraction',
          confidence: 0.9
        },
        {
          name: 'Xel-Há',
          category: 'nature',
          avgPrice: 129,
          description: 'Natural aquarium and eco-park',
          whyRecommended: 'Perfect for snorkeling and nature lovers',
          confidence: 0.8
        }
      ]
    }
    
    return []
  }
}

export default new RecommendationEngine() 