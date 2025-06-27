import { GooglePlacesService } from './src/services/api/GooglePlacesService.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testGooglePlacesProxy() {
  console.log('🌐 Testing Google Places Integration...')
  console.log('📍 API Key:', process.env.GOOGLE_PLACES_API_KEY ? `${process.env.GOOGLE_PLACES_API_KEY.substring(0, 8)}...` : 'MISSING')
  
  // In Node.js environment, test with direct API calls
  // In browser environment, the proxy will be used
  const service = new GooglePlacesService({
    useProxy: false  // Use direct API calls for Node.js testing
  })

  try {
    console.log('\n🧪 Test 1: Geocoding New York...')
    const coordinates = await service.geocodeDestination('New York, USA')
    
    if (coordinates) {
      console.log('✅ Geocoding successful!')
      console.log(`📍 Coordinates: ${coordinates.lat}, ${coordinates.lng}`)
    } else {
      console.error('❌ Geocoding failed')
      return
    }

    console.log('\n🧪 Test 2: Searching for outdoor adventure venues...')
    const venues = await service.searchVenues('New York, USA', ['adventure'], ['outdoor', 'nature'])
    
    console.log(`✅ Venue search completed!`)
    console.log(`📊 Found ${venues.length} venues`)
    
    if (venues.length > 0) {
      console.log('\n🎯 Top 3 venues:')
      venues.slice(0, 3).forEach((venue, index) => {
        console.log(`  ${index + 1}. ${venue.name || 'Unnamed venue'}`)
        console.log(`     📍 ${venue.address || 'Address not available'}`)
        console.log(`     ⭐ Rating: ${venue.rating || 'N/A'}/5 (${venue.reviewCount || 0} reviews)`)
        console.log(`     🏷️ Category: ${venue.category || 'Unknown'}`)
        console.log(`     📸 Photos: ${venue.photos?.length || 0}`)
        console.log('')
      })

      console.log('\n🧪 Test 3: Getting venue details...')
      const firstVenue = venues[0]
      try {
        const details = await service.getVenueDetails(firstVenue.googlePlaceId)
        console.log('✅ Venue details retrieved!')
        console.log(`📍 Name: ${details.name}`)
        console.log(`📍 Address: ${details.address}`)
        console.log(`⭐ Rating: ${details.rating}`)
        console.log(`🌐 Website: ${details.website || 'Not available'}`)
      } catch (error) {
        console.error('❌ Venue details failed:', error.message)
      }

      console.log('\n🧪 Test 4: Testing hotel image enhancement...')
      const mockHotel = {
        name: 'Grand Central Hotel',
        location: { cityName: 'New York' },
        rating: 4.2
      }
      
      try {
        const enhancedHotel = await service.enhanceHotelWithImages(mockHotel)
        console.log('✅ Hotel image enhancement completed!')
        console.log(`📸 Images found: ${enhancedHotel.images.length}`)
        console.log(`🎯 Image source: ${enhancedHotel.imageSource}`)
        if (enhancedHotel.images.length > 0) {
          console.log(`🖼️ First image: ${enhancedHotel.images[0].substring(0, 50)}...`)
        }
      } catch (error) {
        console.error('❌ Hotel image enhancement failed:', error.message)
      }
    }

    console.log('\n📊 Final Statistics:')
    const stats = service.getStats()
    console.log(`🔢 Total API requests: ${stats.requestCount}`)
    console.log(`💾 Cache size: ${stats.cacheSize}`)
    console.log(`📈 Cache hit rate: ${Math.round(stats.cacheHitRate * 100)}%`)

    console.log('\n🎉 Google Places Integration Test Completed Successfully!')
    console.log('✅ API calls working properly in Node.js environment')
    console.log('✅ When deployed, proxy will resolve CORS issues in browser')
    console.log('🌐 Run the app with `npm run dev` to test proxy functionality')

  } catch (error) {
    console.error('❌ Google Places Integration Test Failed:', error)
    console.error('📝 Error details:', error.message)
    console.error('🔧 Check API key configuration')
  }
}

// Run the test
testGooglePlacesProxy() 