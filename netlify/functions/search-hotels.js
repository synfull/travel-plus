/**
 * Netlify Function: Hotel Search
 * Phase 4: Real Amadeus API Integration
 */

import { AmadeusService } from '../../src/services/api/AmadeusService.js'
import { HotelsComService } from '../../src/services/api/HotelsComService.js'

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

// Initialize services
console.log('🔧 Environment check:', {
  hasAmadeusKey: !!process.env.AMADEUS_API_KEY,
  hasAmadeusSecret: !!process.env.AMADEUS_API_SECRET,
  hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
  amadeusKeyPreview: process.env.AMADEUS_API_KEY ? process.env.AMADEUS_API_KEY.substring(0, 8) + '...' : 'MISSING',
  rapidApiKeyPreview: process.env.RAPIDAPI_KEY ? process.env.RAPIDAPI_KEY.substring(0, 8) + '...' : 'MISSING'
})

const amadeus = new AmadeusService({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
})

const hotelscom = new HotelsComService({
  apiKey: process.env.RAPIDAPI_KEY
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
    console.log('🏨 Hotel search request received')
    
    // Parse request body
    const searchParams = JSON.parse(event.body)
    const {
      destination,
      checkinDate,
      checkoutDate,
      guests = 1,
      rooms = 1,
      maxPrice = null,
      amenities = []
    } = searchParams

    // Validate required parameters
    if (!destination || !checkinDate || !checkoutDate) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required parameters: destination, checkinDate, checkoutDate' 
        })
      }
    }

    // Format dates for Amadeus API
    const checkInDate = formatDateForAmadeus(checkinDate)
    const checkOutDate = formatDateForAmadeus(checkoutDate)

    console.log(`🔍 Searching hotels in: ${destination}`, {
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      maxPrice
    })

    // Try Amadeus API first, then Hotels.com as fallback
    let hotelResults
    let isAmadeusSuccess = false
    
    try {
      console.log('🔄 Trying Amadeus API first...')
      hotelResults = await amadeus.searchHotels({
        destination,
        checkInDate,
        checkOutDate,
        guests: parseInt(guests),
        rooms: parseInt(rooms),
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        amenities
      })
      isAmadeusSuccess = true
      console.log('✅ Amadeus API succeeded')
    } catch (amadeusError) {
      console.log('❌ Amadeus API failed, trying Hotels.com fallback...')
      
      try {
        hotelResults = await hotelscom.searchHotels({
          destination,
          checkInDate,
          checkOutDate,
          guests: parseInt(guests),
          rooms: parseInt(rooms)
        })
        console.log('✅ Hotels.com API succeeded')
      } catch (hotelscomError) {
        console.log('❌ Hotels.com API also failed, using mock data')
        throw new Error(`Both APIs failed - Amadeus: ${amadeusError.message}, Hotels.com: ${hotelscomError.message}`)
      }
    }

    // Process results for frontend compatibility
    const processedResults = {
      success: true,
      provider: isAmadeusSuccess ? 'Amadeus' : hotelResults.meta?.provider || 'Hotels.com',
      hotels: hotelResults.hotels.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        rating: hotel.rating,
        price: hotel.price.total,
        currency: hotel.price.currency,
        pricePerNight: hotel.price.total,
        location: hotel.location.address.cityName || destination,
        address: formatAddress(hotel.location.address),
        coordinates: hotel.location.coordinates,
        amenities: hotel.amenities.slice(0, 8), // Limit amenities display
        images: hotel.media.map(media => media.uri).slice(0, 5), // Limit images
        room: {
          type: hotel.room.typeEstimated?.category || hotel.room.type || 'Standard Room',
          description: hotel.room.description
        },
        policies: {
          checkIn: hotel.policies.checkIn || '15:00',
          checkOut: hotel.policies.checkOut || '11:00',
          cancellation: hotel.policies.cancellation?.type || 'Unknown'
        },
        contact: {
          phone: hotel.contact.phone,
          email: hotel.contact.email
        },
        bookingCode: hotel.bookingCode,
        bookingUrl: `https://amadeus.com/book/hotel/${hotel.id}`, // Placeholder booking URL
        distance: hotel.location.distance?.value ? 
          `${hotel.location.distance.value} ${hotel.location.distance.unit}` : null
      })),
      meta: {
        count: hotelResults.hotels.length,
        searchedAt: hotelResults.meta.searchedAt,
        destination: hotelResults.meta.destination || destination,
        checkinDate,
        checkoutDate,
        guests,
        rooms
      }
    }

    console.log(`✅ Found ${processedResults.hotels.length} hotel options`)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify(processedResults)
    }

  } catch (error) {
    console.error('❌ Hotel search error:', error.message)
    
    // Return fallback hotel data on error
    const fallbackHotels = generateFallbackHotels(JSON.parse(event.body))
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        hotels: fallbackHotels,
        meta: {
          count: fallbackHotels.length,
          isFallback: true,
          error: error.message
        }
      })
    }
  }
}

/**
 * Format hotel address for display
 */
function formatAddress(address) {
  if (!address) return ''
  
  const parts = []
  if (address.lines) parts.push(...address.lines)
  if (address.cityName) parts.push(address.cityName)
  if (address.stateCode) parts.push(address.stateCode)
  if (address.countryCode) parts.push(address.countryCode)
  
  return parts.join(', ')
}

/**
 * Generate fallback hotel data when API fails
 */
function generateFallbackHotels({ destination, checkinDate, checkoutDate, guests = 1 }) {
  const basePrice = 120 + Math.random() * 200 // $120-320 base price
  const hotelTypes = [
    'Resort & Spa', 'Boutique Hotel', 'Business Hotel', 'City Center Hotel', 
    'Beachfront Resort', 'Historic Hotel', 'Modern Hotel', 'Luxury Hotel'
  ]
  
  const amenitiesList = [
    ['Pool', 'Free WiFi', 'Breakfast', 'Gym'],
    ['Beach Access', 'Spa', 'Restaurant', 'Bar'],
    ['Business Center', 'Meeting Rooms', 'Concierge', 'Parking'],
    ['Rooftop Bar', 'City Views', 'Room Service', 'Laundry']
  ]

  return Array.from({ length: 3 }, (_, index) => {
    const hotelType = hotelTypes[Math.floor(Math.random() * hotelTypes.length)]
    const price = Math.round(basePrice + (index * 50) + (Math.random() * 80))
    
    return {
      id: `fallback_hotel_${Date.now()}_${index}`,
      name: `${destination} ${hotelType}`,
      rating: 3.5 + Math.random() * 1.5, // 3.5-5.0 rating
      price: price,
      currency: 'USD',
      pricePerNight: price,
      location: destination,
      address: `${Math.floor(Math.random() * 999) + 1} ${destination} Street, ${destination}`,
      coordinates: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1, // Rough NYC coordinates as example
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1
      },
      amenities: amenitiesList[index % amenitiesList.length],
      images: [
        'https://via.placeholder.com/400x300?text=Hotel+Exterior',
        'https://via.placeholder.com/400x300?text=Hotel+Room',
        'https://via.placeholder.com/400x300?text=Hotel+Lobby'
      ],
      room: {
        type: index === 0 ? 'Standard Room' : index === 1 ? 'Deluxe Room' : 'Suite',
        description: `Comfortable ${index === 0 ? 'standard' : index === 1 ? 'deluxe' : 'luxury'} accommodation`
      },
      policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: 'Free cancellation until 24 hours before check-in'
      },
      contact: {
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `info@${destination.toLowerCase().replace(/\s+/g, '')}hotel.com`
      },
      bookingUrl: 'https://example.com/book-hotel',
      distance: `${(Math.random() * 5).toFixed(1)} km from city center`
    }
  })
} 