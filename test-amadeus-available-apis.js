#!/usr/bin/env node

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

dotenv.config()

async function testAmadeusAvailableAPIs() {
  console.log('🧪 Testing Available Amadeus APIs...')
  
  try {
    const amadeus = new AmadeusService({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      environment: 'test'
    })

    await amadeus.authenticate()
    console.log('✅ Authentication successful')

    // Test different API categories to see what's available
    const testAPIs = [
      {
        name: 'Flight Offers Search',
        endpoint: '/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=LAX&departureDate=2025-07-10&adults=1'
      },
      {
        name: 'Airport & City Search',
        endpoint: '/v1/reference-data/locations?keyword=NYC&subType=AIRPORT,CITY'
      },
      {
        name: 'Hotel List (v1)',
        endpoint: '/v1/reference-data/locations/hotels/by-city?cityCode=NYC'
      },
      {
        name: 'Hotel Search (v3)',
        endpoint: '/v3/shopping/hotel-offers?hotelIds=HLNYCUTD&checkInDate=2025-07-10&checkOutDate=2025-07-12&adults=1'
      },
      {
        name: 'Points of Interest',
        endpoint: '/v1/reference-data/locations/pois?latitude=40.7128&longitude=-74.0060'
      },
      {
        name: 'Flight Price Analysis',
        endpoint: '/v1/analytics/itinerary-price-metrics?originIataCode=NYC&destinationIataCode=LAX&departureDate=2025-07-10'
      }
    ]

    for (const api of testAPIs) {
      try {
        console.log(`\n🔍 Testing: ${api.name}`)
        console.log(`   Endpoint: ${api.endpoint}`)
        
        const response = await amadeus.makeRequest(api.endpoint)
        
        if (response.data) {
          console.log(`✅ SUCCESS: ${api.name}`)
          console.log(`   Results: ${Array.isArray(response.data) ? response.data.length + ' items' : 'Object response'}`)
          
          // Show sample data
          if (Array.isArray(response.data) && response.data.length > 0) {
            const sample = response.data[0]
            console.log(`   Sample: ${JSON.stringify(sample).substring(0, 100)}...`)
          }
        } else {
          console.log(`⚠️  EMPTY: ${api.name} - No data returned`)
        }
        
      } catch (error) {
        console.log(`❌ FAILED: ${api.name}`)
        console.log(`   Error: ${error.message}`)
      }
    }

    console.log('\n📋 Summary: The working APIs can be used for hotel fallback')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAmadeusAvailableAPIs() 