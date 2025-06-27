/**
 * Netlify Function: Flight Search
 * Phase 4: Real Amadeus API Integration
 */

import { AmadeusService } from '../../src/services/api/AmadeusService.js'

/**
 * Convert city names to airport codes
 */
function convertToAirportCode(cityName) {
  const cityToAirportMap = {
    // North America
    'toronto': 'YYZ',
    'vancouver': 'YVR',
    'montreal': 'YUL',
    'calgary': 'YYC',
    'new york': 'NYC',
    'new york, usa': 'NYC',
    'los angeles': 'LAX',
    'chicago': 'CHI',
    'miami': 'MIA',
    'san francisco': 'SFO',
    'boston': 'BOS',
    'washington': 'WAS',
    'seattle': 'SEA',
    'las vegas': 'LAS',
    
    // Europe
    'paris': 'PAR',
    'paris, france': 'PAR',
    'london': 'LON',
    'london, uk': 'LON',
    'amsterdam': 'AMS',
    'berlin': 'BER',
    'rome': 'ROM',
    'madrid': 'MAD',
    'barcelona': 'BCN',
    'munich': 'MUC',
    'zurich': 'ZUR',
    'vienna': 'VIE',
    'prague': 'PRG',
    'budapest': 'BUD',
    
    // Asia
    'tokyo': 'NRT',
    'tokyo, japan': 'NRT',
    'seoul': 'ICN',
    'beijing': 'PEK',
    'shanghai': 'PVG',
    'hong kong': 'HKG',
    'singapore': 'SIN',
    'bangkok': 'BKK',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    
    // Australia/Oceania
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'brisbane': 'BNE',
    'perth': 'PER',
    'auckland': 'AKL',
    
    // South America
    'sao paulo': 'SAO',
    'rio de janeiro': 'RIO',
    'buenos aires': 'BUE',
    'lima': 'LIM',
    'bogota': 'BOG'
  }
  
  const normalized = cityName.toLowerCase().trim()
  return cityToAirportMap[normalized] || cityName.toUpperCase().substring(0, 3)
}

/**
 * Format date from ISO string to YYYY-MM-DD
 */
function formatDateForAmadeus(dateString) {
  if (!dateString) return null
  try {
    return new Date(dateString).toISOString().split('T')[0]
  } catch (error) {
    console.warn('⚠️ Date formatting error:', error.message)
    return dateString
  }
}

// Initialize Amadeus service
console.log('🔧 Environment check:', {
  hasApiKey: !!process.env.AMADEUS_API_KEY,
  hasApiSecret: !!process.env.AMADEUS_API_SECRET,
  apiKeyPreview: process.env.AMADEUS_API_KEY ? process.env.AMADEUS_API_KEY.substring(0, 8) + '...' : 'MISSING'
})

const amadeus = new AmadeusService({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
})

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Environment validation
    const hasApiKey = !!(process.env.AMADEUS_API_KEY || process.env.VITE_AMADEUS_API_KEY)
    const hasApiSecret = !!(process.env.AMADEUS_API_SECRET || process.env.VITE_AMADEUS_API_SECRET)

    console.log('🔧 Environment check:', {
      hasApiKey,
      hasApiSecret,
      apiKeyPreview: hasApiKey ? (process.env.AMADEUS_API_KEY || process.env.VITE_AMADEUS_API_KEY).substring(0, 8) + '...' : 'Not found'
    })

    // Parse request body
    const searchParams = JSON.parse(event.body)
    const { origin, destination, startDate, endDate, passengers = 1 } = searchParams

    console.log('✈️ Flight search request received')
    
    // Date validation and diagnostics
    const today = new Date()
    const departureDate = new Date(startDate)
    const returnDate = endDate ? new Date(endDate) : null
    
    console.log('📅 Date Analysis:')
    console.log('📅 Today:', today.toISOString().split('T')[0])
    console.log('📅 Departure:', startDate, '(parsed:', departureDate.toISOString().split('T')[0], ')')
    console.log('📅 Return:', endDate, returnDate ? '(parsed:' + returnDate.toISOString().split('T')[0] + ')' : '(one-way)')
    console.log('📅 Days from today to departure:', Math.floor((departureDate - today) / (1000 * 60 * 60 * 24)))
    
    if (departureDate < today) {
      console.log('❌ CRITICAL: Departure date is in the past!')
      console.log('💡 SUGGESTION: Use a future date like:', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      
      // Return fallback data with helpful message
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          flights: [{
            outbound: {
              airline: 'TEST Airlines',
              flightNumber: 'TEST123',
              departure: `${startDate}T08:00:00`,
              arrival: `${startDate}T12:00:00`,
              price: 324 * passengers,
            },
            return: endDate ? {
              airline: 'TEST Airlines', 
              flightNumber: 'TEST456',
              departure: `${endDate}T16:00:00`,
              arrival: `${endDate}T23:00:00`,
              price: 324 * passengers,
            } : null,
            totalPrice: (endDate ? 648 : 324) * passengers,
            currency: 'USD',
            bookingUrl: 'https://amadeus.com/book',
            source: 'fallback_past_date'
          }],
          note: `Date ${startDate} is in the past. Use future dates like ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} for real results.`,
          meta: {
            searchedAt: new Date().toISOString(),
            dateIssue: 'past_date',
            suggestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        })
      }
    }

    console.log('🔍 Searching flights:', `${origin} (${convertToAirportCode(origin)}) → ${destination} (${convertToAirportCode(destination)})`, {
      departureDate: startDate,
      returnDate: endDate,
      passengers,
      cabinClass: 'ECONOMY'
    })

    // Search flights with detailed error handling
    try {
      const results = await amadeus.searchFlights({
        origin: convertToAirportCode(origin),
        destination: convertToAirportCode(destination),
        departureDate: startDate,
        returnDate: endDate,
        passengers: parseInt(passengers),
        cabinClass: 'ECONOMY'
      })

      console.log('🔍 RAW Amadeus Flight Response Analysis:')
      console.log('📊 Response type:', typeof results)
      console.log('📊 Response keys:', results ? Object.keys(results) : 'No response')
      console.log('📊 Has flights array:', results?.flights ? `Yes (${results.flights.length} flights)` : 'No')
      console.log('📊 First 500 chars:', JSON.stringify(results).substring(0, 500))

      if (results?.flights && results.flights.length > 0) {
        console.log('✅ Amadeus flight search successful!')
        console.log('🔍 Sample flight structure:', JSON.stringify(results.flights[0], null, 2))
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            flights: results.flights,
            meta: {
              searchedAt: new Date().toISOString(),
              provider: 'amadeus',
              count: results.flights.length
            }
          })
        }
      } else {
        console.log('❌ No flights found in Amadeus response')
        throw new Error('No flights found')
      }

    } catch (error) {
      console.log('❌ Flight search error:', error.message)
      console.log('🔍 Full error object:', error)
      console.log('🔍 Error stack:', error.stack)

      // Check for specific Amadeus errors
      if (error.message.includes('INVALID DATE') || error.message.includes('past')) {
        console.log('💡 This is a date validation error - dates must be in the future for real flight search')
      }
      
      // Return fallback flight data
      const fallbackFlights = [{
        outbound: {
          airline: 'American Airlines',
          flightNumber: 'AA123',
          departure: `${startDate}T08:00:00`,
          arrival: `${startDate}T12:00:00`,
          price: 324 * passengers,
          duration: '4h 0m',
          stops: 0
        },
        return: endDate ? {
          airline: 'American Airlines',
          flightNumber: 'AA456', 
          departure: `${endDate}T16:00:00`,
          arrival: `${endDate}T23:00:00`,
          price: 324 * passengers,
          duration: '7h 0m',
          stops: 0
        } : null,
        totalPrice: (endDate ? 648 : 324) * passengers,
        currency: 'USD',
        bookingUrl: 'https://amadeus.com/book',
        source: 'fallback_api_error'
      }]

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          flights: fallbackFlights,
          note: `API Error: ${error.message}. Showing fallback data.`,
          meta: {
            searchedAt: new Date().toISOString(),
            provider: 'fallback',
            originalError: error.message,
            count: fallbackFlights.length
          }
        })
      }
    }

  } catch (error) {
    console.error('❌ Flight search function error:', error)
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Flight search failed',
        message: error.message
      })
    }
  }
}

// Helper function to get IATA codes
function getIATACode(location) {
  const iataMap = {
    'Los Angeles': 'LAX',
    'LAX': 'LAX',
    'Tokyo': 'NRT',
    'NRT': 'NRT',
    'New York': 'JFK',
    'JFK': 'JFK',
    'London': 'LHR',
    'LHR': 'LHR',
    'Paris': 'CDG',
    'CDG': 'CDG',
    'Barcelona': 'BCN',
    'BCN': 'BCN',
    'Dubai': 'DXB',
    'DXB': 'DXB',
    'Bali': 'DPS',
    'DPS': 'DPS',
    'Amsterdam': 'AMS',
    'AMS': 'AMS',
    'Rome': 'FCO',
    'FCO': 'FCO',
    'Bangkok': 'BKK',
    'BKK': 'BKK',
    'Sydney': 'SYD',
    'SYD': 'SYD'
  }
  
  return iataMap[location] || location
} 