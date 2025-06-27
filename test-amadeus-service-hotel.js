/**
 * Test AmadeusService Hotel Search
 */

import { config } from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

config()

async function testAmadeusServiceHotels() {
  console.log('🏨 Testing AmadeusService Hotel Search...\n')
  
  try {
    // Initialize the service
    const amadeus = new AmadeusService({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET
    })
    
    // Test hotel search
    console.log('1️⃣ Testing Hotel Search in Paris...')
    
    const checkInDate = new Date()
    checkInDate.setDate(checkInDate.getDate() + 30)
    const checkOutDate = new Date()
    checkOutDate.setDate(checkOutDate.getDate() + 32)
    
    const hotelResults = await amadeus.searchHotels({
      destination: 'Paris',
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      guests: 2,
      rooms: 1
    })
    
    console.log(`✅ Hotel search completed!`)
    console.log(`   Found: ${hotelResults.hotels?.length || 0} hotels`)
    console.log(`   Total available: ${hotelResults.meta?.totalFound || 0}`)
    console.log(`   City code: ${hotelResults.meta?.cityCode}`)
    
    if (hotelResults.hotels && hotelResults.hotels.length > 0) {
      const firstHotel = hotelResults.hotels[0]
      console.log(`   First hotel: ${firstHotel.name || 'Unknown'}`)
      console.log(`   Price: ${firstHotel.price?.total || 'N/A'} ${firstHotel.price?.currency || ''}`)
    }
    
    // Test service stats
    console.log('\n2️⃣ Service Statistics:')
    const stats = amadeus.getStats()
    console.log(`   Total requests: ${stats.totalRequests}`)
    console.log(`   Successful: ${stats.successfulRequests}`)
    console.log(`   Cache hits: ${stats.cacheHits}`)
    console.log(`   Retries: ${stats.retries}`)
    
    console.log('\n🎉 AmadeusService hotel test completed!')
    
  } catch (error) {
    console.error('❌ AmadeusService hotel test failed:', error.message)
    
    if (error.message.includes('Authentication')) {
      console.error('   Check your API credentials in .env file')
    } else if (error.message.includes('404')) {
      console.error('   API endpoint might still be incorrect')
    } else if (error.message.includes('Rate limit')) {
      console.error('   API rate limit exceeded')
    }
  }
}

testAmadeusServiceHotels().catch(console.error) 