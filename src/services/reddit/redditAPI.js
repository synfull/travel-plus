class RedditAPI {
  constructor() {
    this.baseURL = 'https://www.reddit.com/api/v1'
    this.searchURL = 'https://www.reddit.com/search.json'
    this.rateLimitDelay = 1000 // 1 second between requests
    this.lastRequestTime = 0
  }

  async rateLimitedRequest(url) {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TravelPlusApp/1.0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Reddit API request failed:', error)
      throw error
    }
  }

  async searchPosts(query, options = {}) {
    const {
      subreddit = '',
      sort = 'relevance',
      time = 'year',
      limit = 25
    } = options

    console.log(`🔍 Searching Reddit for: "${query}"`)
    
    const subredditParam = subreddit ? `r/${subreddit}` : ''
    const searchParams = new URLSearchParams({
      q: `${query} ${subredditParam}`.trim(),
      sort,
      t: time,
      limit,
      type: 'link',
      restrict_sr: subreddit ? 'true' : 'false'
    })

    const url = `${this.searchURL}?${searchParams}`
    
    try {
      const data = await this.rateLimitedRequest(url)
      
      if (!data.data || !data.data.children) {
        console.warn('No Reddit data found for query:', query)
        return []
      }

      const posts = data.data.children
        .map(child => child.data)
        .filter(post => this.isValidTravelPost(post))

      console.log(`✅ Found ${posts.length} relevant posts for "${query}"`)
      return posts
      
    } catch (error) {
      console.error(`Failed to search Reddit for "${query}":`, error)
      return []
    }
  }

  async getPostComments(postId, subreddit) {
    const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=50`
    
    try {
      const data = await this.rateLimitedRequest(url)
      
      if (!Array.isArray(data) || data.length < 2) {
        return []
      }

      const commentsData = data[1].data.children
      return commentsData
        .map(child => child.data)
        .filter(comment => comment.body && comment.body !== '[deleted]' && comment.score > 0)
        .slice(0, 20) // Top 20 comments
        
    } catch (error) {
      console.error(`Failed to get comments for post ${postId}:`, error)
      return []
    }
  }

  isValidTravelPost(post) {
    // Filter out low-quality posts
    if (post.score < 5) return false
    if (post.num_comments < 3) return false
    if (!post.title || post.title.length < 20) return false
    
    // Filter out promotional/spam content
    const spamIndicators = [
      'booking.com',
      'expedia',
      'affiliate',
      'promo code',
      'discount code',
      'click here'
    ]
    
    const titleLower = post.title.toLowerCase()
    const selfTextLower = (post.selftext || '').toLowerCase()
    
    return !spamIndicators.some(indicator => 
      titleLower.includes(indicator) || selfTextLower.includes(indicator)
    )
  }

  generateSearchQueries(destination, preferences = [], budget = null) {
    console.log(`🎯 Generating targeted searches for ${destination} with preferences:`, preferences)
    
    // Always include some general queries for baseline
    const baseQueries = [
      `best things to do ${destination} reddit`,
      `${destination} travel guide reddit`,
      `${destination} recommendations reddit`
    ]

    // Generate highly specific queries based on user preferences
    const preferenceQueries = []
    
    preferences.forEach(pref => {
      const queries = this.getPreferenceSpecificQueries(destination, pref)
      preferenceQueries.push(...queries)
    })

    // Add budget-specific queries if budget is provided
    const budgetQueries = []
    if (budget) {
      budgetQueries.push(...this.getBudgetSpecificQueries(destination, budget))
    }

    // Combine all queries and remove duplicates
    const allQueries = [...baseQueries, ...preferenceQueries, ...budgetQueries]
    const uniqueQueries = [...new Set(allQueries)]
    
    console.log(`📝 Generated ${uniqueQueries.length} unique search queries`)
    return uniqueQueries
  }

  getPreferenceSpecificQueries(destination, preference) {
    const queries = []
    
    switch (preference.toLowerCase()) {
      case 'food':
      case 'cuisine':
        queries.push(
          `best restaurants ${destination} reddit`,
          `where to eat ${destination} reddit`,
          `${destination} local food recommendations reddit`,
          `${destination} street food reddit`,
          `${destination} food tour reddit`,
          `must try food ${destination} reddit`,
          `${destination} authentic restaurants reddit`,
          `${destination} local cuisine reddit`
        )
        break
        
      case 'nightlife':
      case 'drinks':
        queries.push(
          `best bars ${destination} reddit`,
          `${destination} nightlife reddit`,
          `best clubs ${destination} reddit`,
          `${destination} bars recommendations reddit`,
          `${destination} night scene reddit`,
          `where to drink ${destination} reddit`,
          `${destination} cocktail bars reddit`,
          `${destination} party scene reddit`
        )
        break
        
      case 'culture':
      case 'cultural':
        queries.push(
          `${destination} museums reddit`,
          `cultural sites ${destination} reddit`,
          `${destination} art galleries reddit`,
          `${destination} historical sites reddit`,
          `${destination} cultural experiences reddit`,
          `${destination} temples churches reddit`,
          `${destination} local culture reddit`,
          `${destination} cultural attractions reddit`
        )
        break
        
      case 'adventure':
      case 'outdoor':
        queries.push(
          `${destination} adventure activities reddit`,
          `${destination} excursions reddit`,
          `outdoor activities ${destination} reddit`,
          `${destination} tours reddit`,
          `${destination} hiking reddit`,
          `${destination} water sports reddit`,
          `${destination} adventure tours reddit`,
          `things to do ${destination} adventure reddit`
        )
        break
        
      case 'nature':
      case 'wildlife':
        queries.push(
          `${destination} nature spots reddit`,
          `${destination} parks reddit`,
          `${destination} wildlife reddit`,
          `${destination} beaches reddit`,
          `${destination} natural attractions reddit`,
          `${destination} scenic spots reddit`,
          `${destination} national parks reddit`,
          `${destination} nature tours reddit`
        )
        break
        
      case 'shopping':
        queries.push(
          `best shopping ${destination} reddit`,
          `${destination} markets reddit`,
          `${destination} shopping districts reddit`,
          `where to shop ${destination} reddit`,
          `${destination} local markets reddit`,
          `${destination} souvenirs reddit`,
          `${destination} shopping centers reddit`,
          `${destination} street markets reddit`
        )
        break
        
      case 'relaxation':
      case 'wellness':
        queries.push(
          `${destination} spa reddit`,
          `${destination} wellness reddit`,
          `${destination} relaxation reddit`,
          `${destination} massage reddit`,
          `${destination} peaceful spots reddit`,
          `${destination} quiet places reddit`,
          `${destination} wellness centers reddit`,
          `${destination} meditation reddit`
        )
        break
        
      case 'family':
        queries.push(
          `${destination} family activities reddit`,
          `${destination} kids activities reddit`,
          `${destination} family friendly reddit`,
          `${destination} with children reddit`,
          `${destination} family attractions reddit`,
          `${destination} kids friendly reddit`,
          `family trip ${destination} reddit`,
          `${destination} family vacation reddit`
        )
        break
        
      case 'budget':
      case 'cheap':
        queries.push(
          `${destination} on a budget reddit`,
          `cheap things ${destination} reddit`,
          `free activities ${destination} reddit`,
          `${destination} budget tips reddit`,
          `${destination} budget travel reddit`,
          `${destination} cheap eats reddit`,
          `${destination} free attractions reddit`,
          `${destination} budget guide reddit`
        )
        break
        
      default:
        // For any other preference, create a generic query
        queries.push(
          `${destination} ${preference} reddit`,
          `best ${preference} ${destination} reddit`
        )
        break
    }
    
    return queries
  }

  getBudgetSpecificQueries(destination, budget) {
    const queries = []
    
    if (budget < 1000) {
      queries.push(
        `${destination} budget travel reddit`,
        `cheap things ${destination} reddit`,
        `${destination} on a shoestring reddit`,
        `${destination} backpacker reddit`
      )
    } else if (budget < 3000) {
      queries.push(
        `${destination} mid range travel reddit`,
        `${destination} good value reddit`,
        `${destination} moderate budget reddit`
      )
    } else {
      queries.push(
        `${destination} luxury travel reddit`,
        `best ${destination} experiences reddit`,
        `${destination} premium activities reddit`,
        `${destination} high end reddit`
      )
    }
    
    return queries
  }

  getRelevantSubreddits(destination) {
    const destinationLower = destination.toLowerCase()
    
    // General travel subreddits
    const generalSubs = ['travel', 'solotravel', 'backpacking', 'digitalnomad']
    
    // Location-specific subreddits (common ones)
    const locationSubs = []
    
    if (destinationLower.includes('mexico') || destinationLower.includes('cancun')) {
      locationSubs.push('mexico', 'cancun', 'yucatan')
    }
    if (destinationLower.includes('japan') || destinationLower.includes('tokyo')) {
      locationSubs.push('japan', 'tokyo', 'japantravel')
    }
    if (destinationLower.includes('thailand') || destinationLower.includes('bangkok')) {
      locationSubs.push('thailand', 'bangkok')
    }
    if (destinationLower.includes('bali') || destinationLower.includes('indonesia')) {
      locationSubs.push('indonesia', 'bali')
    }
    
    return [...generalSubs, ...locationSubs]
  }
}

export default new RedditAPI() 