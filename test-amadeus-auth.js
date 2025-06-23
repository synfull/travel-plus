/**
 * Simple Amadeus API Authentication Test
 * Tests the API keys directly without any framework overhead
 */

// Test credentials
const API_KEY = '2zQ4IDCw05a63DZ9HjxOQKp8GS7yXnGk'
const API_SECRET = 'I5HjjDAg151nKfrb'
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'

async function testAmadeusAuth() {
  console.log('🔐 Testing Amadeus API Authentication...')
  console.log(`📍 API Key: ${API_KEY.substring(0, 8)}...`)
  console.log(`📍 Auth URL: ${AUTH_URL}`)
  
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: API_SECRET
      })
    })

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`)
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log(`📊 Response Body:`, responseText)

    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('✅ Authentication SUCCESSFUL!')
      console.log(`🎟️ Access Token: ${data.access_token?.substring(0, 20)}...`)
      console.log(`⏰ Expires In: ${data.expires_in} seconds`)
      return data.access_token
    } else {
      console.log('❌ Authentication FAILED!')
      try {
        const errorData = JSON.parse(responseText)
        console.log('📋 Error Details:', errorData)
      } catch (e) {
        console.log('📋 Raw Error:', responseText)
      }
      return null
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message)
    return null
  }
}

// Test flight search with token
async function testFlightSearch(accessToken) {
  if (!accessToken) {
    console.log('❌ Skipping flight search - no access token')
    return
  }

  console.log('\n✈️ Testing Flight Search...')
  const searchUrl = 'https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=PAR&departureDate=2025-07-15&adults=1&max=5'
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 Flight Search Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Flight Search SUCCESSFUL!')
      console.log(`📊 Found ${data.data?.length || 0} flight offers`)
      if (data.data && data.data.length > 0) {
        console.log(`💰 First flight price: ${data.data[0].price?.total} ${data.data[0].price?.currency}`)
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Flight Search FAILED!')
      console.log('📋 Error:', errorText)
    }
  } catch (error) {
    console.log('💥 Flight Search Error:', error.message)
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Starting Amadeus API Tests\n')
  
  const accessToken = await testAmadeusAuth()
  await testFlightSearch(accessToken)
  
  console.log('\n🏁 Tests Complete')
}

runTests().catch(console.error) 