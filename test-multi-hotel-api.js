#!/usr/bin/env node

import dotenv from 'dotenv'
dotenv.config()

import fetch from 'node-fetch'

async function testMultiHotelAPI() {
  console.log('🧪 Testing Multi-Hotel API System (Working APIs Only)...')
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/search-hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination: 'Tokyo',
        checkInDate: '2025-07-10',
        checkOutDate: '2025-07-12',
        guests: 2,
        rooms: 1
      })
    })

    const data = await response.json()
    
    console.log('\n📊 MULTI-HOTEL API TEST RESULTS:')
    console.log('='.repeat(50))
    console.log('🔗 Status:', response.status)
    console.log('📦 Success:', data.success)
    console.log('🏨 Source:', data.data?.metadata?.source)
    console.log('🔢 Hotels found:', data.data?.hotels?.length)
    
    if (data.data?.hotels?.length > 0) {
      console.log('\n🏨 SAMPLE HOTEL:')
      const hotel = data.data.hotels[0]
      console.log('🏨 Name:', hotel.name)
      console.log('⭐ Rating:', hotel.rating)
      console.log('💰 Price:', hotel.price?.total, hotel.price?.currency)
      console.log('📍 Address:', hotel.location?.address?.line1 || 'N/A')
    }
    
    console.log('\n📊 FULL RESPONSE:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testMultiHotelAPI() 