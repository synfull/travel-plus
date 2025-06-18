class ContentParser {
  constructor() {
    // Regex patterns for extracting information
    this.patterns = {
      venues: [
        // Explicit venue mentions with context
        /(?:went to|visited|ate at|stayed at|recommend|try|check out)\s+([A-Z][a-zA-Z\s&'-]{3,35})/gi,
        // Restaurant/venue patterns with explicit keywords
        /\b([A-Z][a-zA-Z\s&'-]{3,35}(?:\s+Restaurant|\s+Cafe|\s+Bar|\s+Club|\s+Hotel|\s+Resort|\s+Museum|\s+Gallery|\s+Park|\s+Beach|\s+Market|\s+Mall|\s+Center|\s+Centre))\b/g,
        // Quoted venue names (more restrictive)
        /"([A-Z][^"]{2,35})"/g,
        // Venue names with location context
        /\b([A-Z][a-zA-Z\s&'-]{3,35})\s+(?:in|at|near|on)\s+[A-Z][a-zA-Z\s]+/g,
        // Venue names followed by positive descriptors
        /\b([A-Z][a-zA-Z\s&'-]{3,35})\s+(?:is amazing|is great|is excellent|is fantastic|was incredible|highly recommend)/gi
      ],
      
      prices: [
        // Dollar amounts with context
        /\$(\d+(?:\.\d{2})?)\s*(?:per person|pp|each|USD|dollars?)?/gi,
        // Price ranges
        /\$(\d+)-\$?(\d+)/g,
        // Around/about price indicators
        /(?:around|about|roughly|approximately)\s*\$(\d+)/gi
      ],
      
      addresses: [
        // Street addresses
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Plaza|Plz)\b/gi,
        // Area/zone references
        /(?:in|at|near)\s+([A-Z][a-zA-Z\s]{3,25}(?:Zone|Area|District|Quarter|Neighborhood))/gi
      ],
      
      timing: [
        // Duration patterns
        /(\d+(?:-\d+)?)\s*(?:hours?|hrs?|minutes?|mins?|days?)/gi,
        // Time ranges
        /(\d{1,2}(?::\d{2})?)\s*(?:am|pm|AM|PM)\s*-\s*(\d{1,2}(?::\d{2})?)\s*(?:am|pm|AM|PM)/gi
      ],
      
      ratings: [
        // Star ratings
        /(\d(?:\.\d)?)\s*(?:\/5|stars?|out of 5)/gi,
        // Rating phrases
        /(?:rated|rating|score)\s*(\d(?:\.\d)?)/gi
      ]
    }

    // Sentiment indicators
    this.sentimentWords = {
      positive: [
        'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'love', 'loved',
        'perfect', 'wonderful', 'incredible', 'outstanding', 'brilliant', 'superb',
        'highly recommend', 'must visit', 'must see', 'must do', 'worth it',
        'don\'t miss', 'favorite', 'favourite', 'best', 'top'
      ],
      negative: [
        'terrible', 'awful', 'horrible', 'worst', 'hate', 'hated', 'disappointing',
        'overpriced', 'tourist trap', 'skip', 'avoid', 'waste', 'boring',
        'not worth', 'overrated', 'crowded', 'expensive'
      ]
    }
  }

  parsePost(post) {
    const content = `${post.title} ${post.selftext || ''}`
    
    return {
      id: post.id,
      title: post.title,
      content: post.selftext || '',
      score: post.score,
      numComments: post.num_comments,
      subreddit: post.subreddit,
      createdUtc: post.created_utc,
      url: post.url,
      venues: this.extractVenues(content),
      prices: this.extractPrices(content),
      addresses: this.extractAddresses(content),
      timing: this.extractTiming(content),
      sentiment: this.analyzeSentiment(content)
    }
  }

  parseComments(comments) {
    return comments.map(comment => ({
      id: comment.id,
      body: comment.body,
      score: comment.score,
      venues: this.extractVenues(comment.body),
      prices: this.extractPrices(comment.body),
      addresses: this.extractAddresses(comment.body),
      timing: this.extractTiming(comment.body),
      sentiment: this.analyzeSentiment(comment.body)
    })).filter(comment => 
      comment.venues.length > 0 || 
      comment.prices.length > 0 || 
      Math.abs(comment.sentiment) > 0.3
    )
  }

  extractVenues(text) {
    const venues = new Set()
    
    // First, try context-based extraction (more reliable)
    const contextVenues = this.extractVenuesWithContext(text)
    contextVenues.forEach(venue => venues.add(venue))
    
    // Then, try pattern-based extraction as fallback
    this.patterns.venues.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const venueName = match[1] || match[0]
        const cleaned = this.cleanVenueName(venueName)
        if (cleaned && this.isValidVenueName(cleaned)) {
          venues.add(cleaned)
        }
      }
    })
    
    return Array.from(venues)
  }

  extractVenuesWithContext(text) {
    const venues = []
    
    // Look for explicit recommendation patterns with better context
    const recommendationPatterns = [
      // Very specific patterns for real venue recommendations
      /(?:I recommend|recommend|suggest|try|visit|check out|go to|ate at|went to|stayed at|dined at)\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Park|Beach|Market))?)|(?:[A-Z][a-z]+'s(?:\s+[A-Z][a-z]+)*)|(?:[A-Z][a-z]+\s+&\s+[A-Z][a-z]+))/gi,
      // Venues with explicit location markers
      /((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Beach))?)|(?:[A-Z][a-z]+'s(?:\s+[A-Z][a-z]+)*)|(?:[A-Z][a-z]+\s+&\s+[A-Z][a-z]+))\s+(?:in|near|at)\s+(?:downtown|hotel zone|playa|centro|zona)/gi,
      // Venues followed by positive descriptors (but not starting with them)
      /((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery))?)|(?:[A-Z][a-z]+'s(?:\s+[A-Z][a-z]+)*)|(?:[A-Z][a-z]+\s+&\s+[A-Z][a-z]+))\s+(?:is amazing|is great|is excellent|is fantastic|was incredible|is the best|highly recommend)/gi,
      // Explicit venue types
      /((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Beach|Market|Cenote))/gi
    ]
    
    recommendationPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const venueName = match[1].trim()
        if (venueName && this.isActualVenueName(venueName)) {
          venues.push(venueName)
        }
      }
    })
    
    return venues
  }

  isActualVenueName(name) {
    // Much stricter validation for actual venue names
    const trimmed = name.trim()
    
    // Must be reasonable length
    if (trimmed.length < 3 || trimmed.length > 40) return false
    
    // Must start with capital letter
    if (!/^[A-Z]/.test(trimmed)) return false
    
    // Reject obvious non-venue patterns
    const rejectPatterns = [
      // Sentence starters
      /^(Do|He|She|I|We|They|You|It|This|That|These|Those|There|Here|When|Where|What|Why|How|Who)\b/i,
      // Common phrases that aren't venues  
      /^(OOP|Nice|Good|Bad|Best|Worst|Amazing|Awesome|Great|Excellent|Fantastic|Perfect|Wonderful)\b/i,
      // Sentence fragments
      /\b(goes to|been to|stuck in|adds some|more information|credit in|stuff from|story|went to)\b/i,
      // Professional/educational terms that aren't venues
      /^(Certifications?|Financial|National|International|Professional|Career|Test|Patent|Board|Commission|Conference)\s+(Association|Professionals?|Board|Committee|Commission|Conference|of|for)\b/i,
      // Generic descriptive phrases
      /^(Everyone's|I've|We've|You've|They've|What's|That's|It's)\b/i,
      // Contains obvious non-business words
      /\b(pregnancy|transplants|Canadian|descent|living|motorcycle|interests|beautiful|city)\b/i
    ]
    
    if (rejectPatterns.some(pattern => pattern.test(trimmed))) {
      return false
    }
    
    // Must look like a proper business name
    const isProperNoun = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Beach|Market|Cenote|Park))?$/.test(trimmed) ||
                        /^[A-Z][a-z]+'s(?:\s+[A-Z][a-z]+)*$/.test(trimmed) ||
                        /^[A-Z][a-z]+\s+&\s+[A-Z][a-z]+/.test(trimmed)
    
    // Additional checks for known good patterns
    const hasVenueKeywords = /\b(Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Beach|Market|Cenote|Park|Steakhouse|Grill)\b/i.test(trimmed)
    const isPossessiveName = /^[A-Z][a-z]+'s\b/.test(trimmed)
    const hasAmpersand = /\s+&\s+/.test(trimmed)
    
    return isProperNoun && (hasVenueKeywords || isPossessiveName || hasAmpersand || this.isKnownVenueName(trimmed))
  }

  isKnownVenueName(name) {
    // List of known venue names or patterns that should be accepted
    const knownPatterns = [
      /^Las\s+[A-Z][a-z]+/,  // Las Pozas, Las Cuevas, etc.
      /^San\s+[A-Z][a-z]+/,  // San Miguel, San Ignacio, etc.
      /^Templo\s+[A-Z][a-z]+/, // Templo Mayor
      /^Cenote\s+[A-Z][a-z]+/, // Cenote Santa Cruz
      /^Harry's\s+[A-Z][a-z]+/, // Harry's Steakhouse
      /^La\s+[A-Z][a-z]+/,   // La Chula, La Taque
      /^El\s+[A-Z][a-z]+/,   // El Something
      /Tulum/i,              // Tulum related venues
      /Akiin/i,              // Akiin Beach
      /Sikil/i,              // Sikil Restaurant
      /Rooftop/i,            // Rooftop venues
      /Hierve/i,             // Hierve del Agua
      /Barranca/i,           // Barranca de Metztitlan
    ]
    
    return knownPatterns.some(pattern => pattern.test(name))
  }

  looksLikeBusinessName(name) {
    // More sophisticated business name detection
    const trimmed = name.trim()
    
    // Must be reasonable length
    if (trimmed.length < 3 || trimmed.length > 35) return false
    
    // Must start with capital letter
    if (!/^[A-Z]/.test(trimmed)) return false
    
    // Should not be common words or phrases
    const commonPhrases = [
      'Amazing', 'Awesome', 'Great', 'Excellent', 'Fantastic', 'Perfect', 'Wonderful',
      'Best', 'Worst', 'Terrible', 'Awful', 'Good', 'Bad', 'Nice', 'Beautiful',
      'This', 'That', 'These', 'Those', 'Here', 'There', 'Where', 'When', 'How',
      'What', 'Why', 'Who', 'Which', 'Weather', 'Climate', 'Temperature',
      'They are', 'Also re', 'Re doing', 'The kids', 'Cultural experience',
      'Local experience', 'Travel experience', 'Popular destination'
    ]
    
    if (commonPhrases.some(phrase => trimmed.toLowerCase().startsWith(phrase.toLowerCase()))) {
      return false
    }
    
    // Should contain proper noun indicators
    const hasProperNounIndicators = 
      /[A-Z]/.test(trimmed.slice(1)) ||  // Has capital letters after first
      trimmed.includes("'") ||           // Has apostrophe (like "Joe's")
      trimmed.includes("&") ||           // Has ampersand (like "Smith & Co")
      trimmed.includes("-") ||           // Has hyphen
      /\b(Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Park|Beach|Market|Mall|Center|Centre)\b/.test(trimmed)
    
    return hasProperNounIndicators
  }

  extractPrices(text) {
    const prices = []
    
    this.patterns.prices.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const price = parseFloat(match[1])
        if (price > 0 && price < 1000) { // Reasonable price range
          prices.push({
            amount: price,
            context: this.extractPriceContext(text, match.index),
            raw: match[0]
          })
        }
      }
    })
    
    return prices
  }

  extractAddresses(text) {
    const addresses = []
    
    this.patterns.addresses.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          addresses.push(match.trim())
        })
      }
    })
    
    return addresses
  }

  extractTiming(text) {
    const timing = []
    
    this.patterns.timing.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          timing.push(match.trim())
        })
      }
    })
    
    return timing
  }

  analyzeSentiment(text) {
    const textLower = text.toLowerCase()
    let positiveScore = 0
    let negativeScore = 0
    
    this.sentimentWords.positive.forEach(word => {
      if (textLower.includes(word)) {
        positiveScore += 1
      }
    })
    
    this.sentimentWords.negative.forEach(word => {
      if (textLower.includes(word)) {
        negativeScore += 1
      }
    })
    
    // Normalize sentiment score between -1 and 1
    const totalWords = positiveScore + negativeScore
    if (totalWords === 0) return 0
    
    return (positiveScore - negativeScore) / totalWords
  }

  cleanVenueName(name) {
    return name
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  isValidVenueName(name) {
    // Filter out common false positives and comment fragments
    const invalidPatterns = [
      // Common words and phrases
      /^(the|a|an|and|or|but|in|on|at|to|for|of|with|by|is|was|are|were|will|would|could|should)$/i,
      // Generic venue types without specific names
      /^(hotel|restaurant|cafe|bar|club|museum|park|beach|market|attraction|place|spot)$/i,
      // Numbers only
      /^\d+$/,
      // All lowercase (likely not a proper noun)
      /^[a-z\s]+$/,
      // Comment fragments we've seen
      /^(awesome trip|great trip|amazing|excellent|fantastic|wonderful|incredible|perfect|best|worst|terrible|awful)$/i,
      // Incomplete sentences or phrases
      /^(due to|currently|although|this is|that was|it was|they are|we are|i am|you are)$/i,
      // Specific bad extractions we've observed
      /^(they are also|also re-doing|re-doing the|the kids|cultural experience|local experience|travel experience)$/i,
      // Sentence fragments with common words
      /\b(re-doing|also|kids|doing)\b/i,
      // Weather and general descriptions
      /^(weather|climate|temperature|sunny|rainy|hot|cold|warm|cool)$/i,
      // Generic positive/negative comments
      /^(highly|really|very|quite|pretty|so|such|just|only|even|also|too|more|most|less|least)$/i,
      // Sentence fragments
      /\b(is such a|are just|in general|currently poses|due to the)\b/i,
      // Contains common sentence structure words
      /\b(threat|poses|general|currently)\b/i
    ]
    
    // Must start with a capital letter and contain at least one more letter
    if (!/^[A-Z]/.test(name)) return false
    
    // Must not be too short or too long
    if (name.length < 3 || name.length > 40) return false
    
    // Must not match any invalid patterns
    if (invalidPatterns.some(pattern => pattern.test(name))) return false
    
    // Should contain at least one capital letter that's not the first character
    // (indicating it's likely a proper noun/business name)
    const hasProperNounStructure = /[A-Z]/.test(name.slice(1)) || 
                                   name.includes("'") || 
                                   name.includes("&") ||
                                   name.includes("-")
    
    // Additional validation: should look like a business name
    const looksLikeBusiness = /^[A-Z][a-zA-Z\s&'-]*[a-zA-Z]$/.test(name) &&
                             !name.endsWith(' is') &&
                             !name.endsWith(' was') &&
                             !name.endsWith(' are') &&
                             !name.endsWith(' the')
    
    return hasProperNounStructure && looksLikeBusiness
  }

  extractPriceContext(text, priceIndex) {
    // Extract 20 characters before and after the price for context
    const start = Math.max(0, priceIndex - 20)
    const end = Math.min(text.length, priceIndex + 30)
    return text.substring(start, end).trim()
  }

  aggregateVenueData(parsedPosts, parsedComments) {
    const venueMap = new Map()
    
    // Process posts
    parsedPosts.forEach(post => {
      this.processVenuesFromContent(post, venueMap, 'post')
    })
    
    // Process comments
    parsedComments.forEach(comment => {
      this.processVenuesFromContent(comment, venueMap, 'comment')
    })
    
    // Convert to array and sort by mention frequency and sentiment
    return Array.from(venueMap.values())
      .sort((a, b) => {
        const scoreA = a.mentionCount * (1 + a.avgSentiment)
        const scoreB = b.mentionCount * (1 + b.avgSentiment)
        return scoreB - scoreA
      })
  }

  processVenuesFromContent(content, venueMap, sourceType) {
    content.venues.forEach(venueName => {
      if (!venueMap.has(venueName)) {
        venueMap.set(venueName, {
          name: venueName,
          mentionCount: 0,
          prices: [],
          addresses: [],
          timing: [],
          sentiments: [],
          sources: []
        })
      }
      
      const venue = venueMap.get(venueName)
      venue.mentionCount++
      venue.prices.push(...content.prices)
      venue.addresses.push(...content.addresses)
      venue.timing.push(...content.timing)
      venue.sentiments.push(content.sentiment)
      venue.sources.push({
        type: sourceType,
        id: content.id,
        score: content.score || 0
      })
      
      // Calculate average sentiment
      venue.avgSentiment = venue.sentiments.reduce((sum, s) => sum + s, 0) / venue.sentiments.length
    })
  }

  categorizeVenue(venueName, context = '') {
    const name = venueName.toLowerCase()
    const fullContext = `${venueName} ${context}`.toLowerCase()
    
    if (name.includes('restaurant') || name.includes('cafe') || name.includes('bistro') || 
        fullContext.includes('food') || fullContext.includes('eat') || fullContext.includes('meal')) {
      return 'dining'
    }
    
    if (name.includes('museum') || name.includes('gallery') || name.includes('temple') || 
        name.includes('church') || fullContext.includes('culture') || fullContext.includes('history')) {
      return 'culture'
    }
    
    if (name.includes('bar') || name.includes('club') || name.includes('pub') || 
        fullContext.includes('nightlife') || fullContext.includes('drinks')) {
      return 'nightlife'
    }
    
    if (name.includes('park') || name.includes('beach') || name.includes('nature') || 
        fullContext.includes('outdoor') || fullContext.includes('hiking')) {
      return 'nature'
    }
    
    if (name.includes('market') || name.includes('mall') || name.includes('shop') || 
        fullContext.includes('shopping') || fullContext.includes('buy')) {
      return 'shopping'
    }
    
    if (name.includes('hotel') || name.includes('resort') || name.includes('hostel')) {
      return 'accommodation'
    }
    
    return 'attraction'
  }
}

export default new ContentParser() 