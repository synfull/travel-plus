#!/usr/bin/env node

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

dotenv.config()

async function testAmadeusMultipleCities() {
  console.log('🧪 Testing Amadeus Hotel API with Multiple Cities...')
  
  try {
    const amadeus = new AmadeusService({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      environment: 'test'
    })

    await amadeus.authenticate()
    console.log('✅ Authentication successful')

    // Test different cities and dates
    const testCases = [
      { destination: 'paris', checkIn: '2025-07-10', checkOut: '2025-07-12' },
      { destination: 'london', checkIn: '2025-08-15', checkOut: '2025-08-17' },
      { destination: 'new york', checkIn: '2025-09-20', checkOut: '2025-09-22' },
      { destination: 'tokyo', checkIn: '2025-06-15', checkOut: '2025-06-17' }
    ]

    for (const testCase of testCases) {
      try {
        console.log(`\n🏨 Testing ${testCase.destination} (${testCase.checkIn} to ${testCase.checkOut})`)
        
        const result = await amadeus.searchHotels({
          destination: testCase.destination,
          checkInDate: testCase.checkIn,
          checkOutDate: testCase.checkOut,
          guests: 2,
          rooms: 1
        })

        console.log(`  📊 Results: ${result.hotels.length} hotels with offers`)
        
        if (result.hotels.length > 0) {
          const hotel = result.hotels[0]
          console.log(`  🏨 Sample: ${hotel.name}`)
          console.log(`     Price: ${hotel.price.total} ${hotel.price.currency}`)
          console.log(`     Rating: ${hotel.rating || 'N/A'}`)
          console.log(`     Available: ${hotel.available}`)
          
          // If we found working results, test a few more from this city
          console.log(`  ✅ SUCCESS! Found working hotel offers for ${testCase.destination}`)
          break
        } else {
          console.log(`  ⚠️ No offers available for ${testCase.destination}`)
        }
        
      } catch (error) {
        console.log(`  ❌ Error for ${testCase.destination}: ${error.message}`)
      }
    }

    console.log('\n📋 Test Summary: Checking if any location has available hotel offers')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAmadeusMultipleCities() 