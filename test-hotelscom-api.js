/**
 * Test Hotels.com API Integration
 * Tests the RapidAPI Hotels.com service
 */

import { HotelsComService } from './src/services/api/HotelsComService.js'

// Test credentials from your RapidAPI account
const RAPIDAPI_KEY = '3f16a75daamsh5cc5fad46175adbp1557e4jsnec45fe15ad92'

async function testHotelsComAPI() {
  console.log('🏨 Testing Hotels.com API Integration...')
  console.log(`📍 API Key: ${RAPIDAPI_KEY.substring(0, 8)}...`)
  
  try {
    const hotelscom = new HotelsComService({
      apiKey: RAPIDAPI_KEY
    })

    console.log('\n🔍 Testing location search for "New York"...')
    const locationId = await hotelscom.getLocationId('New York')
    console.log('📍 Location ID:', locationId)

    if (locationId) {
      console.log('\n🏨 Testing hotel search in New York...')
      const results = await hotelscom.searchHotels({
        destination: 'New York',
        checkInDate: '2025-07-10',
        checkOutDate: '2025-07-12',
        guests: 1,
        rooms: 1
      })

      console.log(`\n✅ Hotels.com API Results:`)
      console.log(`📊 Found ${results.hotels.length} hotels`)
      console.log(`🏢 Provider: ${results.meta.provider}`)
      
      if (results.hotels.length > 0) {
        console.log('\n🏨 Sample Hotels:')
        results.hotels.slice(0, 3).forEach((hotel, index) => {
          console.log(`\n${index + 1}. ${hotel.name}`)
          console.log(`   ⭐ Rating: ${hotel.rating}`)
          console.log(`   💰 Price: $${hotel.price.total} ${hotel.price.currency}`)
          console.log(`   📍 Location: ${hotel.location.address}`)
          console.log(`   🔗 Booking: ${hotel.bookingUrl}`)
        })
      }
    }

  } catch (error) {
    console.error('\n❌ Hotels.com API Test Failed:')
    console.error('Error:', error.message)
    console.error('Status:', error.status || 'Unknown')
  }
}

// Run the test
testHotelsComAPI().catch(console.error) 