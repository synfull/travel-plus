#!/usr/bin/env node

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

dotenv.config()

async function testAmadeusFixed() {
  console.log('🧪 Testing Fixed Amadeus Hotel API v3...')
  
  try {
    // Initialize the service
    const amadeus = new AmadeusService({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      environment: 'test'
    })

    console.log('🔐 Testing authentication...')
    await amadeus.authenticate()
    console.log('✅ Authentication successful')

    console.log('🏨 Testing hotel search for Tokyo...')
    const result = await amadeus.searchHotels({
      destination: 'tokyo',
      checkInDate: '2025-07-10',
      checkOutDate: '2025-07-12',
      guests: 2,
      rooms: 1
    })

    console.log('📊 Results:')
    console.log(`  Hotels found: ${result.hotels.length}`)
    console.log(`  Meta: ${JSON.stringify(result.meta, null, 2)}`)
    
    if (result.hotels.length > 0) {
      console.log('\n🏨 First hotel:')
      const hotel = result.hotels[0]
      console.log(`  ID: ${hotel.id}`)
      console.log(`  Name: ${hotel.name}`)
      console.log(`  Rating: ${hotel.rating}`)
      console.log(`  Price: ${hotel.price.total} ${hotel.price.currency}`)
      console.log(`  Location: ${JSON.stringify(hotel.location.coordinates)}`)
      console.log(`  Room: ${hotel.room.description}`)
      console.log(`  Available: ${hotel.available}`)
    }

    console.log('✅ Amadeus v3 API test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('🔍 Full error:', error)
  }
}

testAmadeusFixed() 