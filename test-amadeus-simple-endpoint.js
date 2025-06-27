#!/usr/bin/env node

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

dotenv.config()

async function testAmadeusEndpoints() {
  console.log('🧪 Testing Amadeus Hotel API Endpoints...')
  
  try {
    const amadeus = new AmadeusService({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      environment: 'test'
    })

    await amadeus.authenticate()
    console.log('✅ Authentication successful')

    // Test different endpoints to see which ones work
    const endpoints = [
      '/reference-data/locations/hotels/by-city?cityCode=TYO',
      '/reference-data/locations/hotels/by-city?cityCode=PAR', 
      '/reference-data/locations/hotels/by-geocode?latitude=35.6762&longitude=139.6503',
      '/v1/reference-data/locations/hotels/by-city?cityCode=TYO',
      '/v2/reference-data/locations/hotels/by-city?cityCode=TYO',
      '/v3/reference-data/locations/hotels/by-city?cityCode=TYO'
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔍 Testing: ${endpoint}`)
        const response = await amadeus.makeRequest(endpoint)
        console.log(`✅ SUCCESS: Found ${response.data?.length || 0} results`)
        
        if (response.data && response.data.length > 0) {
          const sample = response.data[0]
          console.log(`   Sample: ${sample.name || sample.hotelId || 'Unknown'} (${sample.hotelId || 'No ID'})`)
        }
        
        // If this endpoint works, try hotel search with it
        if (response.data && response.data.length > 0) {
          const hotelIds = response.data.slice(0, 3).map(h => h.hotelId).join(',')
          console.log(`   🏨 Trying hotel search with IDs: ${hotelIds}`)
          
          try {
            const searchResponse = await amadeus.makeRequest(`/v3/shopping/hotel-offers?hotelIds=${hotelIds}&checkInDate=2025-07-10&checkOutDate=2025-07-12&adults=2`)
            console.log(`   ✅ Hotel search SUCCESS: Found ${searchResponse.data?.length || 0} offers`)
          } catch (searchErr) {
            console.log(`   ❌ Hotel search failed: ${searchErr.message}`)
          }
        }
        
      } catch (error) {
        console.log(`❌ FAILED: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAmadeusEndpoints() 