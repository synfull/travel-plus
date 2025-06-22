/**
 * AI-Enhanced Content Parser for Phase 2
 * Intelligent venue extraction with confidence scoring and semantic validation
 */
class ContentParser {
  constructor() {
    // Enhanced venue extraction patterns with confidence scoring
    this.venuePatterns = [
      {
        name: 'explicit_recommendation',
        pattern: /(?:recommend|suggest|try|visit|check out|go to|ate at|went to|stayed at|dined at)\s+([A-Z][a-zA-Z\s&'-]{3,35})/gi,
        confidence: 0.9,
        type: 'explicit'
      },
      {
        name: 'cultural_venues',
        pattern: /\b([A-Z][a-zA-Z\s&'-]+(?:Museum|Gallery|Temple|Palace|Cathedral|Church|Theater|Centre|Center))\b/gi,
        confidence: 0.8,
        type: 'cultural'
      },
      {
        name: 'dining_venues',
        pattern: /\b([A-Z][a-zA-Z\s&'-]+(?:Restaurant|Cafe|Bar|Bistro|Kitchen|Grill|Steakhouse))\b/gi,
        confidence: 0.8,
        type: 'dining'
      },
      {
        name: 'natural_attractions',
        pattern: /\b([A-Z][a-zA-Z\s&'-]+(?:Park|Garden|Beach|Lake|Mountain|Falls|Reserve))\b/gi,
        confidence: 0.7,
        type: 'natural'
      },
      {
        name: 'possessive_names',
        pattern: /\b([A-Z][a-zA-Z]+[''][sS]\s+[A-Z][a-zA-Z\s&'-]+)\b/gi,
        confidence: 0.8,
        type: 'possessive'
      },
      {
        name: 'quoted_venues',
        pattern: /"([A-Z][^"]{3,35})"/g,
        confidence: 0.6,
        type: 'quoted'
      },
      {
        name: 'location_context',
        pattern: /\b([A-Z][a-zA-Z\s&'-]{3,35})\s+(?:in|at|near|on)\s+[A-Z][a-zA-Z\s]+/g,
        confidence: 0.5,
        type: 'location_context'
      }
    ]

    // Business validation patterns
    this.businessValidation = {
      validBusinessWords: [
        'restaurant', 'cafe', 'bar', 'bistro', 'grill', 'kitchen', 'house', 'club',
        'hotel', 'resort', 'lodge', 'inn', 'hostel',
        'museum', 'gallery', 'theater', 'theatre', 'center', 'centre',
        'temple', 'church', 'cathedral', 'palace', 'shrine',
        'park', 'garden', 'beach', 'market', 'mall', 'plaza'
      ],
      businessIndicators: [
        /\b(est\.?\s+\d{4}|established\s+\d{4})\b/i,
        /\b(family\s+owned|locally\s+owned)\b/i,
        /\b(award\s+winning|michelin|zagat)\b/i,
        /\b(open\s+since|serving\s+since)\b/i
      ]
    }

    // Garbage detection patterns (expanded and more sophisticated)
    this.garbagePatterns = [
      // Sentence starters and common words
      /^(Do|He|She|I|We|They|You|It|This|That|These|Those|There|Here|When|Where|What|Why|How|Who|Was|Were|Is|Are|Will|Would|Could|Should|Have|Has|Had|Did|Does|Don't|Doesn't|Didn't|Won't|Wouldn't|Couldn't|Shouldn't|Haven't|Hasn't|Hadn't|Can't|Cannot|Mustn't|Isn't|Aren't|Wasn't|Weren't)\b/i,
      
      // Technical and business jargon
      /\b(troubleshooting|engineering|programming|specs|token|lineup|addons|dojo|tapings|reddit|reports|objects|emptying|congressional|republican|hunter|wilds|addition|liger|graphics|settings|adjusting)\b/i,
      
      // Action verbs that shouldn't start venue names
      /^(Get|Got|Make|Made|Take|Took|Give|Gave|Come|Came|Go|Went|See|Saw|Look|Looked|Tell|Told|Know|Knew|Think|Thought|Feel|Felt|Find|Found|Keep|Kept|Put|Placed|Turn|Turned|Become|Became|Seem|Seemed|Try|Tried|Ask|Asked|Work|Worked|Call|Called|Use|Used|Want|Wanted|Need|Needed|Like|Liked|Help|Helped|Show|Showed|Move|Moved|Play|Played|Run|Ran|Live|Lived|Believe|Believed|Bring|Brought|Happen|Happened|Write|Wrote|Provide|Provided|Sit|Sat|Stand|Stood|Lose|Lost|Pay|Paid|Meet|Met|Include|Included|Continue|Continued|Set|Let|Follow|Followed|Stop|Stopped|Create|Created|Speak|Spoke|Read|Read|Allow|Allowed|Add|Added|Spend|Spent|Grow|Grew|Open|Opened|Walk|Walked|Win|Won|Offer|Offered|Remember|Remembered|Love|Loved|Consider|Considered|Appear|Appeared|Buy|Bought|Wait|Waited|Serve|Served|Die|Died|Send|Sent|Expect|Expected|Build|Built|Stay|Stayed|Fall|Fell|Cut|Cut|Reach|Reached|Kill|Killed|Remain|Remained|Suggest|Suggested|Raise|Raised|Pass|Passed|Sell|Sold|Require|Required|Report|Reported|Decide|Decided|Pull|Pulled)\b/i,
      
      // Specific garbage we've seen in logs
      /^(Period Has Now Ended|The Key Specs|Basic Troubleshooting|Create Token Lineup|The Tv Guide Is Based|Tv Addons|Darcy Lapier|Gaber Is Interested|Njpw Dojo|Tna Tapings|Lesnar Made|Chinese Reddit|Sol This Year|Also Reports Of Objects|Posted This|Raf Brize Norton|Emptying The House|Columbia Engineering|Common App|Animal Reaction|Mark Jindrak|Antonio Inoki|Luigi Mangione Appears|Congressional District|Republican Town Hall|Monster Hunter Wilds|The Addition Of Liger|Spy Hunter|BUT THERE|Adjusting Graphics Settings If You|National Park Travelers Club|New Hampshire Museum|NH Heritage Museum|New Jersey Long Beach|Virginia Museum|Massachusetts Museum|National Museum|Minnesota Museum|California Museum|Wyoming Cheyenne Museum|Cheyenne Museum|State Park|New Hampshire|NH Heritage|Jersey Long Beach|California Europa|Wyoming Cheyenne|Prince Edward|National Park|Specific Park|Iowa State Park|Minnesota State Park|State Parks and Trails Hiking Club|Missouri State Park|Utah State Park|Canada - Park|Ontario Park|Astc Science Center|Kentucky State Park|Loneliest Road|Canada and One|both TOEFL and IELTS if it|Other Than the United States|Us and Itr|One Woman|Wild Casino|Overview BetOnline|Overview Ignition Casino|Reddit User Reviews Discussions|Final Thoughts|and researcher based in Miami Beach|Miami Beach|CONCLUSION Comerzbank|The Us and Broke Contact with Their|John Lived|Musk Protests at Union Square|Ceo Shooter Luigi Mangione Arrives|Chilean Woman on Vacation|Darcy Lapier at Club|class hotel|The Soka Gakkai|Honorary President Ikeda|Frank Ross|The Cold War|The World Tribune|Chicago Culture Center|Young People|Sgi Headquarters Chief|Daisaku Ikeda|Super New York)$/i,
      
      // Sentence fragments and incomplete thoughts
      /\b(has now ended|key specs|token lineup|guide is based|lapier|interested|dojo|tapings|made a lof|this year|reports of|this in|brize norton|the house|town hall|hunter wilds|broke contact|lived in|protests at|shooter|arrives|woman on|at club|headquarters chief|super)\b/i
    ]
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

  /**
   * Enhanced venue extraction with confidence scoring
   */
  extractVenues(text) {
    const venueResults = []
    
    // Apply each pattern and collect results with confidence scores
    this.venuePatterns.forEach(pattern => {
      let match
      while ((match = pattern.pattern.exec(text)) !== null) {
        const venueName = match[1] || match[0]
        const cleaned = this.cleanVenueName(venueName)
        
        if (cleaned && this.validateVenueName(cleaned)) {
          const confidence = this.calculateConfidence(cleaned, text, pattern)
          
          venueResults.push({
            name: cleaned,
            confidence: confidence,
            pattern: pattern.name,
            type: pattern.type,
            context: this.extractContext(text, match.index, 50)
          })
        }
      }
    })

    // Remove duplicates and sort by confidence
    const uniqueVenues = this.deduplicateVenues(venueResults)
    const highConfidenceVenues = uniqueVenues.filter(venue => venue.confidence >= 0.4)
    
    return highConfidenceVenues.sort((a, b) => b.confidence - a.confidence)
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
      /((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Restaurant|Cafe|Bar|Club|Hotel|Resort|Museum|Gallery|Beach|Market|Cenote))/gi,
      
      // ENHANCED PATTERNS FOR CULTURAL VENUES:
      
      // Temple and cultural site recommendations
      /(?:visit|see|check out|go to|don't miss)\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Temple|Shrine|Palace|Monastery|Wat|Pura|Candi))/gi,
      
      // Natural landmarks and viewpoints
      /(?:visit|see|hike to|go to)\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Falls|Waterfall|Lake|Mountain|Hill|Viewpoint|Lookout|Terrace|Terraces))/gi,
      
      // Cultural sites with descriptors
      /((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Temple|Palace|Museum|Gallery|Market|Village))\s+(?:is worth|is beautiful|is stunning|is amazing|is incredible|must see|don't miss)/gi,
      
      // Multi-word proper nouns (common for Asian venues)
      /(?:been to|visited|love|loved)\s+([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      
      // Rice terraces and natural sites
      /(?:visit|see|hike)\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Rice\s+Terraces?|Plantation|Forest|Park))/gi,
      
      // Traditional markets and districts
      /(?:shop at|visit|explore)\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Market|Night\s+Market|Traditional\s+Market|Art\s+Market))/gi,
      
      // Heritage and historical sites
      /(?:explore|visit|see)\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Heritage\s+Site|Historical\s+Site|Archaeological\s+Site|Cultural\s+Center))/gi,
      
      // Famous landmarks pattern
      /(?:famous|well-known|popular)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
      
      // Simple proper noun pairs/triplets (like "Tanah Lot", "Ubud Monkey Forest")
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was|temple|palace|museum|market|village|forest|lake|mountain)/gi
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

  /**
   * Advanced venue name validation with semantic understanding
   */
  validateVenueName(name) {
    const trimmed = name.trim()
    
    // Basic length and format checks
    if (trimmed.length < 3 || trimmed.length > 50) return false
    if (!/^[A-Z]/.test(trimmed)) return false
    
    // Immediately reject garbage patterns
    if (this.garbagePatterns.some(pattern => pattern.test(trimmed))) {
      return false
    }
    
    // Check for business legitimacy indicators
    return this.looksLikeBusinessName(trimmed)
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  calculateConfidence(venueName, context, pattern) {
    let confidence = pattern.confidence
    
    // Boost confidence for explicit business types
    if (this.businessValidation.validBusinessWords.some(word => 
      venueName.toLowerCase().includes(word)
    )) {
      confidence += 0.1
    }
    
    // Boost confidence for possessive names
    if (/[A-Z][a-z]+[''][sS]\s/.test(venueName)) {
      confidence += 0.1
    }
    
    // Boost confidence for context indicators
    const contextLower = context.toLowerCase()
    const positiveContextWords = ['recommend', 'amazing', 'great', 'excellent', 'love', 'best', 'favorite', 'must visit', 'don\'t miss']
    if (positiveContextWords.some(word => contextLower.includes(word))) {
      confidence += 0.1
    }
    
    // Reduce confidence for suspicious patterns
    const suspiciousWords = ['said', 'told', 'mentioned', 'heard', 'read', 'saw']
    if (suspiciousWords.some(word => contextLower.includes(word))) {
      confidence -= 0.1
    }
    
    // Reduce confidence for very long names (likely sentence fragments)
    if (venueName.length > 30) {
      confidence -= 0.2
    }
    
    // Ensure confidence stays within bounds
    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Extract context around a venue mention
   */
  extractContext(text, index, radius) {
    const start = Math.max(0, index - radius)
    const end = Math.min(text.length, index + radius)
    return text.substring(start, end).trim()
  }

  /**
   * Remove duplicate venues and merge confidence scores
   */
  deduplicateVenues(venueResults) {
    const venueMap = new Map()
    
    venueResults.forEach(venue => {
      const key = venue.name.toLowerCase().trim()
      
      if (venueMap.has(key)) {
        // Merge with existing venue, taking highest confidence
        const existing = venueMap.get(key)
        if (venue.confidence > existing.confidence) {
          venueMap.set(key, venue)
        }
      } else {
        venueMap.set(key, venue)
      }
    })
    
    return Array.from(venueMap.values())
  }

  isActualVenueName(name) {
    // EXTREMELY STRICT validation - only allow clearly identifiable venues
    const trimmed = name.trim()
    
    // Must be reasonable length
    if (trimmed.length < 3 || trimmed.length > 35) return false
    
    // IMMEDIATELY REJECT any text containing these problematic patterns
    const absoluteRejectPatterns = [
      // Sentence starters and pronouns
      /^(Do|He|She|I|We|They|You|It|This|That|These|Those|There|Here|When|Where|What|Why|How|Who|Was|Were|Is|Are|Will|Would|Could|Should|Have|Has|Had|Did|Does|Don't|Doesn't|Didn't|Won't|Wouldn't|Couldn't|Shouldn't|Haven't|Hasn't|Hadn't|Can't|Cannot|Mustn't|Isn't|Aren't|Wasn't|Weren't)\\b/i,
      
      // Specific garbage patterns we've seen in logs
      /^(Period Has Now Ended|The Key Specs|Basic Troubleshooting|Create Token Lineup|The Tv Guide Is Based|Tv Addons|Darcy Lapier|Gaber Is Interested|Njpw Dojo|Tna Tapings|Lesnar Made|Chinese Reddit|Sol This Year|Also Reports Of Objects|Posted This|Raf Brize Norton|Emptying The House|Columbia Engineering|Common App|Animal Reaction|Mark Jindrak|Antonio Inoki|Luigi Mangione Appears|Congressional District|Republican Town Hall|Monster Hunter Wilds|The Addition Of Liger|Spy Hunter)$/i,
      
      // Technical/business terms that shouldn't be venues
      /\\b(troubleshooting|engineering|programming|specs|token|lineup|addons|dojo|tapings|reddit|reports|objects|emptying|congressional|republican|hunter|wilds|addition|liger)\\b/i,
      
      // Action verbs and common sentence words
      /\\b(get|got|make|made|take|took|give|gave|come|came|go|went|see|saw|look|looked|tell|told|know|knew|think|thought|feel|felt|find|found|keep|kept|put|placed|turn|turned|become|became|seem|seemed|try|tried|ask|asked|work|worked|call|called|use|used|want|wanted|need|needed|like|liked|help|helped|show|showed|move|moved|play|played|run|ran|live|lived|believe|believed|bring|brought|happen|happened|write|wrote|provide|provided|sit|sat|stand|stood|lose|lost|pay|paid|meet|met|include|included|continue|continued|set|let|follow|followed|stop|stopped|create|created|speak|spoke|read|read|allow|allowed|add|added|spend|spent|grow|grew|open|opened|walk|walked|win|won|offer|offered|remember|remembered|love|loved|consider|considered|appear|appeared|buy|bought|wait|waited|serve|served|die|died|send|sent|expect|expected|build|built|stay|stayed|fall|fell|cut|cut|reach|reached|kill|killed|remain|remained|suggest|suggested|raise|raised|pass|passed|sell|sold|require|required|report|reported|decide|decided|pull|pulled)\\b/i
    ]
    
    // Immediately reject if ANY reject pattern matches
    if (absoluteRejectPatterns.some(pattern => pattern.test(trimmed))) {
      return false
    }
    
    // ONLY ALLOW venues that match EXPLICIT venue patterns
    const allowedVenuePatterns = [
      // Restaurants with explicit keywords
      /^[A-Z][a-zA-Z\s'&-]+\s+(Restaurant|Restaurante|Steakhouse|Grill|Bar|Cafe|Café|Cantina|Taqueria|Pizzeria|Bistro|Kitchen|House|Raw\s+Bar)$/i,
      
      // Hotels and accommodations
      /^[A-Z][a-zA-Z\s'&-]+\s+(Hotel|Resort|Lodge|Inn|Hostel|Casa|Hacienda|Rancho)$/i,
      
      // Museums and cultural sites  
      /^[A-Z][a-zA-Z\s'&-]+\s+(Museum|Museo|Gallery|Galeria|Theater|Theatre|Cinema|Library|Biblioteca|Temple|Templo|Church|Iglesia|Cathedral|Catedral|Palace|Palacio|Centro|Plaza)$/i,
      
      // Natural attractions
      /^[A-Z][a-zA-Z\s'&-]+\s+(Beach|Playa|Cenote|Laguna|Reserve|Reserva|Garden|Jardin|Park|Parque|Zone|Zona)$/i,
      
      // Shopping
      /^[A-Z][a-zA-Z\s'&-]+\s+(Market|Mall|Store|Shop|Tienda|Mercado|Plaza)$/i,
      
      // Possessive names (Harry's, Joe's, etc.)
      /^[A-Z][a-zA-Z]+[''][sS]\s+[A-Z][a-zA-Z\s]+$/,
      
      // Mexican location patterns (Las Pozas, San Miguel, etc.)
      /^(Las|Los|La|El|San|Santa|Santo|Nuestra|Señora)\s+[A-Z][a-zA-Z\s]+$/i,
      
      // Known specific venue names in Cancun area
      /^(Sikil|Akiin|Tulum|Chichen|Itza|Xel|Xcaret|Xplor|Coba|Uxmal|Palancar|Mesoamerican|MUSA|Underwater|Hierve|del|Agua)\b/i,
      
      // Cenotes (natural swimming holes)
      /^Cenote\s+[A-Z][a-zA-Z\s]+$/i,
      
      // Specific business patterns
      /^[A-Z][a-zA-Z]+\s+(de|del|de\s+la)\s+[A-Z][a-zA-Z\s]+$/i,
      
      // EXPANDED PATTERNS FOR MORE VENUES:
      
      // Asian cultural sites (temples, palaces, traditional sites)
      /^[A-Z][a-zA-Z\s'&-]+\s+(Temple|Shrine|Pagoda|Monastery|Wat|Pura|Candi|Palace|Royal|Traditional|Heritage|Cultural|Historic|Ancient)\s+[A-Z][a-zA-Z\s]*$/i,
      
      // Natural landmarks and attractions
      /^[A-Z][a-zA-Z\s'&-]+\s+(Falls|Waterfall|Lake|River|Mountain|Hill|Valley|Gorge|Canyon|Cliff|Viewpoint|Lookout|Terrace|Terraces)$/i,
      
      // Markets and local attractions
      /^[A-Z][a-zA-Z\s'&-]+\s+(Night\s+Market|Local\s+Market|Traditional\s+Market|Floating\s+Market|Art\s+Market|Craft\s+Market)$/i,
      
      // Specific venue structures (no generic words)
      /^[A-Z][a-zA-Z]{2,}\s+[A-Z][a-zA-Z\s'&-]*[A-Z][a-zA-Z]+$/,  // At least 2 proper nouns
      
      // Well-known landmark patterns
      /^(Mount|Mt|Lake|River|Fort|Castle|Tower|Bridge|Gate|Square|Circle|Point|Bay|Island|Volcano)\s+[A-Z][a-zA-Z\s]+$/i,
      
      // Traditional/cultural descriptors
      /^[A-Z][a-zA-Z\s'&-]+\s+(Village|Town|District|Quarter|Area|Complex|Center|Centre|Site|Spot|Place)$/i,
      
      // Rice terraces and agricultural sites (common in Bali/Asia)
      /^[A-Z][a-zA-Z\s'&-]+\s+(Rice\s+Terraces?|Plantation|Farm|Fields?)$/i,
      
      // Specific cultural venue types
      /^[A-Z][a-zA-Z\s'&-]+\s+(Art\s+Gallery|Cultural\s+Center|Heritage\s+Site|Historical\s+Site|Archaeological\s+Site)$/i,
      
      // Multi-word proper nouns (like "Tanah Lot", "Ubud Monkey Forest")
      /^[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*$/,
      
      // Compound venue names with common connectors
      /^[A-Z][a-zA-Z\s'&-]+\s+(and|&)\s+[A-Z][a-zA-Z\s'&-]+$/i
    ]
    
    // Must match at least one allowed pattern
    const matchesAllowedPattern = allowedVenuePatterns.some(pattern => pattern.test(trimmed))
    
    if (!matchesAllowedPattern) {
      return false
    }
    
    // Additional validation: must not contain obvious non-venue words
    const mustNotContain = /\b(comment|comments|information|confirmed|pregnancy|transplant|descent|motorcycle|beautiful|story|fake|april|time|living|went|been|stuck|adds|credit|stuff|trip|having|event|discussed|wished|knew|booked|seen|only|most|city|our|from|when|where|what|why|how|who|goes|never|around|better|see|likely|break|up|down|over|under|through|across|between|among|within|without|inside|outside|left|right)\b/i
    
    if (mustNotContain.test(trimmed)) {
      return false
    }
    
    return true
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

  /**
   * Enhanced business name detection with semantic analysis
   */
  looksLikeBusinessName(name) {
    const nameLower = name.toLowerCase()
    
    // Check for explicit business type indicators
    const hasBusinessType = this.businessValidation.validBusinessWords.some(word => 
      nameLower.includes(word)
    )
    
    // Check for business establishment indicators
    const hasBusinessIndicators = this.businessValidation.businessIndicators.some(pattern => 
      pattern.test(name)
    )
    
    // Check for proper noun structure (multiple capitalized words)
    const properNounCount = (name.match(/\b[A-Z][a-z]+/g) || []).length
    const hasProperStructure = properNounCount >= 2
    
    // Check for possessive structure (Joe's, Mary's, etc.)
    const hasPossessive = /[A-Z][a-z]+[''][sS]\s/.test(name)
    
    // Check for compound business names (& Co, and Sons, etc.)
    const hasCompoundStructure = /\s(&|and|&amp;)\s/i.test(name)
    
    // Must have at least one business legitimacy indicator
    return hasBusinessType || hasBusinessIndicators || hasProperStructure || hasPossessive || hasCompoundStructure
  }

  extractPrices(text) {
    const prices = []
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)\s*(?:per person|pp|each|USD|dollars?)?/gi,
      /\$(\d+)-\$?(\d+)/g,
      /(?:around|about|roughly|approximately)\s*\$(\d+)/gi
    ]
    
    pricePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        if (match[2]) {
          prices.push({ min: parseInt(match[1]), max: parseInt(match[2]) })
        } else {
          prices.push({ amount: parseInt(match[1]) })
        }
      }
    })
    
    return prices
  }

  extractAddresses(text) {
    const addresses = []
    const addressPatterns = [
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Plaza|Plz)\b/gi,
      /(?:in|at|near)\s+([A-Z][a-zA-Z\s]{3,25}(?:Zone|Area|District|Quarter|Neighborhood))/gi
    ]
    
    addressPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        addresses.push(match[0])
      }
    })
    
    return addresses
  }

  extractTiming(text) {
    const timing = []
    const timingPatterns = [
      /(\d+(?:-\d+)?)\s*(?:hours?|hrs?|minutes?|mins?|days?)/gi,
      /(\d{1,2}(?::\d{2})?)\s*(?:am|pm|AM|PM)\s*-\s*(\d{1,2}(?::\d{2})?)\s*(?:am|pm|AM|PM)/gi
    ]
    
    timingPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        timing.push(match[0])
      }
    })
    
    return timing
  }

  analyzeSentiment(text) {
    const positiveWords = ['amazing', 'awesome', 'excellent', 'fantastic', 'great', 'incredible', 'love', 'perfect', 'wonderful', 'best', 'favorite', 'recommend', 'must visit', 'don\'t miss']
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'overrated', 'avoid', 'skip', 'waste', 'bad', 'poor']
    
    const textLower = text.toLowerCase()
    let score = 0
    
    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 1
    })
    
    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 1
    })
    
    return Math.max(-1, Math.min(1, score / 10))
  }

  cleanVenueName(name) {
    if (!name) return null
    
    // Remove extra whitespace and trim
    let cleaned = name.trim().replace(/\s+/g, ' ')
    
    // Remove descriptive suffixes that got captured by patterns
    cleaned = cleaned.replace(/\s+(-\s*[a-z].*|for\s+[a-z].*|with\s+[a-z].*|is\s+[a-z].*|was\s+[a-z].*)$/i, '')
    
    // Remove sentence starters that got captured
    cleaned = cleaned.replace(/^(But\s+There\s+Are\s+Some\s+Good\s+Places\s+Like\s+|Visit\s+the\s+|Try\s+|Go\s+to\s+|Check\s+out\s+)/i, '')
    
    // Capitalize properly - handle special cases
    cleaned = cleaned.split(' ').map(word => {
      // Don't capitalize articles, prepositions, and conjunctions unless they're the first word
      const lowerCaseWords = ['a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'to', 'from', 'up', 'out', 'off', 'over', 'under', 'above', 'below', 'across', 'through', 'during', 'before', 'after', 'since', 'until', 'between', 'among', 'within', 'without', 'inside', 'outside', 'near', 'far', 'around', 'about', 'against', 'toward', 'towards', 'behind', 'beyond', 'beneath', 'beside', 'besides', 'into', 'onto', 'upon', 'within', 'without', 'de', 'del', 'la', 'el', 'las', 'los']
      
      // Always capitalize first word
      if (cleaned.split(' ').indexOf(word) === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      }
      
      // Handle contractions (don't split on apostrophes)
      if (word.includes("'")) {
        const parts = word.split("'")
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() + "'" + parts[1].toLowerCase()
      }
      
      // Don't capitalize articles and prepositions
      if (lowerCaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      
      // Capitalize everything else
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }).join(' ')
    
    // Handle special venue type capitalizations
    cleaned = cleaned.replace(/\bmuseum\b/gi, 'Museum')
    cleaned = cleaned.replace(/\brestaurant\b/gi, 'Restaurant')
    cleaned = cleaned.replace(/\bhotel\b/gi, 'Hotel')
    cleaned = cleaned.replace(/\bcafe\b/gi, 'Cafe')
    cleaned = cleaned.replace(/\bbar\b/gi, 'Bar')
    cleaned = cleaned.replace(/\bgallery\b/gi, 'Gallery')
    cleaned = cleaned.replace(/\btheater\b/gi, 'Theater')
    cleaned = cleaned.replace(/\btheatre\b/gi, 'Theatre')
    cleaned = cleaned.replace(/\bchurch\b/gi, 'Church')
    cleaned = cleaned.replace(/\bcathedral\b/gi, 'Cathedral')
    cleaned = cleaned.replace(/\btemple\b/gi, 'Temple')
    cleaned = cleaned.replace(/\bpalace\b/gi, 'Palace')
    cleaned = cleaned.replace(/\bpark\b/gi, 'Park')
    cleaned = cleaned.replace(/\bbeach\b/gi, 'Beach')
    cleaned = cleaned.replace(/\bmarket\b/gi, 'Market')
    cleaned = cleaned.replace(/\bmall\b/gi, 'Mall')
    cleaned = cleaned.replace(/\bcenter\b/gi, 'Center')
    cleaned = cleaned.replace(/\bcentre\b/gi, 'Centre')
    cleaned = cleaned.replace(/\bresort\b/gi, 'Resort')
    cleaned = cleaned.replace(/\blodge\b/gi, 'Lodge')
    cleaned = cleaned.replace(/\binn\b/gi, 'Inn')
    cleaned = cleaned.replace(/\bhostel\b/gi, 'Hostel')
    cleaned = cleaned.replace(/\bgrill\b/gi, 'Grill')
    cleaned = cleaned.replace(/\bsteakhouse\b/gi, 'Steakhouse')
    cleaned = cleaned.replace(/\bbistro\b/gi, 'Bistro')
    cleaned = cleaned.replace(/\bkitchen\b/gi, 'Kitchen')
    cleaned = cleaned.replace(/\bhouse\b/gi, 'House')
    cleaned = cleaned.replace(/\bclub\b/gi, 'Club')
    cleaned = cleaned.replace(/\bstore\b/gi, 'Store')
    cleaned = cleaned.replace(/\bshop\b/gi, 'Shop')
    
    return cleaned
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