/**
 * Test Amadeus API Integration
 * Phase 4: Complete API Integration Testing
 */

import { AmadeusService } from './src/services/api/AmadeusService.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Test configuration
const TEST_CONFIG = {
  // Test flight search
  flight: {
    origin: 'NYC',
    destination: 'LAX',
    departureDate: '2024-06-01',
    returnDate: '2024-06-08',
    passengers: 2
  },
  
  // Test hotel search
  hotel: {
    destination: 'Los Angeles',
    checkInDate: '2024-06-01',
    checkOutDate: '2024-06-08',
    guests: 2,
    rooms: 1
  }
}

async function runAmadeusTests() {
  console.log('🧪 Starting Amadeus API Integration Tests\n')
  
  // Initialize Amadeus service
  const amadeus = new AmadeusService()
  
  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing Authentication...')
    await amadeus.authenticate()
    console.log('✅ Authentication successful\n')
    
    // Test 2: Location Search
    console.log('2️⃣ Testing Location Search...')
    const locations = await amadeus.searchLocations('Los Angeles')
    console.log(`✅ Found ${locations.locations.length} locations`)
    if (locations.locations.length > 0) {
      console.log(`   First result: ${locations.locations[0].name}`)
    }
    console.log('')
    
    // Test 3: Flight Search
    console.log('3️⃣ Testing Flight Search...')
    const flights = await amadeus.searchFlights(TEST_CONFIG.flight)
    console.log(`✅ Flight search completed`)
    console.log(`   Found ${flights.flights.length} flight options`)
    console.log(`   Currency: ${flights.meta.currency}`)
    
    if (flights.flights.length > 0) {
      const firstFlight = flights.flights[0]
      console.log(`   Best option: ${firstFlight.outbound?.airline} - $${firstFlight.price.total}`)
      console.log(`   Outbound: ${firstFlight.outbound?.departure.airport} → ${firstFlight.outbound?.arrival.airport}`)
      if (firstFlight.return) {
        console.log(`   Return: ${firstFlight.return.departure.airport} → ${firstFlight.return.arrival.airport}`)
      }
    }
    console.log('')
    
    // Test 4: Hotel Search
    console.log('4️⃣ Testing Hotel Search...')
    const hotels = await amadeus.searchHotels(TEST_CONFIG.hotel)
    console.log(`✅ Hotel search completed`)
    console.log(`   Found ${hotels.hotels.length} hotel options`)
    console.log(`   Destination: ${hotels.meta.destination}`)
    
    if (hotels.hotels.length > 0) {
      const firstHotel = hotels.hotels[0]
      console.log(`   Best option: ${firstHotel.name}`)
      console.log(`   Rating: ${firstHotel.rating} stars`)
      console.log(`   Price: $${firstHotel.price.total} ${firstHotel.price.currency}`)
      console.log(`   Amenities: ${firstHotel.amenities.slice(0, 3).join(', ')}`)
    }
    console.log('')
    
    // Test 5: Service Statistics
    console.log('5️⃣ Service Statistics...')
    const stats = amadeus.getStats()
    console.log(`✅ Service stats:`)
    console.log(`   Authenticated: ${stats.authenticated}`)
    console.log(`   Request count: ${stats.requestCount}`)
    console.log(`   Cache size: ${stats.cacheSize}`)
    console.log('')
    
    console.log('🎉 All Amadeus API tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('   This might be due to:')
    console.error('   - Missing API credentials (AMADEUS_API_KEY, AMADEUS_API_SECRET)')
    console.error('   - Network connectivity issues')
    console.error('   - API rate limiting')
    console.error('   - Invalid test parameters')
    
    // Test fallback behavior
    console.log('\n🔄 Testing fallback behavior...')
    await testFallbackBehavior()
  }
}

async function testFallbackBehavior() {
  console.log('📋 Testing Netlify Functions with fallback...')
  
  try {
    // Test flight search function
    console.log('✈️ Testing flight search function...')
    const flightResponse = await fetch('http://localhost:8888/.netlify/functions/search-flights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CONFIG.flight)
    })
    
    if (flightResponse.ok) {
      const flightData = await flightResponse.json()
      console.log(`✅ Flight function works: ${flightData.flights.length} results`)
      if (flightData.meta.isFallback) {
        console.log('   Using fallback data (expected if no API credentials)')
      }
    } else {
      console.log('⚠️ Flight function not available (run `npm run dev` first)')
    }
    
    // Test hotel search function
    console.log('🏨 Testing hotel search function...')
    const hotelResponse = await fetch('http://localhost:8888/.netlify/functions/search-hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CONFIG.hotel)
    })
    
    if (hotelResponse.ok) {
      const hotelData = await hotelResponse.json()
      console.log(`✅ Hotel function works: ${hotelData.hotels.length} results`)
      if (hotelData.meta.isFallback) {
        console.log('   Using fallback data (expected if no API credentials)')
      }
    } else {
      console.log('⚠️ Hotel function not available (run `npm run dev` first)')
    }
    
  } catch (error) {
    console.log('⚠️ Netlify functions not running. Start dev server with `npm run dev`')
  }
}

async function testItineraryGeneration() {
  console.log('\n🗺️ Testing Complete Itinerary Generation...')
  
  const tripData = {
    destination: 'Los Angeles',
    origin: 'NYC',
    startDate: '2024-06-01',
    endDate: '2024-06-08',
    people: 2,
    totalBudget: 3000,
    budgetPerPerson: 1500,
    categories: ['culture', 'food', 'nature'],
    includeFlights: true
  }
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/generate-itinerary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tripData)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Complete itinerary generation successful!')
      console.log(`   Destination: ${data.itinerary.destination}`)
      console.log(`   Days: ${data.itinerary.days?.length || 0}`)
      console.log(`   Hotels: ${data.itinerary.hotels?.length || 0}`)
      console.log(`   Flights: ${data.itinerary.flights ? 'Included' : 'Not included'}`)
      console.log(`   Total cost: $${data.metadata.totalCost}`)
      
      if (data.itinerary.flights?.source) {
        console.log(`   Flight source: ${data.itinerary.flights.source}`)
      }
      
      if (data.itinerary.hotels?.[0]?.source) {
        console.log(`   Hotel source: ${data.itinerary.hotels[0].source}`)
      }
      
    } else {
      console.log('⚠️ Itinerary generation failed')
    }
    
  } catch (error) {
    console.log('⚠️ Cannot test itinerary generation - server not running')
  }
}

// Environment check
function checkEnvironment() {
  console.log('🔍 Environment Check:')
  console.log(`   AMADEUS_API_KEY: ${process.env.AMADEUS_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`   AMADEUS_API_SECRET: ${process.env.AMADEUS_API_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log(`   VITE_AMADEUS_API_KEY: ${process.env.VITE_AMADEUS_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`   VITE_AMADEUS_API_SECRET: ${process.env.VITE_AMADEUS_API_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('')
  
  if (!process.env.AMADEUS_API_KEY && !process.env.VITE_AMADEUS_API_KEY) {
    console.log('⚠️ No Amadeus API credentials found.')
    console.log('   Add them to your .env file:')
    console.log('   AMADEUS_API_KEY=your_api_key')
    console.log('   AMADEUS_API_SECRET=your_api_secret')
    console.log('   VITE_AMADEUS_API_KEY=your_api_key')
    console.log('   VITE_AMADEUS_API_SECRET=your_api_secret')
    console.log('')
  }
}

// Run all tests
async function main() {
  checkEnvironment()
  await runAmadeusTests()
  await testItineraryGeneration()
  
  console.log('\n📋 Test Summary:')
  console.log('   - Amadeus API service integration')
  console.log('   - Flight and hotel search functionality')
  console.log('   - Fallback behavior when API unavailable')
  console.log('   - Complete itinerary generation pipeline')
  console.log('\n🚀 Phase 4: Amadeus API Integration testing complete!')
}

main().catch(console.error) 