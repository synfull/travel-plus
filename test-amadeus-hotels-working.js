/**
 * Test Amadeus Hotels with Cities Known to Have Data
 */

import { config } from 'dotenv'
config()

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'
const BASE_URL_V2 = 'https://test.api.amadeus.com/v2'

async function testWorkingCities() {
  console.log('🏨 Testing Amadeus Hotels with Known Working Cities...\n')
  
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error('❌ Missing API credentials!')
    return
  }
  
  try {
    // Authentication
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
    
    // Test cities that are documented to have hotel data in test environment
    const testCities = [
      { code: 'LON', name: 'London' },
      { code: 'NYC', name: 'New York' },
      { code: 'PAR', name: 'Paris' }
    ]
    
    for (const city of testCities) {
      console.log(`2️⃣ Testing Hotel List for ${city.name} (${city.code})...`)
      
      const hotelListParams = new URLSearchParams({
        cityCode: city.code,
        radius: '20',
        radiusUnit: 'KM'
      })
      
      const hotelListResponse = await fetch(`${BASE_URL_V2}/reference-data/locations/hotels/by-city?${hotelListParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`   Status: ${hotelListResponse.status} ${hotelListResponse.statusText}`)
      
      if (hotelListResponse.ok) {
        const hotelListData = await hotelListResponse.json()
        console.log(`   ✅ Found ${hotelListData.data?.length || 0} hotels in ${city.name}`)
        if (hotelListData.data && hotelListData.data.length > 0) {
          console.log(`   First hotel: ${hotelListData.data[0].name}`)
          console.log(`   Hotel ID: ${hotelListData.data[0].hotelId}`)
          
          // Try hotel availability for this hotel
          console.log(`   Testing availability for ${hotelListData.data[0].name}...`)
          
          const checkInDate = new Date()
          checkInDate.setDate(checkInDate.getDate() + 30)
          const checkOutDate = new Date()
          checkOutDate.setDate(checkOutDate.getDate() + 32)
          
          const availabilityParams = new URLSearchParams({
            hotelIds: hotelListData.data[0].hotelId,
            adults: '2',
            checkInDate: checkInDate.toISOString().split('T')[0],
            checkOutDate: checkOutDate.toISOString().split('T')[0]
          })
          
          const availabilityResponse = await fetch(`${BASE_URL_V2}/shopping/hotel-offers?${availabilityParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (availabilityResponse.ok) {
            const availabilityData = await availabilityResponse.json()
            console.log(`   ✅ Found ${availabilityData.data?.length || 0} offers`)
            if (availabilityData.data && availabilityData.data.length > 0) {
              const offer = availabilityData.data[0]
              console.log(`   Price: ${offer.offers?.[0]?.price?.total || 'N/A'} ${offer.offers?.[0]?.price?.currency || ''}`)
            }
          } else {
            const errorText = await availabilityResponse.text()
            console.log(`   ⚠️ Availability failed: ${availabilityResponse.status}`)
            console.log(`   Error: ${errorText.substring(0, 100)}...`)
          }
        }
      } else {
        const errorText = await hotelListResponse.text()
        console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`)
      }
      
      console.log('')
      
      // Wait between city tests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    console.log('🎉 Hotel testing completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWorkingCities().catch(console.error) 