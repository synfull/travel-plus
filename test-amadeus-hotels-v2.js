/**
 * Amadeus Hotels API Test - V2 Endpoints
 */

import { config } from 'dotenv'
config()

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'
const BASE_URL_V2 = 'https://test.api.amadeus.com/v2'
const BASE_URL_V3 = 'https://test.api.amadeus.com/v3'

async function testAmadeusHotelsV2() {
  console.log('🏨 Testing Amadeus Hotel Search API - V2 Endpoints...\n')
  
  // Check credentials
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error('❌ Missing API credentials!')
    return
  }
  
  try {
    // Step 1: Authentication
    console.log('1️⃣ Authenticating...')
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
      throw new Error(`Authentication failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token
    console.log('✅ Authentication successful!\n')
    
    // Step 2: Test Hotel List Search (V2 endpoint)
    console.log('2️⃣ Testing Hotel List Search (V2)...')
    const hotelListParams = new URLSearchParams({
      cityCode: 'PAR',  // Paris - known to have data in test environment
      radius: '20',
      radiusUnit: 'KM'
    })
    
    const hotelListResponse = await fetch(`${BASE_URL_V2}/reference-data/locations/hotels/by-city?${hotelListParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (hotelListResponse.ok) {
      const hotelListData = await hotelListResponse.json()
      console.log(`✅ Found ${hotelListData.data?.length || 0} hotels in Paris`)
      if (hotelListData.data && hotelListData.data.length > 0) {
        console.log(`   First hotel: ${hotelListData.data[0].name}`)
        console.log(`   Hotel ID: ${hotelListData.data[0].hotelId}`)
      }
    } else {
      const errorText = await hotelListResponse.text()
      console.log('⚠️ Hotel list search failed:', hotelListResponse.status)
      console.log('   Response:', errorText.substring(0, 200))
    }
    console.log('')
    
    // Step 3: Test Hotel Search V3 (Shopping endpoint)
    console.log('3️⃣ Testing Hotel Shopping Search (V3)...')
    
    // Use future dates
    const checkInDate = new Date()
    checkInDate.setDate(checkInDate.getDate() + 30)
    const checkOutDate = new Date()
    checkOutDate.setDate(checkOutDate.getDate() + 32)
    
    const shoppingParams = new URLSearchParams({
      hotelIds: 'BWPARMB',  // Paris hotel ID from test data
      adults: '2',
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkOutDate: checkOutDate.toISOString().split('T')[0]
    })
    
    console.log(`   Searching availability for ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`)
    
    const shoppingResponse = await fetch(`${BASE_URL_V3}/shopping/hotel-offers-search?${shoppingParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (shoppingResponse.ok) {
      const shoppingData = await shoppingResponse.json()
      console.log(`✅ Found ${shoppingData.data?.length || 0} hotel offers`)
      if (shoppingData.data && shoppingData.data.length > 0) {
        const firstOffer = shoppingData.data[0]
        console.log(`   Hotel: ${firstOffer.hotel?.name || 'Unknown'}`)
        console.log(`   Price: ${firstOffer.offers?.[0]?.price?.total || 'N/A'} ${firstOffer.offers?.[0]?.price?.currency || ''}`)
        console.log(`   Room: ${firstOffer.offers?.[0]?.room?.description?.text || 'Standard Room'}`)
      }
    } else {
      const errorText = await shoppingResponse.text()
      console.log('⚠️ Hotel shopping search failed:', shoppingResponse.status)
      console.log('   Response:', errorText.substring(0, 300))
    }
    console.log('')
    
    // Step 4: Test Hotel Search by Location (V2)
    console.log('4️⃣ Testing Hotel Search by Location (V2)...')
    const geoParams = new URLSearchParams({
      latitude: '48.8566',  // Paris coordinates
      longitude: '2.3522',
      radius: '20',
      radiusUnit: 'KM'
    })
    
    const geoResponse = await fetch(`${BASE_URL_V2}/reference-data/locations/hotels/by-geocode?${geoParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (geoResponse.ok) {
      const geoData = await geoResponse.json()
      console.log(`✅ Found ${geoData.data?.length || 0} hotels by location`)
      if (geoData.data && geoData.data.length > 0) {
        console.log(`   Nearby hotel: ${geoData.data[0].name}`)
      }
    } else {
      const errorText = await geoResponse.text()
      console.log('⚠️ Location-based hotel search failed:', geoResponse.status)
      console.log('   Response:', errorText.substring(0, 200))
    }
    
    // Step 5: Test Hotel Offers Search (Alternative endpoint)
    console.log('\n5️⃣ Testing Alternative Hotel Offers Search...')
    const offersParams = new URLSearchParams({
      cityCode: 'PAR',
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      adults: '2'
    })
    
    const offersResponse = await fetch(`${BASE_URL_V2}/shopping/hotel-offers?${offersParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (offersResponse.ok) {
      const offersData = await offersResponse.json()
      console.log(`✅ Found ${offersData.data?.length || 0} hotel offers by city`)
      if (offersData.data && offersData.data.length > 0) {
        const firstOffer = offersData.data[0]
        console.log(`   Hotel: ${firstOffer.hotel?.name || 'Unknown'}`)
        console.log(`   Price: ${firstOffer.offers?.[0]?.price?.total || 'N/A'} ${firstOffer.offers?.[0]?.price?.currency || ''}`)
      }
    } else {
      const errorText = await offersResponse.text()
      console.log('⚠️ Hotel offers search failed:', offersResponse.status)
      console.log('   Response:', errorText.substring(0, 300))
    }
    
    console.log('\n🎉 Amadeus Hotel API V2 test completed!')
    console.log('\n📋 Hotel Search Status:')
    console.log('   ✅ Authentication working')
    console.log('   🏨 Testing multiple endpoints')
    console.log('   💰 Checking availability & pricing')
    console.log('   📍 Location-based searches')
    
  } catch (error) {
    console.error('❌ Hotel test failed:', error.message)
  }
}

testAmadeusHotelsV2().catch(console.error) 