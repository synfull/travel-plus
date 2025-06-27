/**
 * Simple Amadeus API Test
 */

// Load environment variables for ES modules
import { config } from 'dotenv'
config()

// Get API credentials from environment variables
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'
const BASE_URL = 'https://test.api.amadeus.com/v2'

async function testAmadeusAPI() {
  console.log('🧪 Testing Amadeus API directly...\n')
  console.log('🔧 Using TEST environment: test.api.amadeus.com\n')
  
  // Check if credentials are available
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error('❌ Missing API credentials!')
    console.error('   Please add the following to your .env file:')
    console.error('   AMADEUS_API_KEY=your_api_key')
    console.error('   AMADEUS_API_SECRET=your_api_secret')
    return
  }
  
  console.log('🔑 API Credentials Found:')
  console.log(`   API Key: ${AMADEUS_API_KEY.substring(0, 8)}...`)
  console.log(`   API Secret: ${AMADEUS_API_SECRET.substring(0, 8)}...\n`)
  
  try {
    // Step 1: Authentication
    console.log('1️⃣ Testing Authentication...')
    
    const authResponse = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET
      })
    })

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token
    
    console.log('✅ Authentication successful!')
    console.log(`   Token expires in: ${authData.expires_in} seconds\n`)
    
    // Step 2: Test Location Search
    console.log('2️⃣ Testing Location Search...')
    
    const locationParams = new URLSearchParams({
      keyword: 'Los Angeles',
      'sub-type': 'AIRPORT,CITY',
      'page[limit]': '5'
    })
    
    const locationResponse = await fetch(`${BASE_URL}/reference-data/locations?${locationParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (locationResponse.ok) {
      const locationData = await locationResponse.json()
      console.log(`✅ Found ${locationData.data.length} locations`)
      if (locationData.data.length > 0) {
        console.log(`   First result: ${locationData.data[0].name} (${locationData.data[0].iataCode})`)
      }
    } else {
      console.log('⚠️ Location search failed')
    }
    console.log('')
    
    // Step 3: Test Flight Search
    console.log('3️⃣ Testing Flight Search...')
    
    // Use future dates (30 days from now)
    const departureDate = new Date()
    departureDate.setDate(departureDate.getDate() + 30)
    const returnDate = new Date()
    returnDate.setDate(returnDate.getDate() + 37)
    
    const flightParams = new URLSearchParams({
      originLocationCode: 'NYC',
      destinationLocationCode: 'LAX',
      departureDate: departureDate.toISOString().split('T')[0], // YYYY-MM-DD format
      returnDate: returnDate.toISOString().split('T')[0],
      adults: '2',
      travelClass: 'ECONOMY',
      max: '5'
    })
    
    console.log(`   Searching flights: NYC → LAX on ${departureDate.toISOString().split('T')[0]}`)
    
    const flightResponse = await fetch(`${BASE_URL}/shopping/flight-offers?${flightParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (flightResponse.ok) {
      const flightData = await flightResponse.json()
      console.log(`✅ Found ${flightData.data.length} flight offers`)
      if (flightData.data.length > 0) {
        const firstFlight = flightData.data[0]
        console.log(`   Best price: ${firstFlight.price.total} ${firstFlight.price.currency}`)
        console.log(`   Airline: ${firstFlight.itineraries[0].segments[0].carrierCode}`)
      }
    } else {
      const errorText = await flightResponse.text()
      console.log('⚠️ Flight search failed:', flightResponse.status)
      console.log('   Response:', errorText.substring(0, 200))
    }
    console.log('')
    
    console.log('🎉 Amadeus API test completed successfully!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Your API credentials are working ✅')
    console.log('   2. Add them to your .env file')
    console.log('   3. Start the dev server: npm run dev')
    console.log('   4. Test flight/hotel search in the app')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.message.includes('Authentication failed')) {
      console.error('\n🔑 API Key Issues:')
      console.error('   - Check if your Amadeus API keys are correct')
      console.error('   - Verify your account is active at developers.amadeus.com')
      console.error('   - Ensure you\'re using the Test environment keys')
    }
  }
}

testAmadeusAPI().catch(console.error) 