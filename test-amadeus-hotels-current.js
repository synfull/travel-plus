/**
 * Test Amadeus Hotel Fetch Functionality
 * This script tests the hotel search capabilities of AmadeusService
 */

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

// Load environment variables
dotenv.config()

async function testAmadeusHotels() {
  console.log('🏨 Testing Amadeus Hotel Fetch Functionality\n')

  // Check environment variables
  console.log('📋 Environment Check:')
  console.log('- AMADEUS_API_KEY:', process.env.AMADEUS_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('- VITE_AMADEUS_API_KEY:', process.env.VITE_AMADEUS_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('- AMADEUS_API_SECRET:', process.env.AMADEUS_API_SECRET ? '✅ Set' : '❌ Missing')
  console.log('- VITE_AMADEUS_API_SECRET:', process.env.VITE_AMADEUS_API_SECRET ? '✅ Set' : '❌ Missing')
  console.log()

  // Initialize Amadeus service
  const amadeus = new AmadeusService({
    clientId: process.env.AMADEUS_API_KEY || process.env.VITE_AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET || process.env.VITE_AMADEUS_API_SECRET
  })

  try {
    // Test 1: Authentication
    console.log('🔐 Test 1: Authentication')
    const token = await amadeus.authenticate()
    console.log('✅ Authentication successful')
    console.log('- Token length:', token.length)
    console.log('- Token preview:', token.substring(0, 20) + '...')
    console.log()

    // Test 2: Basic Hotel Search (NYC)
    console.log('🔍 Test 2: Basic Hotel Search (New York)')
    const searchParams = {
      destination: 'new york',
      checkInDate: '2025-07-15',
      checkOutDate: '2025-07-18',
      guests: 2,
      rooms: 1,
      sortBy: 'PRICE'
    }
    
    console.log('Search parameters:', searchParams)
    const hotelResults = await amadeus.searchHotels(searchParams)
    
    console.log('✅ Hotel search successful')
    console.log('- Total hotels found:', hotelResults.meta.count)
    console.log('- Hotels returned:', hotelResults.hotels.length)
    console.log('- Destination:', hotelResults.meta.destination)
    console.log('- City code:', hotelResults.meta.cityCode)
    console.log('- Cached:', hotelResults.meta.cached)
    
    if (hotelResults.hotels.length > 0) {
      const firstHotel = hotelResults.hotels[0]
      console.log('\n📄 First Hotel Details:')
      console.log('- Name:', firstHotel.name || 'N/A')
      console.log('- Price:', firstHotel.price?.total || 'N/A')
      console.log('- Currency:', firstHotel.price?.currency || 'N/A')
      console.log('- Star Rating:', firstHotel.starRating || 'N/A')
      console.log('- Address:', firstHotel.address || 'N/A')
      console.log('- Amenities:', firstHotel.amenities?.slice(0, 3).join(', ') || 'N/A')
    }
    console.log()

    // Test 3: International Hotel Search (Tokyo)
    console.log('🌍 Test 3: International Hotel Search (Tokyo)')
    const intlSearchParams = {
      destination: 'tokyo',
      checkInDate: '2025-08-20',
      checkOutDate: '2025-08-25',
      guests: 1,
      rooms: 1,
      starRating: 4,
      maxPrice: 300,
      sortBy: 'RATING'
    }
    
    console.log('Search parameters:', intlSearchParams)
    const intlHotelResults = await amadeus.searchHotels(intlSearchParams)
    
    console.log('✅ International hotel search successful')
    console.log('- Total hotels found:', intlHotelResults.meta.count)
    console.log('- Hotels returned:', intlHotelResults.hotels.length)
    console.log('- City code:', intlHotelResults.meta.cityCode)
    
    if (intlHotelResults.hotels.length > 0) {
      const firstIntlHotel = intlHotelResults.hotels[0]
      console.log('\n📄 First Tokyo Hotel Details:')
      console.log('- Name:', firstIntlHotel.name || 'N/A')
      console.log('- Price:', firstIntlHotel.price?.total || 'N/A')
      console.log('- Currency:', firstIntlHotel.price?.currency || 'N/A')
      console.log('- Star Rating:', firstIntlHotel.starRating || 'N/A')
      console.log('- Location:', firstIntlHotel.location?.address || 'N/A')
    }
    console.log()

    // Test 4: European Hotel Search (Paris)
    console.log('🇫🇷 Test 4: European Hotel Search (Paris)')
    const euroSearchParams = {
      destination: 'paris',
      checkInDate: '2025-09-10',
      checkOutDate: '2025-09-13',
      guests: 2,
      rooms: 1,
      minPrice: 100,
      maxPrice: 500,
      includeImages: true,
      includeDetails: true
    }
    
    console.log('Search parameters:', euroSearchParams)
    const euroHotelResults = await amadeus.searchHotels(euroSearchParams)
    
    console.log('✅ European hotel search successful')
    console.log('- Total hotels found:', euroHotelResults.meta.count)
    console.log('- Hotels returned:', euroHotelResults.hotels.length)
    console.log('- City code:', euroHotelResults.meta.cityCode)
    console.log()

    // Test 5: City Code Mapping Test
    console.log('🗺️ Test 5: City Code Mapping')
    const testCities = ['tokyo', 'paris', 'london', 'new york', 'los angeles', 'dubai', 'singapore']
    console.log('Testing city code mappings:')
    testCities.forEach(city => {
      const code = amadeus.getEnhancedCityCode(city)
      console.log(`- ${city}: ${code || 'Not found'}`)
    })
    console.log()

    // Test 6: Hotel List Test (without availability check)
    console.log('🏨 Test 6: Hotel List Test (London)')
    try {
      const londonHotels = await amadeus.getHotelList('LON', 15)
      console.log('✅ Hotel list retrieved successfully')
      console.log('- Hotels in list:', londonHotels?.length || 0)
      
      if (londonHotels && londonHotels.length > 0) {
        console.log('- First hotel ID:', londonHotels[0].id || 'N/A')
        console.log('- First hotel name:', londonHotels[0].name || 'N/A')
      }
    } catch (error) {
      console.log('⚠️ Hotel list test failed:', error.message)
    }
    console.log()

    // Test 7: Service Statistics
    console.log('📊 Test 7: Service Statistics')
    const stats = amadeus.getStats()
    console.log('Service Statistics:', stats)
    console.log()

    // Test 8: Health Check
    console.log('🏥 Test 8: Health Check')
    const healthCheck = await amadeus.healthCheck()
    console.log('Health Check Results:', healthCheck)
    console.log()

    console.log('🎉 All Amadeus hotel tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
    
    // Additional debugging
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔍 Authentication Debug:')
      console.log('- Client ID present:', !!(process.env.AMADEUS_API_KEY || process.env.VITE_AMADEUS_API_KEY))
      console.log('- Client Secret present:', !!(process.env.AMADEUS_API_SECRET || process.env.VITE_AMADEUS_API_SECRET))
    }
    
    if (error.message.includes('No city code found')) {
      console.log('\n🗺️ City Code Debug:')
      console.log('- Available city codes: NYC, LAX, LON, PAR, TYO, DXB, SIN, etc.')
    }
  }
}

// Run the test
testAmadeusHotels() 