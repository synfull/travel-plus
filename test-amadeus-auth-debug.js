/**
 * Amadeus Authentication Debug Test
 */

import { config } from 'dotenv'
config()

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token'

async function debugAmadeusAuth() {
  console.log('🔍 Debugging Amadeus Authentication...\n')
  
  // Step 1: Verify credentials are loaded
  console.log('1️⃣ Checking Environment Variables:')
  console.log(`   AMADEUS_API_KEY: ${AMADEUS_API_KEY ? '✅ Found' : '❌ Missing'}`)
  console.log(`   AMADEUS_API_SECRET: ${AMADEUS_API_SECRET ? '✅ Found' : '❌ Missing'}`)
  
  if (AMADEUS_API_KEY) {
    console.log(`   API Key Preview: ${AMADEUS_API_KEY.substring(0, 8)}...${AMADEUS_API_KEY.substring(-4)}`)
    console.log(`   API Key Length: ${AMADEUS_API_KEY.length} characters`)
  }
  
  if (AMADEUS_API_SECRET) {
    console.log(`   API Secret Preview: ${AMADEUS_API_SECRET.substring(0, 8)}...${AMADEUS_API_SECRET.substring(-4)}`)
    console.log(`   API Secret Length: ${AMADEUS_API_SECRET.length} characters`)
  }
  
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
    console.error('\n❌ Missing credentials! Please check your .env file.')
    return
  }
  
  console.log('\n2️⃣ Testing Authentication Request:')
  console.log('   🧪 Using TEST environment: test.api.amadeus.com')
  
  try {
    const requestBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET
    })
    
    console.log('   Request URL:', AUTH_URL)
    console.log('   Request Method: POST')
    console.log('   Content-Type: application/x-www-form-urlencoded')
    console.log('   Request Body:', requestBody.toString().replace(AMADEUS_API_SECRET, '***SECRET***'))
    
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: requestBody
    })
    
    console.log('\n3️⃣ Response Details:')
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log(`   Response Body:`, responseText)
    
    if (response.ok) {
      const authData = JSON.parse(responseText)
      console.log('\n✅ Authentication Successful!')
      console.log(`   Access Token: ${authData.access_token.substring(0, 20)}...`)
      console.log(`   Token Type: ${authData.token_type}`)
      console.log(`   Expires In: ${authData.expires_in} seconds`)
    } else {
      console.log('\n❌ Authentication Failed!')
      
      if (response.status === 401) {
        console.log('\n🔧 Common 401 Issues:')
        console.log('   1. Invalid API Key or Secret')
        console.log('   2. Using Production keys in Test environment (or vice versa)')
        console.log('   3. API Key might be disabled/suspended')
        console.log('   4. Whitespace/formatting issues in .env file')
        console.log('\n💡 Solutions:')
        console.log('   1. Double-check your credentials at developers.amadeus.com')
        console.log('   2. Ensure you\'re using TEST environment keys')
        console.log('   3. Check if your account is active')
        console.log('   4. Try regenerating your API keys')
      }
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message)
  }
}

debugAmadeusAuth().catch(console.error) 