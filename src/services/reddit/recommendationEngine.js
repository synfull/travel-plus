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
    
    // First, parse posts and comments to extract venues using content parser
    const parsedPosts = redditData.posts.map(post => contentParser.parsePost(post))
    const parsedComments = contentParser.parseComments(redditData.comments)
    
    // Extract all venues from parsed posts and comments
    const allVenues = []
    
    parsedPosts.forEach(post => {
      if (post.venues && post.venues.length > 0) {
        post.venues.forEach(venue => {
          allVenues.push({
            name: venue,
            source: 'post',
            score: post.score,
            sentiment: post.sentiment,
            context: post.title + ' ' + post.content
          })
        })
      }
    })
    
    parsedComments.forEach(comment => {
      if (comment.venues && comment.venues.length > 0) {
        comment.venues.forEach(venue => {
          allVenues.push({
            name: venue,
            source: 'comment',
            score: comment.score,
            sentiment: comment.sentiment,
            context: comment.body
          })
        })
      }
    })
    
    console.log(`📊 Extracted ${allVenues.length} venues from Reddit data`)
    
    // Apply additional filtering to remove remaining garbage
    const filteredVenues = allVenues.filter(venue => {
      if (!this.isValidVenueForDestination(venue.name, destination)) {
        console.log(`🚫 Final filter rejected: "${venue.name}"`)
        return false
      }
      return true
    })
    
    console.log(`✅ Cleaned venues: ${allVenues.length} → ${filteredVenues.length}`)
    
    // Remove duplicates and similar venues
    const deduplicatedVenues = this.removeDuplicateVenues(filteredVenues)
    console.log(`🔄 Deduplicated venues: ${filteredVenues.length} → ${deduplicatedVenues.length}`)
    
    // Enrich venues with web search data
    console.log('🌐 Enriching venues with web search data...')
    const enrichedVenues = await venueEnrichment.enrichMultipleVenues(deduplicatedVenues, destination)
    
        // Score and rank venues, ensuring proper data structure for filtering
    const scoredVenues = enrichedVenues.map(venue => {
      const finalScore = this.calculateVenueScore(venue)
      
      // Determine category based on venue name and enriched data
      let category = 'attraction' // default
      const nameLower = venue.name.toLowerCase()
      
      // Enhanced dining detection - more comprehensive patterns
      if (nameLower.includes('restaurant') || nameLower.includes('cafe') || nameLower.includes('bar') || 
          nameLower.includes('bistro') || nameLower.includes('brasserie') || nameLower.includes('dining') ||
          nameLower.includes('eatery') || nameLower.includes('food') || nameLower.includes('kitchen') ||
          nameLower.includes('grill') || nameLower.includes('tavern') || nameLower.includes('pub') ||
          nameLower.includes('boulangerie') || nameLower.includes('patisserie') || nameLower.includes('bakery') ||
          nameLower.includes('wine') || nameLower.includes('cocktail') || nameLower.includes('lunch') ||
          nameLower.includes('dinner') || nameLower.includes('brunch') || nameLower.includes('tea') ||
          // French-specific dining terms
          nameLower.includes('boeuf') || nameLower.includes('cuisine') || nameLower.includes('menu') ||
          // Check if Google Places categorized it as food/dining
          (venue.enriched && venue.enriched.types && venue.enriched.types.some(type => 
            type.includes('restaurant') || type.includes('food') || type.includes('meal') || 
            type.includes('bar') || type.includes('cafe') || type.includes('bakery')))) {
        category = 'dining'
      } else if (nameLower.includes('museum') || nameLower.includes('gallery') || nameLower.includes('cathedral') || nameLower.includes('palace') || nameLower.includes('temple') || nameLower.includes('church')) {
        category = 'culture'
      } else if (nameLower.includes('park') || nameLower.includes('garden') || nameLower.includes('river') || nameLower.includes('beach') || nameLower.includes('nature')) {
        category = 'nature'
      } else if (nameLower.includes('club') || nameLower.includes('nightlife') || nameLower.includes('disco')) {
        category = 'nightlife'
      } else if (nameLower.includes('shop') || nameLower.includes('market') || nameLower.includes('mall') || nameLower.includes('boutique')) {
        category = 'shopping'
      }
      
      return {
        ...venue,
        score: finalScore,
        confidence: finalScore, // Map score to confidence for filter compatibility
        avgSentiment: venue.sentiment || 0, // Map sentiment for filter compatibility
        category: category, // Add category for filter compatibility
        avgPrice: venue.enriched?.price_level ? venue.enriched.price_level * 25 : null // Estimate price from Google price_level
      }
    })

    // Sort by score and return top venues
    return scoredVenues
      .sort((a, b) => b.score - a.score)
      .slice(0, 50) // Limit to top 50 venues
  }

  isValidVenueForDestination(venueName, destination) {
    const nameLower = venueName.toLowerCase()
    const destLower = destination.toLowerCase()
    
    // Additional garbage patterns that might slip through
    const garbagePatterns = [
      /^(period has|the key|basic|create|tv guide|tv addons|darcy|the rock|gaber is|njpw|tna|lesnar|super|chinese reddit|sol this|also reports|posted this|raf|emptying|columbia engineering|common app|animal reaction|mark|antonio|luigi|congressional|republican|monster hunter)/i,
      /\b(has now ended|key specs|troubleshooting|token lineup|guide is based|addons|lapier|interested|dojo|tapings|made a lof|this year|reports of|this in|brize norton|the house|engineering|town hall|hunter wilds)\b/i,
      /^(period|basic|create|gaber|njpw|tna|lesnar|luigi|congressional|republican|monster)/i
    ]
    
    if (garbagePatterns.some(pattern => pattern.test(nameLower))) {
      return false
    }
    
    // Geographic filtering - reject venues that clearly don't belong in the destination
    if (destLower.includes('new york')) {
      // Reject venues that mention other states/countries unless they're in NYC
      const wrongLocationPatterns = [
        /^(new hampshire|nh heritage|virginia|massachusetts|minnesota|california|wyoming|cheyenne|iowa|missouri|utah|kentucky|ontario|canada)\s+(museum|heritage|park)/i,
        /^(new jersey|florida|texas|nevada|colorado)\s+/i
      ]
      
      if (wrongLocationPatterns.some(pattern => pattern.test(nameLower))) {
        return false
      }
    }
    
    // General geographic filtering for other destinations
    if (!destLower.includes('new york') && !destLower.includes('usa')) {
      // If destination is not in US, reject US state-specific venues
      if (/^(new hampshire|virginia|massachusetts|minnesota|california|wyoming|iowa|missouri|utah|kentucky|florida|texas|nevada|colorado)\s+(museum|heritage|park)/i.test(nameLower)) {
        return false
      }
    }
    
    return true
  }

  removeDuplicateVenues(venues) {
    const deduplicatedMap = new Map()
    
    venues.forEach(venue => {
      const normalizedName = this.normalizeVenueName(venue.name)
      
      if (deduplicatedMap.has(normalizedName)) {
        // Merge with existing venue (combine scores, pick better name)
        const existing = deduplicatedMap.get(normalizedName)
        existing.score = Math.max(existing.score, venue.score)
        existing.sentiment = (existing.sentiment + venue.sentiment) / 2
        
        // Keep the longer, more descriptive name
        if (venue.name.length > existing.name.length) {
          existing.name = venue.name
        }
      } else {
        deduplicatedMap.set(normalizedName, { ...venue })
      }
    })
    
    return Array.from(deduplicatedMap.values())
  }

  normalizeVenueName(name) {
    return name
      .toLowerCase()
      .replace(/\b(museum|heritage|center|centre|gallery)\b/g, 'museum') // Normalize venue types
      .replace(/\b(nh|new hampshire)\b/g, 'newhampshire') // Normalize abbreviations
      .replace(/\b(ny|new york)\b/g, 'newyork')
      .replace(/\b(ca|california)\b/g, 'california')
      .replace(/\b(ma|massachusetts)\b/g, 'massachusetts')
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }

  calculateVenueScore(venue) {
    // Multi-factor scoring system
    let score = 0
    
    // Reddit engagement (30% weight) - based on upvotes/mentions
    const engagementScore = Math.min(venue.score / 100, 1) * 0.3
    score += engagementScore
    
    // Sentiment analysis (20% weight) - positive sentiment boosts score
    const sentimentScore = Math.max(0, venue.sentiment) * 0.2
    score += sentimentScore
    
    // Source quality (15% weight) - post vs comment, source reliability
    const sourceScore = venue.source === 'post' ? 0.15 : 0.10
    score += sourceScore
    
    // Venue type relevance (20% weight) - cultural sites get boost for culture category
    let typeScore = 0.1 // base score
    const venueLower = venue.name.toLowerCase()
    if (venueLower.includes('museum') || venueLower.includes('gallery') || venueLower.includes('temple') || venueLower.includes('church') || venueLower.includes('palace')) {
      typeScore = 0.2 // cultural venues get higher score
    }
    score += typeScore
    
    // Practical factors (15% weight) - venues with good enrichment data
    let practicalScore = 0
    if (venue.enriched && venue.enriched.rating > 0) {
      practicalScore += (venue.enriched.rating / 5) * 0.08 // Google rating
    }
    if (venue.enriched && venue.enriched.user_ratings_total > 0) {
      practicalScore += Math.min(venue.enriched.user_ratings_total / 1000, 1) * 0.07 // Review count
    }
    score += practicalScore
    
    return Math.min(score, 1.0) // Cap at 1.0
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
    return `reddit_v4_${tripData.destination}_${tripData.categories?.join('_') || 'all'}`
  }

  getFallbackRecommendations(tripData) {
    console.log('🔄 Generating fallback recommendations...')
    
    // Return some basic recommendations based on destination
    const destination = tripData.destination.toLowerCase()
    
    if (destination.includes('paris')) {
      return [
        {
          name: 'Musée d\'Orsay',
          category: 'culture',
          avgPrice: 16,
          description: 'World-renowned collection of Impressionist masterpieces',
          whyRecommended: 'Less crowded alternative to the Louvre with incredible art',
          confidence: 0.9,
          avgSentiment: 0.8
        },
        {
          name: 'Sainte-Chapelle',
          category: 'culture',
          avgPrice: 12,
          description: 'Gothic chapel famous for its magnificent stained glass windows',
          whyRecommended: 'Breathtaking medieval architecture and art',
          confidence: 0.85,
          avgSentiment: 0.9
        },
        {
          name: 'Père Lachaise Cemetery',
          category: 'culture',
          avgPrice: 0,
          description: 'Historic cemetery with famous graves and beautiful sculptures',
          whyRecommended: 'Peaceful walk through history and art',
          confidence: 0.7,
          avgSentiment: 0.6
        },
        {
          name: 'Latin Quarter',
          category: 'attraction',
          avgPrice: 20,
          description: 'Historic student quarter with narrow streets and cafes',
          whyRecommended: 'Authentic Parisian atmosphere and great food',
          confidence: 0.8,
          avgSentiment: 0.7
        }
      ]
    }
    
    if (destination.includes('cancun')) {
      return [
        {
          name: 'Chichen Itza',
          category: 'culture',
          avgPrice: 89,
          description: 'UNESCO World Heritage Maya archaeological site',
          whyRecommended: 'Top-rated historical attraction',
          confidence: 0.9,
          avgSentiment: 0.8
        },
        {
          name: 'Xel-Há',
          category: 'nature',
          avgPrice: 129,
          description: 'Natural aquarium and eco-park',
          whyRecommended: 'Perfect for snorkeling and nature lovers',
          confidence: 0.8,
          avgSentiment: 0.7
        }
      ]
    }
    
    return []
  }
}

export default new RecommendationEngine() 