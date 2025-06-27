/**
 * Test Amadeus Flight Fetch Functionality
 * This script tests the flight search capabilities of AmadeusService
 */

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

// Load environment variables
dotenv.config()

async function testAmadeusFlights() {
  console.log('🛫 Testing Amadeus Flight Fetch Functionality\n')

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

    // Test 2: Basic Flight Search (NYC to LAX)
    console.log('🔍 Test 2: Basic Flight Search (NYC → LAX)')
    const searchParams = {
      origin: 'NYC',
      destination: 'LAX',
      departureDate: '2025-07-15',
      returnDate: '2025-07-22',
      passengers: 1,
      cabinClass: 'ECONOMY'
    }
    
    console.log('Search parameters:', searchParams)
    const flightResults = await amadeus.searchFlights(searchParams)
    
    console.log('✅ Flight search successful')
    console.log('- Total flights found:', flightResults.meta.count)
    console.log('- Search type:', flightResults.meta.searchType)
    console.log('- Cached:', flightResults.meta.cached)
    
    if (flightResults.flights.length > 0) {
      const firstFlight = flightResults.flights[0]
      console.log('\n📄 First Flight Details:')
      console.log('- Price:', firstFlight.price?.total || 'N/A')
      console.log('- Currency:', firstFlight.price?.currency || 'N/A')
      console.log('- Duration:', firstFlight.duration || 'N/A')
      console.log('- Airline:', firstFlight.airline || 'N/A')
      console.log('- Departure:', firstFlight.departure || 'N/A')
      console.log('- Arrival:', firstFlight.arrival || 'N/A')
      console.log('- Stops:', firstFlight.stops || 'N/A')
    }
    console.log()

    // Test 3: International Flight Search (NYC to Tokyo)
    console.log('🌍 Test 3: International Flight Search (NYC → Tokyo)')
    const intlSearchParams = {
      origin: 'NYC',
      destination: 'NRT',
      departureDate: '2025-08-20',
      returnDate: '2025-09-05',
      passengers: 2,
      cabinClass: 'BUSINESS'
    }
    
    console.log('Search parameters:', intlSearchParams)
    const intlFlightResults = await amadeus.searchFlights(intlSearchParams)
    
    console.log('✅ International flight search successful')
    console.log('- Total flights found:', intlFlightResults.meta.count)
    console.log('- Search type:', intlFlightResults.meta.searchType)
    
    if (intlFlightResults.flights.length > 0) {
      const firstIntlFlight = intlFlightResults.flights[0]
      console.log('\n📄 First International Flight Details:')
      console.log('- Price:', firstIntlFlight.price?.total || 'N/A')
      console.log('- Currency:', firstIntlFlight.price?.currency || 'N/A')
      console.log('- Duration:', firstIntlFlight.duration || 'N/A')
      console.log('- Airline:', firstIntlFlight.airline || 'N/A')
      console.log('- Departure:', firstIntlFlight.departure || 'N/A')
      console.log('- Arrival:', firstIntlFlight.arrival || 'N/A')
    }
    console.log()

    // Test 4: One-way Flight Search
    console.log('➡️ Test 4: One-way Flight Search (LAX → SFO)')
    const oneWayParams = {
      origin: 'LAX',
      destination: 'SFO',
      departureDate: '2025-07-10',
      passengers: 1,
      cabinClass: 'ECONOMY'
    }
    
    console.log('Search parameters:', oneWayParams)
    const oneWayResults = await amadeus.searchFlights(oneWayParams)
    
    console.log('✅ One-way flight search successful')
    console.log('- Total flights found:', oneWayResults.meta.count)
    console.log()

    // Test 5: Flight Inspiration (if available)
    console.log('💡 Test 5: Flight Inspiration')
    try {
      const inspirationParams = {
        origin: 'NYC',
        maxPrice: 500,
        departureDate: '2025-07-15'
      }
      
      console.log('Inspiration parameters:', inspirationParams)
      const inspiration = await amadeus.getFlightInspiration(inspirationParams)
      
      console.log('✅ Flight inspiration successful')
      console.log('- Destinations found:', inspiration.data?.length || 0)
      
      if (inspiration.data && inspiration.data.length > 0) {
        console.log('\n🎯 Top Inspiration Destinations:')
        inspiration.data.slice(0, 3).forEach((dest, index) => {
          console.log(`${index + 1}. ${dest.destination} - ${dest.price?.total} ${dest.price?.currency}`)
        })
      }
    } catch (error) {
      console.log('⚠️ Flight inspiration not available:', error.message)
    }
    console.log()

    // Test 6: Service Statistics
    console.log('📊 Test 6: Service Statistics')
    const stats = amadeus.getStats()
    console.log('Service Statistics:', stats)
    console.log()

    // Test 7: Health Check
    console.log('🏥 Test 7: Health Check')
    const healthCheck = await amadeus.healthCheck()
    console.log('Health Check Results:', healthCheck)
    console.log()

    console.log('🎉 All Amadeus flight tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
    
    // Additional debugging
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔍 Authentication Debug:')
      console.log('- Client ID present:', !!(process.env.AMADEUS_API_KEY || process.env.VITE_AMADEUS_API_KEY))
      console.log('- Client Secret present:', !!(process.env.AMADEUS_API_SECRET || process.env.VITE_AMADEUS_API_SECRET))
    }
  }
}

// Run the test
testAmadeusFlights() 