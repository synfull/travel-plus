/**
 * Netlify Function: Hotel Search
 * Phase 4: Real Amadeus API Integration
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

// Import working hotel services only
import { ExpediaRapidService } from '../../src/services/api/ExpediaRapidService.js'
import { AmadeusService } from '../../src/services/api/AmadeusService.js'

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
}

// Mock hotel data for ultimate fallback
const mockHotels = [
  {
    id: 'mock-1',
    name: 'Sample Hotel Downtown',
    rating: 4,
    location: {
      address: { line1: '123 Main Street' },
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    price: { total: 150, currency: 'USD' },
    amenities: ['WiFi', 'Pool', 'Gym'],
    images: ['https://via.placeholder.com/400x300?text=Hotel+Image']
  },
  {
    id: 'mock-2', 
    name: 'Business Hotel Central',
    rating: 4,
    location: {
      address: { line1: '456 Business Ave' },
      coordinates: { latitude: 40.7589, longitude: -73.9851 }
    },
    price: { total: 200, currency: 'USD' },
    amenities: ['WiFi', 'Business Center', 'Restaurant'],
    images: ['https://via.placeholder.com/400x300?text=Business+Hotel']
  }
]

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { destination, checkInDate, checkOutDate, guests = 2, rooms = 1 } = JSON.parse(event.body)
    
    console.log(`🏨 Hotel search request: ${destination}, ${checkInDate} to ${checkOutDate}, ${guests} guests, ${rooms} rooms`)

    // Debug environment variables
    console.log('🔧 Environment check:')
    console.log('- hasExpediaApiKey:', !!process.env.RAPIDAPI_KEY)
    console.log('- hasAmadeusApiKey:', !!process.env.AMADEUS_API_KEY)
    console.log('- hasAmadeusSecret:', !!process.env.AMADEUS_API_SECRET)

    let hotels = []
    let source = 'mock'

    // Initialize services
    let expediaService, amadeusService

    try {
      expediaService = new ExpediaRapidService({
        apiKey: process.env.RAPIDAPI_KEY,
        rateLimitDelayMs: 2000
      })
    } catch (error) {
      console.log('⚠️ ExpediaRapidService initialization failed:', error.message)
    }

    try {
      amadeusService = new AmadeusService({
        clientId: process.env.AMADEUS_API_KEY,
        clientSecret: process.env.AMADEUS_API_SECRET,
        environment: 'test'
      })
    } catch (error) {
      console.log('⚠️ AmadeusService initialization failed:', error.message)
    }

    // Priority 1: Try Expedia Rapid API (Direct)
    if (expediaService) {
      try {
        console.log('🚀 Priority 1: Trying Expedia Rapid API...')
        const expediaHotels = await expediaService.searchHotels({
          destination,
          checkInDate,
          checkOutDate,
          guests,
          rooms
        })
        
        if (expediaHotels && expediaHotels.length > 0) {
          hotels = expediaHotels.slice(0, 10) // Limit to top 10
          source = 'expedia'
          console.log(`✅ Expedia success: ${hotels.length} hotels found`)
        } else {
          console.log('❌ Expedia: No hotels found in response')
        }
      } catch (error) {
        console.log('❌ Expedia API error:', error.message)
      }
    }

    // Priority 2: Try Amadeus API (Official, Working)
    if (hotels.length === 0 && amadeusService) {
      try {
        console.log('🚀 Priority 2: Trying Amadeus API...')
        await amadeusService.authenticate()
        
        const amadeusHotels = await amadeusService.searchHotels({
          destination,
          checkInDate,
          checkOutDate,
          guests,
          rooms
        })
        
        if (amadeusHotels && amadeusHotels.length > 0) {
          hotels = amadeusHotels.slice(0, 10) // Limit to top 10
          source = 'amadeus'
          console.log(`✅ Amadeus success: ${hotels.length} hotels found`)
        } else {
          console.log('❌ Amadeus: No hotels found in response')
        }
      } catch (error) {
        console.log('❌ Amadeus API error:', error.message)
      }
    }

    // Final Fallback: Use mock data
    if (hotels.length === 0) {
      console.log('🔄 All APIs failed, using mock data fallback')
      hotels = mockHotels
      source = 'mock'
    }

    const response = {
      success: true,
      data: {
        hotels: hotels.slice(0, 5), // Limit final results to 5
        metadata: {
          destination,
          checkInDate,
          checkOutDate,
          guests,
          rooms,
          source,
          totalFound: hotels.length,
          timestamp: new Date().toISOString()
        }
      }
    }

    console.log(`✅ Hotel search completed. Source: ${source}, Hotels: ${hotels.length}`)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    }

  } catch (error) {
    console.error('❌ Hotel search error:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Hotel search failed',
        details: error.message,
        data: {
          hotels: mockHotels.slice(0, 3), // Provide fallback even on error
          metadata: {
            source: 'mock-error-fallback',
            timestamp: new Date().toISOString()
          }
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