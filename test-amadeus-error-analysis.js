/**
 * Amadeus Hotel API Error Analysis
 * Captures specific error details without making changes
 */

import dotenv from 'dotenv'
dotenv.config()

async function analyzeAmadeusHotelErrors() {
  console.log('🔍 AMADEUS HOTEL API ERROR ANALYSIS')
  console.log('=' .repeat(50))
  
  const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
  const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
  const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'
  const BASE_URL = 'https://test.api.amadeus.com'
  
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error('❌ Missing API credentials!')
    return
  }
  
  try {
    // Step 1: Authentication
    console.log('\n1️⃣ Authentication...')
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
    console.log('✅ Authentication successful')
    
    // Step 2: Get hotel list (this works)
    console.log('\n2️⃣ Getting hotel list for NYC...')
    const hotelListResponse = await fetch(`${BASE_URL}/v1/reference-data/locations/hotels/by-city?cityCode=NYC&radius=20&radiusUnit=KM`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!hotelListResponse.ok) {
      const errorText = await hotelListResponse.text()
      console.log(`❌ Hotel list failed: ${hotelListResponse.status}`)
      console.log(`Error details: ${errorText}`)
      return
    }
    
    const hotelListData = await hotelListResponse.json()
    console.log(`✅ Found ${hotelListData.data?.length || 0} hotels`)
    
    if (!hotelListData.data || hotelListData.data.length === 0) {
      console.log('❌ No hotels found, cannot test availability')
      return
    }
    
    // Step 3: Test different availability endpoints and parameters
    console.log('\n3️⃣ Testing hotel availability endpoints...')
    
    const testHotels = hotelListData.data.slice(0, 3) // Test first 3 hotels
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + 30) // 30 days from now
    const checkInDate = testDate.toISOString().split('T')[0]
    const checkOutDate = new Date(testDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    console.log(`Using dates: ${checkInDate} to ${checkOutDate}`)
    
    for (const [index, hotel] of testHotels.entries()) {
      console.log(`\n🏨 Hotel ${index + 1}: ${hotel.name} (ID: ${hotel.hotelId})`)
      
      // Test different endpoint versions and parameter combinations
      const testCases = [
        {
          name: 'V3 with hotelIds parameter',
          url: `/v3/shopping/hotel-offers?hotelIds=${hotel.hotelId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=2&roomQuantity=1`
        },
        {
          name: 'V2 with hotelIds parameter',
          url: `/v2/shopping/hotel-offers?hotelIds=${hotel.hotelId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=2&roomQuantity=1`
        },
        {
          name: 'V1 with hotelId parameter (singular)',
          url: `/v1/shopping/hotel-offers?hotelId=${hotel.hotelId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&adults=2&roomQuantity=1`
        }
      ]
      
      for (const testCase of testCases) {
        console.log(`   Testing: ${testCase.name}`)
        
        try {
          const response = await fetch(`${BASE_URL}${testCase.url}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          console.log(`   Status: ${response.status} ${response.statusText}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log(`   ✅ Success: ${data.data?.length || 0} offers found`)
            if (data.data && data.data.length > 0) {
              const offer = data.data[0]
              console.log(`   Price: ${offer.offers?.[0]?.price?.total || 'N/A'} ${offer.offers?.[0]?.price?.currency || ''}`)
            }
          } else {
            const errorText = await response.text()
            let errorData
            try {
              errorData = JSON.parse(errorText)
            } catch {
              errorData = { raw: errorText }
            }
            
            console.log(`   ❌ Failed: ${response.status}`)
            if (errorData.errors) {
              errorData.errors.forEach(error => {
                console.log(`   Error Code: ${error.code || 'N/A'}`)
                console.log(`   Error Title: ${error.title || 'N/A'}`)
                console.log(`   Error Detail: ${error.detail || 'N/A'}`)
                console.log(`   Error Source: ${JSON.stringify(error.source || {})}`)
              })
            } else {
              console.log(`   Raw Error: ${errorText.substring(0, 200)}...`)
            }
          }
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.log(`   ❌ Request failed: ${error.message}`)
        }
      }
      
      console.log('   ' + '-'.repeat(40))
    }
    
    // Step 4: Test hotel details endpoint
    console.log('\n4️⃣ Testing hotel details endpoint...')
    const sampleHotel = testHotels[0]
    
    try {
      const detailsResponse = await fetch(`${BASE_URL}/v1/reference-data/locations/hotels/by-hotels?hotelIds=${sampleHotel.hotelId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`Details endpoint status: ${detailsResponse.status}`)
      
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json()
        console.log(`✅ Hotel details: ${detailsData.data?.length || 0} records`)
      } else {
        const errorText = await detailsResponse.text()
        console.log(`❌ Details failed: ${errorText.substring(0, 200)}...`)
      }
    } catch (error) {
      console.log(`❌ Details request failed: ${error.message}`)
    }
    
    console.log('\n📊 ANALYSIS SUMMARY')
    console.log('=' .repeat(50))
    console.log('✅ Hotel list endpoint: Working (v1/reference-data/locations/hotels/by-city)')
    console.log('❓ Hotel availability endpoints: Testing results above')
    console.log('❓ Hotel details endpoint: Testing results above')
    console.log('\n💡 Check the specific error codes and messages above to identify the root cause')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
    console.error('Full error:', error)
  }
}

analyzeAmadeusHotelErrors() 