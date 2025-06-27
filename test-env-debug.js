import fetch from 'node-fetch'

async function testEnvironmentDebugging() {
  console.log('🧪 Testing environment variable debugging in Netlify function...')
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/search-hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination: 'Tokyo, Japan',
        checkinDate: '2025-07-13',
        checkoutDate: '2025-07-19',
        guests: 1,
        rooms: 1
      })
    })

    const data = await response.json()
    
    console.log('✅ Function response received')
    console.log('📊 Provider:', data.provider)
    console.log('🏨 Hotels found:', data.hotels?.length || 0)
    
    if (data.provider?.includes('Mock Data')) {
      console.log('⚠️ Using mock data - this indicates RapidAPI key may not be working')
    } else {
      console.log('✅ Using real API data')
    }

    // The environment debugging logs will appear in the netlify dev console
    console.log('🔍 Check the netlify dev console for environment variable debugging output')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testEnvironmentDebugging() 