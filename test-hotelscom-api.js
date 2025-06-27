/**
 * Test Hotels.com API Integration
 * Tests the RapidAPI Hotels.com service
 */

import { HotelsComService } from './src/services/api/HotelsComService.js'
import { GooglePlacesService } from './src/services/api/GooglePlacesService.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Test credentials from your RapidAPI account
const RAPIDAPI_KEY = '3f16a75daamsh5cc5fad46175adbp1557e4jsnec45fe15ad92'

async function testHotelsComAPI() {
  console.log('🏨 Testing Hotels.com API Integration...')
  console.log(`📍 API Key: ${RAPIDAPI_KEY.substring(0, 8)}...`)
  
  try {
    const hotelscom = new HotelsComService({
      apiKey: RAPIDAPI_KEY
    })

    console.log('\n🔍 Testing location search for "New York"...')
    const locationId = await hotelscom.getLocationId('New York')
    console.log('📍 Location ID:', locationId)

    if (locationId) {
      console.log('\n🏨 Testing hotel search in New York...')
      const results = await hotelscom.searchHotels({
        destination: 'New York',
        checkInDate: '2025-07-10',
        checkOutDate: '2025-07-12',
        guests: 1,
        rooms: 1
      })

      console.log(`\n✅ Hotels.com API Results:`)
      console.log(`📊 Found ${results.hotels.length} hotels`)
      console.log(`🏢 Provider: ${results.meta.provider}`)
      
      if (results.hotels.length > 0) {
        console.log('\n🏨 Sample Hotels:')
        results.hotels.slice(0, 3).forEach((hotel, index) => {
          console.log(`\n${index + 1}. ${hotel.name}`)
          console.log(`   ⭐ Rating: ${hotel.rating}`)
          console.log(`   💰 Price: $${hotel.price.total} ${hotel.price.currency}`)
          console.log(`   📍 Location: ${hotel.location.address}`)
          console.log(`   🔗 Booking: ${hotel.bookingUrl}`)
        })
      }
    }

  } catch (error) {
    console.error('\n❌ Hotels.com API Test Failed:')
    console.error('Error:', error.message)
    console.error('Status:', error.status || 'Unknown')
  }
}

async function testHotelImageEnhancement() {
  console.log('🏨 Testing Hotels.com API Integration with Image Enhancement...')
  console.log('📍 API Key:', process.env.RAPIDAPI_KEY ? `${process.env.RAPIDAPI_KEY.substring(0, 8)}...` : 'MISSING')

  const hotelsComService = new HotelsComService()
  const googlePlacesService = new GooglePlacesService()

  try {
    // Test location search
    console.log('\n🔍 Testing location search for "New York"...')
    const locationId = await hotelsComService.getLocationId('New York')
    console.log('📍 Location ID:', locationId)

    // Test hotel search
    console.log('\n🏨 Testing hotel search in New York...')
    const results = await hotelsComService.searchHotels({
      destination: 'New York',
      checkInDate: '2025-07-10',
      checkOutDate: '2025-07-12',
      guests: 1,
      rooms: 1
    })

    console.log(`\n✅ Hotels.com API Results:`)
    console.log(`📊 Found ${results.hotels.length} hotels`)
    console.log(`🏢 Provider: ${results.meta.provider}`)

    if (results.hotels.length > 0) {
      console.log('\n🏨 Sample Hotels:')
      
      // Test image enhancement on first hotel
      const firstHotel = results.hotels[0]
      console.log(`\n📸 Testing image enhancement for: ${firstHotel.name}`)
      
      try {
        const enhancedHotel = await googlePlacesService.enhanceHotelWithImages(firstHotel)
        
        console.log(`\n✨ Enhanced Hotel: ${enhancedHotel.name}`)
        console.log(`📷 Images found: ${enhancedHotel.images.length}`)
        console.log(`🔍 Image source: ${enhancedHotel.imageSource || 'original'}`)
        
        if (enhancedHotel.images.length > 0) {
          console.log('\n🖼️ Hotel Images:')
          enhancedHotel.images.forEach((image, index) => {
            console.log(`   ${index + 1}. ${image}`)
          })
        }
        
      } catch (imageError) {
        console.log(`❌ Image enhancement failed: ${imageError.message}`)
      }

      // Display first 3 hotels with basic info
      results.hotels.slice(0, 3).forEach((hotel, index) => {
        console.log(`\n${index + 1}. ${hotel.name}`)
        console.log(`   ⭐ Rating: ${hotel.rating}`)
        console.log(`   💰 Price: $${hotel.price.total} ${hotel.price.currency}`)
        console.log(`   📍 Location: ${hotel.location.address}`)
        console.log(`   🔗 Booking: ${hotel.bookingUrl}`)
        console.log(`   📷 Images: ${hotel.images.length} available`)
      })
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testHotelsComAPI().catch(console.error)
testHotelImageEnhancement().catch(console.error) 