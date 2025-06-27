/**
 * Amadeus Hotels API Test
 */

import { config } from 'dotenv'
config()

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'
const BASE_URL = 'https://test.api.amadeus.com/v3'

async function testAmadeusHotels() {
  console.log('🏨 Testing Amadeus Hotel Search API...\n')
  
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
    
    // Step 2: Test Hotel List Search (by city)
    console.log('2️⃣ Testing Hotel List Search...')
    const hotelListParams = new URLSearchParams({
      cityCode: 'NYC',
      radius: '20',
      radiusUnit: 'KM',
      hotelSource: 'ALL'
    })
    
    const hotelListResponse = await fetch(`${BASE_URL}/reference-data/locations/hotels/by-city?${hotelListParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (hotelListResponse.ok) {
      const hotelListData = await hotelListResponse.json()
      console.log(`✅ Found ${hotelListData.data?.length || 0} hotels in NYC`)
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
    
    // Step 3: Test Hotel Availability Search
    console.log('3️⃣ Testing Hotel Availability Search...')
    
    // Use future dates
    const checkInDate = new Date()
    checkInDate.setDate(checkInDate.getDate() + 30)
    const checkOutDate = new Date()
    checkOutDate.setDate(checkOutDate.getDate() + 32)
    
    const availabilityParams = new URLSearchParams({
      hotelIds: 'MCLONGHM',  // Example hotel ID
      adults: '2',
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      roomQuantity: '1',
      priceRange: '0-500',
      currency: 'USD',
      bestRateOnly: 'true'
    })
    
    console.log(`   Searching availability for ${checkInDate.toISOString().split('T')[0]} to ${checkOutDate.toISOString().split('T')[0]}`)
    
    const availabilityResponse = await fetch(`${BASE_URL}/shopping/hotel-offers?${availabilityParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (availabilityResponse.ok) {
      const availabilityData = await availabilityResponse.json()
      console.log(`✅ Found ${availabilityData.data?.length || 0} hotel offers`)
      if (availabilityData.data && availabilityData.data.length > 0) {
        const firstOffer = availabilityData.data[0]
        console.log(`   Hotel: ${firstOffer.hotel?.name || 'Unknown'}`)
        console.log(`   Price: ${firstOffer.offers?.[0]?.price?.total || 'N/A'} ${firstOffer.offers?.[0]?.price?.currency || ''}`)
        console.log(`   Room: ${firstOffer.offers?.[0]?.room?.description?.text || 'Standard Room'}`)
      }
    } else {
      const errorText = await availabilityResponse.text()
      console.log('⚠️ Hotel availability search failed:', availabilityResponse.status)
      console.log('   Response:', errorText.substring(0, 300))
    }
    console.log('')
    
    // Step 4: Test Hotel Search by Geocode
    console.log('4️⃣ Testing Hotel Search by Location...')
    const geoParams = new URLSearchParams({
      latitude: '40.7589',  // NYC coordinates
      longitude: '-73.9851',
      radius: '20',
      radiusUnit: 'KM',
      hotelSource: 'ALL'
    })
    
    const geoResponse = await fetch(`${BASE_URL}/reference-data/locations/hotels/by-geocode?${geoParams}`, {
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
    
    console.log('\n🎉 Amadeus Hotel API test completed!')
    console.log('\n📋 Hotel Search Capabilities:')
    console.log('   ✅ Authentication working')
    console.log('   🏨 Hotel list by city')
    console.log('   💰 Hotel availability & pricing')
    console.log('   📍 Location-based hotel search')
    
  } catch (error) {
    console.error('❌ Hotel test failed:', error.message)
  }
}

testAmadeusHotels().catch(console.error) 