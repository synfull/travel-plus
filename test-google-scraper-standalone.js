#!/usr/bin/env node

/**
 * Standalone test for Google Hotels Scraper
 * This runs independently from Netlify functions
 */

import dotenv from 'dotenv'
import { GoogleHotelsScraperService } from './src/services/api/GoogleHotelsScraperService.js'

// Load environment variables
dotenv.config()

console.log('🌐 Testing Google Hotels Scraper (Standalone)')
console.log('=' + '='.repeat(50))

// Test data
const testSearchData = {
  destination: 'Tokyo',
  checkInDate: '2025-07-10',
  checkOutDate: '2025-07-12',
  guests: 2,
  rooms: 1,
  maxPrice: 300
}

console.log('🔍 Search Parameters:', testSearchData)
console.log()

async function testGoogleHotelsScraper() {
  try {
    console.log('⏳ Initializing Google Hotels Scraper...')
    const googleService = new GoogleHotelsScraperService({ maxResults: 5 })
    
    console.log('⏳ Starting hotel scraping...')
    const startTime = Date.now()
    
    const results = await googleService.searchHotels(testSearchData)
    
    const duration = Date.now() - startTime
    console.log(`⏱️  Scraping completed in ${duration}ms`)
    
    if (results && results.hotels && results.hotels.length > 0) {
      console.log('✅ Google Hotels Scraper Success!')
      console.log(`📊 Found ${results.hotels.length} hotels`)
      
      // Show first hotel details
      console.log('\n🏨 Sample Hotel:')
      console.log(JSON.stringify(results.hotels[0], null, 2))
      
      // Show all hotel names
      console.log('\n📋 All Hotels Found:')
      results.hotels.forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name} - $${hotel.pricePerNight}/night - ${hotel.rating}★`)
      })
      
      console.log('\n📋 Provider:', results.meta?.provider || 'Google Hotels Scraper')
      return true
    } else {
      console.log('❌ No hotels found in Google scraper response')
      return false
    }
    
  } catch (error) {
    console.log('❌ Google Hotels Scraper failed:', error.message)
    console.log('🔍 Error details:', error.name)
    if (error.stack) {
      console.log('🔍 Stack trace:', error.stack.substring(0, 500) + '...')
    }
    return false
  }
}

// Run the test
console.log('🚀 Starting Google Hotels Scraper Test')
console.log('-'.repeat(50))

testGoogleHotelsScraper().then(success => {
  console.log('\n📊 TEST RESULT:')
  console.log('=' + '='.repeat(30))
  if (success) {
    console.log('🎉 Google Hotels Scraper is working!')
    console.log('✅ Real hotel data extracted successfully')
  } else {
    console.log('❌ Google Hotels Scraper test failed')
    console.log('⚠️  This is normal - Google Hotels has anti-bot protection')
    console.log('💡 The Expedia API should provide hotel data instead')
  }
}).catch(error => {
  console.error('💥 Test failed with error:', error.message)
}) 