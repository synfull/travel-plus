// Main itinerary generation orchestration function

export async function handler(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
    }
  
    try {
      console.log('📝 Raw request body:', event.body)
      const tripData = JSON.parse(event.body)
      console.log('📊 Parsed trip data:', tripData)
      
      // Validate required fields
      if (!tripData.destination || !tripData.startDate || !tripData.endDate) {
        console.log('❌ Missing required fields:', {
          destination: !!tripData.destination,
          startDate: !!tripData.startDate,
          endDate: !!tripData.endDate
        })
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing required fields' }),
        }
      }
  
      // Log for monitoring (remove sensitive data)
      console.log('Generating itinerary for:', {
        destination: tripData.destination,
        dates: `${tripData.startDate} to ${tripData.endDate}`,
        budget: tripData.totalBudget,
        people: tripData.people,
      })
  
      // Step 1: Search for flights
      const flightPromise = searchFlights({
        origin: tripData.origin,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        passengers: tripData.people,
      })
  
      // Step 2: Search for hotels
      const hotelPromise = searchHotels({
        destination: tripData.destination,
        checkinDate: tripData.startDate,
        checkoutDate: tripData.endDate,
        guests: tripData.people,
        budget: tripData.budgetPerPerson * 0.3, // Allocate 30% for accommodation
      })
  
      // Step 3: Search for activities
      const activitiesPromise = searchActivities({
        destination: tripData.destination,
        categories: tripData.categories,
        budget: tripData.budgetPerPerson * 0.3, // Allocate 30% for activities
        duration: calculateDays(tripData.startDate, tripData.endDate),
      })
  
      // Execute all searches in parallel
      console.log('🔍 Starting parallel searches...')
      const [flights, hotels, activities] = await Promise.all([
        flightPromise,
        hotelPromise,
        activitiesPromise,
      ])
      console.log('✅ All searches completed:', {
        flights: !!flights,
        hotels: hotels?.length || 0,
        activities: activities?.length || 0
      })
  
      // Step 4: Generate AI-powered itinerary
      const itinerary = await generateAIItinerary({
        tripData,
        flights,
        hotels,
        activities,
      })
  
      // Step 5: Optimize for budget
      const optimizedItinerary = await optimizeBudget({
        itinerary,
        maxBudget: tripData.totalBudget,
        includeFlights: tripData.includeFlights,
      })
  
      // Step 6: Add affiliate links
      const finalItinerary = addAffiliateLinks(optimizedItinerary)
  
      // Add an ID to the itinerary
      const itineraryWithId = {
        ...finalItinerary,
        id: generateItineraryId(),
      }
  
      // Return success response
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          itinerary: itineraryWithId,
          metadata: {
            generatedAt: new Date().toISOString(),
            totalCost: calculateTotalCost(itineraryWithId),
            daysCount: calculateDays(tripData.startDate, tripData.endDate),
          },
        }),
      }
    } catch (error) {
      console.error('Itinerary generation error:', error)
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to generate itinerary',
          message: error.message,
        }),
      }
    }
  }
  
  // Helper functions (these would be imported from other modules in production)
  
  function generateItineraryId() {
    return `itin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  async function searchFlights({ origin, destination, startDate, endDate, passengers }) {
    try {
      console.log('🔍 Calling real flight search API...')
      
      // Call our dedicated flight search function
      const flightSearchUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/search-flights`
      
      const response = await fetch(flightSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin,
          destination,
          startDate,
          endDate,
          passengers
        })
      })

      if (!response.ok) {
        throw new Error(`Flight search failed: ${response.status}`)
      }

      const flightData = await response.json()
      
      if (flightData.success && flightData.flights.length > 0) {
        // Return only the best flight option to reduce data
        const bestFlight = flightData.flights[0]
        
        return {
          outbound: bestFlight.outbound,
          return: bestFlight.return,
          totalPrice: bestFlight.totalPrice,
          currency: bestFlight.currency,
          bookingUrl: bestFlight.bookingUrl,
          source: 'amadeus'
        }
      } else {
        throw new Error('No flights found')
      }
      
    } catch (error) {
      console.warn('⚠️ Flight search failed, using fallback:', error.message)
      
      // Fallback to mock data
      return {
        outbound: {
          airline: 'American Airlines',
          flightNumber: 'AA123',
          departure: `${startDate}T08:00:00`,
          arrival: `${startDate}T12:00:00`,
          price: 324 * passengers,
        },
        return: endDate ? {
          airline: 'American Airlines',
          flightNumber: 'AA456',
          departure: `${endDate}T16:00:00`,
          arrival: `${endDate}T23:00:00`,
          price: 324 * passengers,
        } : null,
        totalPrice: 648 * passengers,
        source: 'fallback'
      }
    }
  }
  
  async function searchHotels({ destination, checkinDate, checkoutDate, guests, budget }) {
    try {
      console.log('🔍 Calling real hotel search API...')
      
      // Call our dedicated hotel search function
      const hotelSearchUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/search-hotels`
      
      const response = await fetch(hotelSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination,
          checkinDate,
          checkoutDate,
          guests,
          maxPrice: budget ? Math.round(budget * 1.5) : null // Allow 50% over budget for flexibility
        })
      })

      if (!response.ok) {
        throw new Error(`Hotel search failed: ${response.status}`)
      }

      const hotelData = await response.json()
      
      if (hotelData.success && hotelData.hotels.length > 0) {
        // Return only top 5 hotels to reduce AI processing load
        return hotelData.hotels.slice(0, 5).map(hotel => ({
          name: hotel.name,
          rating: hotel.rating,
          price: hotel.pricePerNight,
          location: hotel.location,
          address: hotel.address,
          amenities: hotel.amenities?.slice(0, 4) || [], // Limit amenities
          images: hotel.images?.slice(0, 2) || [], // Limit images
          image: hotel.images?.[0] || 'https://via.placeholder.com/400x300',
          room: hotel.room,
          policies: hotel.policies,
          bookingUrl: hotel.bookingUrl,
          source: 'real_api'
        }))
      } else {
        throw new Error('No hotels found')
      }
      
    } catch (error) {
      console.warn('⚠️ Hotel search failed, using fallback:', error.message)
      
      // Fallback to simplified mock data
      return [
        {
          name: 'Beachfront Resort & Spa',
          rating: 4.5,
          price: 180,
          location: 'Hotel Zone',
          amenities: ['Pool', 'Free WiFi', 'Breakfast'],
          image: 'https://via.placeholder.com/400x300',
          source: 'fallback'
        },
        {
          name: 'Downtown Boutique Hotel',
          rating: 4.3,
          price: 120,
          location: 'City Center',
          amenities: ['Free WiFi', 'Gym'],
          image: 'https://via.placeholder.com/400x300',
          source: 'fallback'
        },
      ]
    }
  }
  
  async function searchActivities({ destination, categories, budget, duration }) {
    try {
      console.log('🔍 Calling real venue discovery system...')
      
      // Simple Google Places API call via proxy instead of complex VenueDiscoveryEngine
      const venueSearchUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/google-places-proxy`
      
      // Get coordinates for destination first
      const geocodeResponse = await fetch(`${venueSearchUrl}?endpoint=geocode&params.address=${encodeURIComponent(destination)}`)
      
      if (!geocodeResponse.ok) {
        throw new Error('Geocoding failed')
      }
      
      const geocodeData = await geocodeResponse.json()
      const location = geocodeData.results[0]?.geometry?.location
      
      if (!location) {
        throw new Error('Could not geocode destination')
      }
      
      // Search for venues based on categories
      const keywords = categories.includes('food') ? ['restaurants', 'cafes'] : 
                      categories.includes('culture') ? ['museums', 'attractions'] :
                      ['tourist_attraction']
      
      const allVenues = []
      
      // Search for venues with different keywords (limit searches to save time)
      for (const keyword of keywords.slice(0, 2)) { // Only 2 searches max
        try {
          const venueResponse = await fetch(
            `${venueSearchUrl}?endpoint=nearbysearch&params.location=${location.lat},${location.lng}&params.radius=5000&params.keyword=${encodeURIComponent(keyword)}`
          )
          
          if (venueResponse.ok) {
            const venueData = await venueResponse.json()
            if (venueData.results) {
              allVenues.push(...venueData.results.slice(0, 8)) // Limit per keyword
            }
          }
        } catch (err) {
          console.warn(`Failed to search for ${keyword}:`, err.message)
        }
      }
      
      if (allVenues.length > 0) {
        // Transform venues to activity format and limit to top 12
        const activities = allVenues.slice(0, 12).map(venue => ({
          name: venue.name,
          category: mapVenueTypeToCategory(venue.types?.[0]) || 'culture',
          price: venue.price_level ? venue.price_level * 25 : 35,
          duration: '2-3 hours',
          description: `Experience ${venue.name} in ${destination}`,
          location: venue.geometry?.location,
          rating: venue.rating,
          address: venue.vicinity,
          source: 'google_places'
        }))
        
        console.log(`✅ Found ${activities.length} real venues from Google Places`)
        return activities
      } else {
        throw new Error('No venues found')
      }
      
    } catch (error) {
      console.warn('⚠️ Venue discovery failed, using simplified mock data:', error.message)
      
      // Minimal fallback activities to reduce AI processing time
      const fallbackActivities = [
        {
          name: `${destination} Food Tour`,
          category: 'food',
          price: 65,
          duration: '3 hours',
          description: `Discover authentic local cuisine in ${destination}`,
          source: 'fallback'
        },
        {
          name: `${destination} Cultural Experience`,
          category: 'culture', 
          price: 45,
          duration: '2 hours',
          description: `Explore the cultural highlights of ${destination}`,
          source: 'fallback'
        }
      ]
      
      // Filter by selected categories
      return fallbackActivities.filter(activity => 
        categories.includes(activity.category)
      )
    }
  }
  
  // Helper function to map Google Places types to our categories
  function mapVenueTypeToCategory(placeType) {
    const typeMapping = {
      'restaurant': 'food',
      'cafe': 'food', 
      'bar': 'nightlife',
      'museum': 'culture',
      'tourist_attraction': 'culture',
      'shopping_mall': 'shopping',
      'amusement_park': 'adventure',
      'park': 'adventure',
      'night_club': 'nightlife'
    }
    
    return typeMapping[placeType] || 'culture'
  }
  
  async function generateAIItinerary({ tripData, flights, hotels, activities }) {
    // Call DeepSeek API with proper timeout handling (fixed race condition)
    try {
      // Try both environment variable names (Netlify functions don't use VITE_ prefix)
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY
      
      console.log('🔑 API Key check:', deepseekApiKey ? 'Found' : 'Not found')
      
      if (!deepseekApiKey) {
        console.log('No DeepSeek API key found, using structured fallback')
        return generateStructuredItinerary({ tripData, flights, hotels, activities })
      }

      const prompt = createItineraryPrompt(tripData, activities, hotels)
      
      console.log('🤖 Calling DeepSeek API with 15-second timeout (race condition fixed)...')
      console.log('📝 Prompt length:', prompt.length, 'characters')
      
      // Create AbortController for fetch timeout
      const controller = new AbortController()
      let fetchTimeoutId
      let raceTimeoutId
      
      try {
        // Create the API call promise with proper cleanup
        const apiPromise = fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are a travel planner. Create concise itineraries. Be extremely brief and use minimal tokens.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 800,
            temperature: 0.1,
            stream: false
          }),
          signal: controller.signal
        })

        // Set up fetch timeout
        fetchTimeoutId = setTimeout(() => {
          console.log('⏰ Fetch timeout - aborting request after 12 seconds')
          controller.abort()
        }, 12000)
        
        // Set up race timeout  
        const timeoutPromise = new Promise((_, reject) => {
          raceTimeoutId = setTimeout(() => {
            console.log('⏰ Overall timeout - 15 seconds elapsed')
            reject(new Error('DeepSeek API timeout after 15 seconds'))
          }, 15000)
        })

        // Race between API call and timeout
        console.log('📡 Starting API call race...')
        const response = await Promise.race([apiPromise, timeoutPromise])

        // SUCCESS - Clear all timeouts
        clearTimeout(fetchTimeoutId)
        clearTimeout(raceTimeoutId)
        
        console.log('📡 DeepSeek fetch completed successfully, status:', response.status)

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
        }

        console.log('📦 Parsing DeepSeek response...')
        const aiResponse = await response.json()
        console.log('🤖 DeepSeek response received and parsed')
        
        const aiContent = aiResponse.choices[0]?.message?.content
        
        if (!aiContent) {
          throw new Error('No content received from DeepSeek')
        }

        console.log('📝 AI response length:', aiContent.length, 'characters')
        console.log('📝 AI response preview:', aiContent.substring(0, 200) + '...')

        // Parse the AI response and structure it
        const structuredItinerary = parseAIResponse(aiContent, tripData, activities, hotels, flights)
        
        console.log('✅ AI-generated itinerary created successfully')
        return structuredItinerary

      } catch (error) {
        // Cleanup timeouts on any error
        if (fetchTimeoutId) clearTimeout(fetchTimeoutId)
        if (raceTimeoutId) clearTimeout(raceTimeoutId)
        throw error
      }

    } catch (error) {
      console.warn('🕐 DeepSeek API failed/timeout:', error.message)
      console.log('📊 Error type:', error.constructor.name)
      console.log('✅ Falling back to structured itinerary generation with REAL data')
      return generateStructuredItinerary({ tripData, flights, hotels, activities })
    }
  }

  function createItineraryPrompt(tripData, activities, hotels) {
    const days = calculateDays(tripData.startDate, tripData.endDate)
    
    // Ultra-streamlined prompt for faster processing
    const topActivities = activities.slice(0, 5) // Only top 5 activities
    
    return `Create ${days}-day Tokyo itinerary. Budget: $${tripData.totalBudget}. ${tripData.people} people.

Activities: ${topActivities.map(a => a.name).join(', ')}

Return only JSON:
{"days":[{"dayNumber":1,"morning":{"activity":"Name","cost":50},"afternoon":{"activity":"Name","cost":60},"evening":{"activity":"Name","cost":45}}],"overview":"Brief summary"}`
  }

  function parseAIResponse(aiContent, tripData, activities, hotels, flights) {
    try {
      // Try to extract JSON from the AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      let parsedResponse;
      
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }

      const days = calculateDays(tripData.startDate, tripData.endDate);
      const dailyItinerary = [];

      // Process AI-generated days
      for (let i = 0; i < days; i++) {
        const aiDay = parsedResponse.days?.[i];
        const dayDate = new Date(tripData.startDate);
        dayDate.setDate(dayDate.getDate() + i);

        // Add location data to AI-generated activities
        const addLocationToActivity = (activity) => {
          if (!activity) return null;
          
          // Try to match with available activities that have locations
          const matchedActivity = activities.find(a => 
            a.name.toLowerCase().includes(activity.activity?.toLowerCase()) ||
            activity.activity?.toLowerCase().includes(a.name.toLowerCase())
          );

          return {
            ...activity,
            location: matchedActivity?.location || generateRandomLocation(tripData.destination),
            type: matchedActivity?.category || 'activity'
          };
        };

        dailyItinerary.push({
          dayNumber: i + 1,
          date: dayDate.toISOString().split('T')[0],
          title: aiDay?.title || `Day ${i + 1} in ${tripData.destination}`,
          morning: addLocationToActivity(aiDay?.morning) || {
            time: '9:00 AM',
            activity: 'Explore Local Attractions',
            description: `Start your day exploring ${tripData.destination}`,
            estimatedCost: 50,
            location: generateRandomLocation(tripData.destination),
            type: 'sightseeing'
          },
          afternoon: addLocationToActivity(aiDay?.afternoon) || {
            time: '2:00 PM',
            activity: 'Local Cuisine Experience',
            description: `Enjoy local cuisine in ${tripData.destination}`,
            estimatedCost: 60,
            location: generateRandomLocation(tripData.destination),
            type: 'dining'
          },
          evening: addLocationToActivity(aiDay?.evening) || {
            time: '7:00 PM',
            activity: 'Cultural Experience',
            description: 'Immerse in local culture',
            estimatedCost: 45,
            location: generateRandomLocation(tripData.destination),
            type: 'culture'
          }
        });
      }

      return {
        id: generateItineraryId(),
        destination: tripData.destination,
        title: `${tripData.destination} Adventure`,
        overview: parsedResponse.overview || `Experience the best of ${tripData.destination} with this AI-curated itinerary.`,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        people: tripData.people,
        categories: tripData.categories,
        days: dailyItinerary,
        hotels: hotels,
        flights: flights,
        insiderTips: parsedResponse.insiderTips || [
          `Book accommodations in advance for better rates in ${tripData.destination}`,
          'Try to learn a few basic phrases in the local language',
          'Always carry a portable charger and download offline maps'
        ],
        isGenerated: true,
        isAIGenerated: true,
        generatedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('AI Response:', aiContent);
      return generateStructuredItinerary({ tripData, flights, hotels, activities });
    }
  }

  function getDestinationCoords(destination) {
    const destinationCoords = {
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Cancun': { lat: 21.1619, lng: -86.8515 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'New York': { lat: 40.7128, lng: -74.0060 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Dubai': { lat: 25.2048, lng: 55.2708 },
      'Bali': { lat: -8.3405, lng: 115.0920 },
      'Bali, Indonesia': { lat: -8.3405, lng: 115.0920 },
      'Rome': { lat: 41.9028, lng: 12.4964 },
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Bangkok': { lat: 13.7563, lng: 100.5018 },
      'Sydney': { lat: -33.8688, lng: 151.2093 }
    };

    // Try exact match first, then partial match
    let baseCoords = destinationCoords[destination];
    
    if (!baseCoords) {
      // Try to find a partial match (e.g., "Bali" in "Bali, Indonesia")
      const destinationKey = Object.keys(destinationCoords).find(key => 
        destination.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(destination.toLowerCase())
      );
      baseCoords = destinationKey ? destinationCoords[destinationKey] : { lat: 0, lng: 0 };
    }
    
    return baseCoords;
  }

  function generateRandomLocation(destination) {
    const baseCoords = getDestinationCoords(destination);
    
    console.log(`🗺️ Location lookup for "${destination}":`, baseCoords);
    
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.02
    };
  }

  function generateStructuredItinerary({ tripData, flights, hotels, activities }) {
    // Fallback structured generation (existing logic)
    const days = calculateDays(tripData.startDate, tripData.endDate)
    const dailyItinerary = []
    
    for (let i = 0; i < days; i++) {
      const dayDate = new Date(tripData.startDate)
      dayDate.setDate(dayDate.getDate() + i)
      
      // Distribute activities across days
      const dayActivities = activities.slice(i * 2, (i + 1) * 2) // 2 activities per day
      
      dailyItinerary.push({
        dayNumber: i + 1,
        date: dayDate.toISOString().split('T')[0],
        title: `Day ${i + 1} in ${tripData.destination}`,
        morning: {
          time: '9:00 AM',
          activity: dayActivities[0]?.name || 'Explore Local Attractions',
          description: dayActivities[0]?.description || `Start your day exploring the highlights of ${tripData.destination}, checking out popular landmarks and local hotspots.`,
          estimatedCost: dayActivities[0]?.price || 25,
          location: dayActivities[0]?.location || generateRandomLocation(tripData.destination),
          type: dayActivities[0]?.category || 'sightseeing'
        },
        afternoon: {
          time: '2:00 PM',
          activity: dayActivities[1]?.name || 'Local Cuisine Experience',
          description: dayActivities[1]?.description || `Enjoy authentic local cuisine at recommended restaurants, trying the signature dishes of ${tripData.destination}.`,
          estimatedCost: dayActivities[1]?.price || 40,
          location: dayActivities[1]?.location || generateRandomLocation(tripData.destination),
          type: dayActivities[1]?.category || 'dining'
        },
        evening: {
          time: '7:00 PM',
          activity: 'Cultural Experience',
          description: `Immerse yourself in the local culture with evening activities like live music, local markets, or traditional performances.`,
          estimatedCost: 35,
          location: activities[Math.floor(Math.random() * activities.length)]?.location || generateRandomLocation(tripData.destination),
          type: 'culture'
        }
      })
    }
    
    return {
      id: generateItineraryId(),
      destination: tripData.destination,
      title: `${tripData.destination} Adventure`,
      overview: `Experience the best of ${tripData.destination} with this carefully curated itinerary featuring the perfect blend of adventure, culture, and relaxation.`,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      people: tripData.people,
      categories: tripData.categories,
      days: dailyItinerary,
      hotels: hotels,
      flights: flights,
      insiderTips: [
        `Book accommodations in advance for better rates in ${tripData.destination}`,
        'Try to learn a few basic phrases in the local language',
        'Always carry a portable charger and download offline maps',
        'Research local customs and tipping practices before your trip'
      ],
      isGenerated: true,
      generatedAt: new Date().toISOString(),
    }
  }
  
  function optimizeBudget({ itinerary, maxBudget, includeFlights }) {
    // Calculate current costs
    const costs = calculateCosts(itinerary, includeFlights)
    
    if (costs.total <= maxBudget) {
      return {
        ...itinerary,
        budgetSummary: costs
      }
    }
    
    // If over budget, reduce activity costs proportionally
    const overage = costs.total - maxBudget
    const reductionFactor = Math.max(0.7, (maxBudget - costs.flights - costs.accommodation) / costs.activities)
    
    // Reduce activity costs
    const optimizedDays = itinerary.days.map(day => ({
      ...day,
      morning: {
        ...day.morning,
        estimatedCost: Math.round(day.morning.estimatedCost * reductionFactor)
      },
      afternoon: {
        ...day.afternoon,
        estimatedCost: Math.round(day.afternoon.estimatedCost * reductionFactor)
      },
      evening: {
        ...day.evening,
        estimatedCost: Math.round(day.evening.estimatedCost * reductionFactor)
      }
    }))
    
    return {
      ...itinerary,
      days: optimizedDays,
      budgetSummary: calculateCosts({ ...itinerary, days: optimizedDays }, includeFlights)
    }
  }
  
  function addAffiliateLinks(itinerary) {
    // Add affiliate links to hotels and activities
    // This would integrate with booking platforms
    return {
      ...itinerary,
      hotels: itinerary.hotels?.map(hotel => ({
        ...hotel,
        bookingUrl: `https://booking.com/hotel/${hotel.name.toLowerCase().replace(/\s+/g, '-')}`
      })),
      affiliateDisclaimer: 'This itinerary may contain affiliate links. We earn a small commission at no extra cost to you.'
    }
  }
  
  function calculateDays(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
  
  function calculateTotalCost(itinerary) {
    return calculateCosts(itinerary, true).total
  }
  
  function calculateCosts(itinerary, includeFlights) {
    const flightCost = includeFlights ? (itinerary.flights?.totalPrice || 0) : 0
    const hotelCost = itinerary.hotels?.reduce((sum, hotel) => sum + hotel.price, 0) || 0
    const activityCost = itinerary.days?.reduce((sum, day) => {
      return sum + (day.morning?.estimatedCost || 0) + (day.afternoon?.estimatedCost || 0) + (day.evening?.estimatedCost || 0)
    }, 0) || 0
    
    return {
      flights: flightCost,
      accommodation: hotelCost * (itinerary.days?.length - 1 || 1), // Nights = days - 1
      activities: activityCost,
      meals: Math.round(activityCost * 0.4), // Estimate meals as 40% of activity cost
      total: flightCost + (hotelCost * (itinerary.days?.length - 1 || 1)) + activityCost + Math.round(activityCost * 0.4)
    }
  }