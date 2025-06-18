import recommendationEngine from '../reddit/recommendationEngine.js'

class SmartItineraryGenerator {
  constructor() {
    this.destinationCoords = {
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Cancun': { lat: 21.1619, lng: -86.8515 },
      'Cancun, Mexico': { lat: 21.1619, lng: -86.8515 },
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
    }
  }

  async generateSmartItinerary(tripData) {
    console.log('🧠 Generating smart itinerary with Reddit research for:', tripData.destination)
    
    try {
      // Step 1: Get Reddit-based recommendations
      const recommendations = await recommendationEngine.generateRecommendations(tripData)
      console.log(`📊 Received ${recommendations.length} Reddit recommendations`)
      
      // Step 2: Organize recommendations by category and time
      const organizedRecommendations = this.organizeRecommendations(recommendations)
      console.log('🎯 Organized recommendations by time slot:', organizedRecommendations)
      
      // Debug: Show what we have for each time slot
      console.log('📊 Morning recommendations:', Object.keys(organizedRecommendations.morning).map(cat => 
        `${cat}: ${organizedRecommendations.morning[cat].length}`
      ))
      console.log('📊 Afternoon recommendations:', Object.keys(organizedRecommendations.afternoon).map(cat => 
        `${cat}: ${organizedRecommendations.afternoon[cat].length}`
      ))
      console.log('📊 Evening recommendations:', Object.keys(organizedRecommendations.evening).map(cat => 
        `${cat}: ${organizedRecommendations.evening[cat].length}`
      ))
      
      // Step 3: Generate daily itinerary using real recommendations
      const days = this.calculateDays(tripData.startDate, tripData.endDate)
      const itinerary = this.buildItinerary(tripData, organizedRecommendations, days)
      
      console.log('✅ Smart itinerary generated successfully')
      return itinerary
      
    } catch (error) {
      console.error('❌ Smart itinerary generation failed:', error)
      // Fall back to basic generation if Reddit research fails
      return this.generateBasicItinerary(tripData)
    }
  }

  organizeRecommendations(recommendations) {
    const organized = {
      morning: {
        culture: [],
        nature: [],
        attraction: [],
        shopping: []
      },
      afternoon: {
        dining: [],
        culture: [],
        nature: [],
        attraction: [],
        shopping: []
      },
      evening: {
        dining: [],
        nightlife: [],
        culture: []
      }
    }

    recommendations.forEach(rec => {
      // Determine best time of day for this recommendation
      if (rec.category === 'dining') {
        // Restaurants can be lunch or dinner
        if (rec.name.toLowerCase().includes('breakfast') || rec.name.toLowerCase().includes('cafe')) {
          organized.morning.dining = organized.morning.dining || []
          organized.morning.dining.push(rec)
        } else {
          organized.afternoon[rec.category].push(rec)
          organized.evening[rec.category].push(rec)
        }
      } else if (rec.category === 'nightlife') {
        organized.evening[rec.category].push(rec)
      } else if (rec.category === 'culture' || rec.category === 'attraction') {
        // Cultural sites better in morning/afternoon
        organized.morning[rec.category].push(rec)
        organized.afternoon[rec.category].push(rec)
      } else {
        // Default to afternoon
        organized.afternoon[rec.category] = organized.afternoon[rec.category] || []
        organized.afternoon[rec.category].push(rec)
      }
    })

    return organized
  }

  buildItinerary(tripData, recommendations, numDays) {
    const itineraryId = `smart-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    const days = []
    let usedRecommendations = new Set()

    for (let i = 0; i < numDays; i++) {
      const dayDate = new Date(tripData.startDate)
      dayDate.setDate(dayDate.getDate() + i)
      
      const day = {
        dayNumber: i + 1,
        date: dayDate.toISOString().split('T')[0],
        title: `Day ${i + 1} in ${tripData.destination}`,
        morning: this.selectActivity(recommendations.morning, usedRecommendations, 'morning', tripData),
        afternoon: this.selectActivity(recommendations.afternoon, usedRecommendations, 'afternoon', tripData),
        evening: this.selectActivity(recommendations.evening, usedRecommendations, 'evening', tripData)
      }
      
      days.push(day)
    }

    // Calculate budget breakdown
    const budgetSummary = this.calculateBudgetSummary(days, tripData)

    return {
      id: itineraryId,
      destination: tripData.destination,
      title: `Your ${tripData.destination} Adventure`,
      overview: this.generateOverview(tripData, days),
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      people: tripData.people,
      budget: tripData.budget,
      days,
      budgetSummary,
      insiderTips: this.generateInsiderTips(tripData.destination, recommendations),
      generatedBy: 'reddit-research'
    }
  }

  selectActivity(timeSlotRecommendations, usedRecommendations, timeOfDay, tripData) {
    console.log(`🎯 Selecting ${timeOfDay} activity from:`, timeSlotRecommendations)
    
    // Find best unused recommendation for this time slot
    for (const category of Object.keys(timeSlotRecommendations)) {
      const categoryRecs = timeSlotRecommendations[category]
      console.log(`  📂 ${category}: ${categoryRecs.length} recommendations`)
      
      for (const rec of categoryRecs) {
        if (!usedRecommendations.has(rec.name)) {
          usedRecommendations.add(rec.name)
          console.log(`  ✅ Selected: ${rec.name} (${rec.category})`)
          
          return {
            time: this.getTimeForSlot(timeOfDay),
            activity: rec.name,
            description: rec.enrichedData?.description || rec.description || rec.shortDescription || `Experience ${rec.name}, a popular ${rec.category} destination.`,
            estimatedCost: rec.avgPrice || this.getDefaultPrice(rec.category),
            type: rec.category,
            location: this.generateLocationForVenue(rec.name, rec.addresses, rec.enrichedData?.coordinates),
            whyRecommended: rec.whyRecommended,
            redditMentions: rec.mentionCount,
            confidence: rec.confidence,
            // Enhanced data from Google Places API
            rating: rec.enrichedData?.rating,
            totalRatings: rec.enrichedData?.totalRatings,
            phone: rec.enrichedData?.phone,
            address: rec.enrichedData?.address,
            hours: rec.enrichedData?.hours || rec.hours,
            priceRange: rec.enrichedData?.priceRange || rec.priceRange,
            website: rec.enrichedData?.website || rec.website,
            features: rec.enrichedData?.features || rec.features,
            photos: rec.enrichedData?.photos || [],
            businessStatus: rec.enrichedData?.businessStatus,
            sources: rec.enrichedData?.sources || ['reddit']
          }
        }
      }
    }
    
    console.log(`  ⚠️ No unused recommendations found for ${timeOfDay}, using fallback`)

    // Fallback if no recommendations available
    return this.generateFallbackActivity(timeOfDay, tripData.destination)
  }

  generateLocationForVenue(venueName, addresses, coordinates) {
    // Prioritize Google Places coordinates if available
    if (coordinates && coordinates.lat && coordinates.lng) {
      return {
        lat: coordinates.lat,
        lng: coordinates.lng,
        address: addresses?.[0] || 'Address available on-site'
      }
    }

    // Try to use address information if available
    if (addresses && addresses.length > 0) {
      // Use first address and try to geocode it (simplified)
      const baseCoords = this.getDestinationCoords(venueName)
      return {
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.02,
        address: addresses[0]
      }
    }

    // Generate random location near destination
    return this.generateRandomLocation(venueName)
  }

  generateRandomLocation(destination) {
    const baseCoords = this.getDestinationCoords(destination)
    
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.02
    }
  }

  getDestinationCoords(destination) {
    // Try exact match first
    let baseCoords = this.destinationCoords[destination]
    
    if (!baseCoords) {
      // Try partial match
      const destLower = destination.toLowerCase()
      for (const [key, coords] of Object.entries(this.destinationCoords)) {
        if (destLower.includes(key.toLowerCase()) || key.toLowerCase().includes(destLower)) {
          baseCoords = coords
          break
        }
      }
    }
    
    return baseCoords || { lat: 0, lng: 0 }
  }

  getTimeForSlot(timeOfDay) {
    switch (timeOfDay) {
      case 'morning': return '9:00 AM'
      case 'afternoon': return '2:00 PM'
      case 'evening': return '7:00 PM'
      default: return '12:00 PM'
    }
  }

  getDefaultPrice(category) {
    const defaultPrices = {
      dining: 35,
      culture: 25,
      attraction: 45,
      nature: 30,
      nightlife: 40,
      shopping: 50
    }
    
    return defaultPrices[category] || 30
  }

  generateFallbackActivity(timeOfDay, destination) {
    const fallbackActivities = {
      morning: {
        activity: 'Explore Local Attractions',
        description: `Start your day exploring the highlights of ${destination}`,
        type: 'sightseeing'
      },
      afternoon: {
        activity: 'Local Cuisine Experience',
        description: `Enjoy authentic local cuisine at recommended restaurants`,
        type: 'dining'
      },
      evening: {
        activity: 'Cultural Experience',
        description: `Immerse yourself in the local culture with evening activities`,
        type: 'culture'
      }
    }

    const fallback = fallbackActivities[timeOfDay] || fallbackActivities.afternoon
    
    return {
      time: this.getTimeForSlot(timeOfDay),
      activity: fallback.activity,
      description: fallback.description,
      estimatedCost: this.getDefaultPrice(fallback.type),
      type: fallback.type,
      location: this.generateRandomLocation(destination),
      whyRecommended: 'Popular activity type for this destination'
    }
  }

  generateOverview(tripData, days) {
    const numDays = days.length
    const destination = tripData.destination
    
    return `Experience the best of ${destination} with this carefully planned ${numDays}-day itinerary. ` +
           `Based on real traveler recommendations from Reddit, this guide will help you explore the ` +
           `destination's highlights while staying within your budget of $${tripData.budget}.`
  }

  generateInsiderTips(destination, recommendations) {
    const tips = [
      `Book accommodations in advance for better rates in ${destination}`,
      `Always carry local currency for small vendors and tips`,
      `Download offline maps before exploring to save on data costs`
    ]

    // Add Reddit-specific tips if available
    if (recommendations.length > 0) {
      tips.push('These recommendations are based on real traveler experiences from Reddit')
      
      const budgetTips = recommendations.filter(r => r.avgPrice && r.avgPrice < 30)
      if (budgetTips.length > 0) {
        tips.push(`Look for budget-friendly options like ${budgetTips[0].name} for great value`)
      }
    }

    return tips
  }

  calculateBudgetSummary(days, tripData) {
    const totalActivitiesCost = days.reduce((sum, day) => {
      return sum + 
        (day.morning?.estimatedCost || 0) + 
        (day.afternoon?.estimatedCost || 0) + 
        (day.evening?.estimatedCost || 0)
    }, 0)

    const estimatedMeals = totalActivitiesCost * 0.4
    const estimatedTransport = totalActivitiesCost * 0.2
    
    return {
      activities: totalActivitiesCost,
      food: Math.round(estimatedMeals),
      transportation: Math.round(estimatedTransport),
      accommodation: Math.round(tripData.budget * 0.4), // Estimate 40% for accommodation
      total: Math.round(totalActivitiesCost + estimatedMeals + estimatedTransport + (tripData.budget * 0.4))
    }
  }

  calculateDays(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  generateBasicItinerary(tripData) {
    console.log('🔄 Falling back to basic itinerary generation')
    
    // This is a simplified fallback - you could import the existing generator here
    const days = this.calculateDays(tripData.startDate, tripData.endDate)
    const itineraryId = `basic-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    
    return {
      id: itineraryId,
      destination: tripData.destination,
      title: `Your ${tripData.destination} Adventure`,
      overview: `A ${days}-day adventure in ${tripData.destination}`,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      people: tripData.people,
      budget: tripData.budget,
      days: [],
      budgetSummary: { total: tripData.budget },
      insiderTips: ['Basic itinerary - Reddit research unavailable'],
      generatedBy: 'basic-fallback'
    }
  }
}

export default new SmartItineraryGenerator() 