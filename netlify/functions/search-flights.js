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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    }
  }

  try {
    console.log('✈️ Flight search request received')
    
    // Parse request body
    const searchParams = JSON.parse(event.body)
    const {
      origin,
      destination,
      startDate,
      endDate,
      passengers = 1,
      cabinClass = 'ECONOMY',
      maxPrice = null
    } = searchParams

    // Validate required parameters
    if (!origin || !destination || !startDate) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required parameters: origin, destination, startDate' 
        })
      }
    }

    // Convert city names to airport codes and format dates
    const originCode = convertToAirportCode(origin)
    const destinationCode = convertToAirportCode(destination)
    const departureDate = formatDateForAmadeus(startDate)
    const returnDate = endDate ? formatDateForAmadeus(endDate) : null

    console.log(`🔍 Searching flights: ${origin} (${originCode}) → ${destination} (${destinationCode})`, {
      departureDate,
      returnDate,
      passengers,
      cabinClass
    })

    // Search flights using Amadeus API
    const flightResults = await amadeus.searchFlights({
      origin: originCode,
      destination: destinationCode,
      departureDate,
      returnDate,
      passengers: parseInt(passengers),
      cabinClass,
      maxPrice: maxPrice ? parseInt(maxPrice) : null
    })

    // Process results for frontend compatibility
    const processedResults = {
      success: true,
      flights: flightResults.flights.map(flight => ({
        id: flight.id,
        totalPrice: flight.price.total,
        currency: flight.price.currency,
        outbound: flight.outbound ? {
          airline: flight.outbound.airline,
          flightNumber: flight.outbound.flightNumber,
          departure: flight.outbound.departure.time,
          arrival: flight.outbound.arrival.time,
          departureAirport: flight.outbound.departure.airport,
          arrivalAirport: flight.outbound.arrival.airport,
          duration: flight.outbound.duration,
          stops: flight.outbound.stops,
          price: Math.round(flight.price.total / (endDate ? 2 : 1)) // Split price for round trip
        } : null,
        return: flight.return ? {
          airline: flight.return.airline,
          flightNumber: flight.return.flightNumber,
          departure: flight.return.departure.time,
          arrival: flight.return.arrival.time,
          departureAirport: flight.return.departure.airport,
          arrivalAirport: flight.return.arrival.airport,
          duration: flight.return.duration,
          stops: flight.return.stops,
          price: Math.round(flight.price.total / 2)
        } : null,
        bookingClass: flight.bookingClass,
        lastTicketingDate: flight.lastTicketingDate,
        bookingUrl: `https://amadeus.com/book/${flight.id}` // Placeholder booking URL
      })),
      meta: {
        count: flightResults.flights.length,
        searchedAt: flightResults.meta.searchedAt,
        origin,
        destination,
        passengers
      }
    }

    console.log(`✅ Found ${processedResults.flights.length} flight options`)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
      },
      body: JSON.stringify(processedResults)
    }

  } catch (error) {
    console.error('❌ Flight search error:', error.message)
    
    // Return fallback flight data on error
    const fallbackFlights = generateFallbackFlights(JSON.parse(event.body))
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        flights: fallbackFlights,
        meta: {
          count: fallbackFlights.length,
          isFallback: true,
          error: error.message
        }
      })
    }
  }
}

/**
 * Generate fallback flight data when API fails
 */
function generateFallbackFlights({ origin, destination, startDate, endDate, passengers = 1 }) {
  const basePrice = 300 + Math.random() * 500 // $300-800 base price
  const airlines = ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue']
  const randomAirline = airlines[Math.floor(Math.random() * airlines.length)]
  
  // Extract date part from ISO string (remove time portion)
  const startDateOnly = new Date(startDate).toISOString().split('T')[0]
  const endDateOnly = endDate ? new Date(endDate).toISOString().split('T')[0] : null
  
  return [
    {
      id: `fallback_${Date.now()}_1`,
      totalPrice: Math.round(basePrice * passengers),
      currency: 'USD',
      outbound: {
        airline: randomAirline,
        flightNumber: `${randomAirline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: `${startDateOnly}T08:00:00`,
        arrival: `${startDateOnly}T12:00:00`,
        departureAirport: origin.toUpperCase(),
        arrivalAirport: destination.toUpperCase(),
        duration: 'PT4H',
        stops: 0,
        price: Math.round(basePrice * passengers / (endDate ? 2 : 1))
      },
      return: endDate ? {
        airline: randomAirline,
        flightNumber: `${randomAirline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: `${endDateOnly}T16:00:00`,
        arrival: `${endDateOnly}T23:00:00`,
        departureAirport: destination.toUpperCase(),
        arrivalAirport: origin.toUpperCase(),
        duration: 'PT7H',
        stops: 1,
        price: Math.round(basePrice * passengers / 2)
      } : null,
      bookingClass: 'ECONOMY',
      bookingUrl: 'https://example.com/book-flight'
    },
    // Add a second option with different price/airline
    {
      id: `fallback_${Date.now()}_2`,
      totalPrice: Math.round((basePrice + 150) * passengers),
      currency: 'USD',
      outbound: {
        airline: airlines[(airlines.indexOf(randomAirline) + 1) % airlines.length],
        flightNumber: `${airlines[1].substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: `${startDateOnly}T10:30:00`,
        arrival: `${startDateOnly}T14:30:00`,
        departureAirport: origin.toUpperCase(),
        arrivalAirport: destination.toUpperCase(),
        duration: 'PT4H',
        stops: 0,
        price: Math.round((basePrice + 150) * passengers / (endDate ? 2 : 1))
      },
      return: endDate ? {
        airline: airlines[(airlines.indexOf(randomAirline) + 1) % airlines.length],
        flightNumber: `${airlines[1].substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: `${endDateOnly}T18:00:00`,
        arrival: `${endDateOnly}T22:00:00`,
        departureAirport: destination.toUpperCase(),
        arrivalAirport: origin.toUpperCase(),
        duration: 'PT4H',
        stops: 0,
        price: Math.round((basePrice + 150) * passengers / 2)
      } : null,
      bookingClass: 'ECONOMY',
      bookingUrl: 'https://example.com/book-flight'
    }
  ]
} 