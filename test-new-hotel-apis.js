#!/usr/bin/env node

/**
 * Test script for new hotel APIs
 * Tests both Expedia Rapid and Google Hotels Scraper
 */

import dotenv from 'dotenv'
import { ExpediaRapidService } from './src/services/api/ExpediaRapidService.js'
import { GoogleHotelsScraperService } from './src/services/api/GoogleHotelsScraperService.js'

// Load environment variables
dotenv.config()

console.log('🧪 Testing New Hotel APIs')
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

// Environment check
console.log('🔧 Environment Check:')
console.log('✅ EXPEDIA_API_KEY:', process.env.EXPEDIA_API_KEY ? 'Configured' : '❌ Missing')
console.log('✅ EXPEDIA_API_SECRET:', process.env.EXPEDIA_API_SECRET ? 'Configured' : '❌ Missing')
console.log('✅ Playwright Available:', 'Should be installed')
console.log()

async function testExpediaRapid() {
  console.log('🏨 Testing Expedia Rapid API (Priority 1)')
  console.log('-'.repeat(40))
  
  try {
    const expediaService = new ExpediaRapidService()
    
    console.log('⏳ Searching hotels via Expedia Rapid...')
    const startTime = Date.now()
    
    const results = await expediaService.searchHotels(testSearchData)
    
    const duration = Date.now() - startTime
    console.log(`⏱️  Request completed in ${duration}ms`)
    
    if (results && results.hotels && results.hotels.length > 0) {
      console.log('✅ Expedia Rapid Success!')
      console.log(`📊 Found ${results.hotels.length} hotels`)
      console.log('🏨 Sample hotel:', JSON.stringify(results.hotels[0], null, 2).substring(0, 500) + '...')
      console.log('📋 Provider:', results.meta?.provider || 'Expedia Rapid')
      return { success: true, count: results.hotels.length, duration }
    } else {
      console.log('❌ No hotels found in Expedia response')
      return { success: false, error: 'No hotels found', duration }
    }
    
  } catch (error) {
    console.log('❌ Expedia Rapid failed:', error.message)
    console.log('🔍 Full error:', error.name, error.status)
    return { success: false, error: error.message }
  }
}

async function testGoogleHotelsScraper() {
  console.log('🌐 Testing Google Hotels Scraper (Priority 2)')
  console.log('-'.repeat(40))
  
  try {
    const googleService = new GoogleHotelsScraperService({ maxResults: 5 })
    
    console.log('⏳ Scraping Google Hotels...')
    const startTime = Date.now()
    
    const results = await googleService.searchHotels(testSearchData)
    
    const duration = Date.now() - startTime
    console.log(`⏱️  Scraping completed in ${duration}ms`)
    
    if (results && results.hotels && results.hotels.length > 0) {
      console.log('✅ Google Hotels Scraper Success!')
      console.log(`📊 Found ${results.hotels.length} hotels`)
      console.log('🏨 Sample hotel:', JSON.stringify(results.hotels[0], null, 2).substring(0, 500) + '...')
      console.log('📋 Provider:', results.meta?.provider || 'Google Hotels Scraper')
      return { success: true, count: results.hotels.length, duration }
    } else {
      console.log('❌ No hotels found in Google scraper response')
      return { success: false, error: 'No hotels found', duration }
    }
    
  } catch (error) {
    console.log('❌ Google Hotels Scraper failed:', error.message)
    console.log('🔍 Full error:', error.name, error.stack?.substring(0, 200))
    return { success: false, error: error.message }
  }
}

async function testNetlifyFunction() {
  console.log('🔧 Testing Netlify Hotel Search Function')
  console.log('-'.repeat(40))
  
  try {
    console.log('⏳ Testing hotel search endpoint...')
    
    const response = await fetch('http://localhost:8888/.netlify/functions/search-hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination: testSearchData.destination,
        checkinDate: testSearchData.checkInDate,
        checkoutDate: testSearchData.checkOutDate,
        guests: testSearchData.guests,
        rooms: testSearchData.rooms,
        maxPrice: testSearchData.maxPrice
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log('✅ Netlify Function Success!')
    console.log(`📊 Source: ${data.source}`)
    console.log(`📊 Found ${data.count} hotels`)
    console.log('🏨 Sample hotel:', JSON.stringify(data.hotels[0], null, 2).substring(0, 300) + '...')
    
    return { success: true, source: data.source, count: data.count }
    
  } catch (error) {
    console.log('❌ Netlify Function failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Hotel API Tests')
  console.log('=' + '='.repeat(50))
  console.log()
  
  const results = {}
  
  // Test 1: Expedia Rapid
  results.expedia = await testExpediaRapid()
  console.log()
  
  // Test 2: Google Hotels Scraper  
  results.google = await testGoogleHotelsScraper()
  console.log()
  
  // Test 3: Netlify Function Integration
  results.netlify = await testNetlifyFunction()
  console.log()
  
  // Summary
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('=' + '='.repeat(50))
  console.log(`🏨 Expedia Rapid: ${results.expedia.success ? '✅ PASS' : '❌ FAIL'} ${results.expedia.success ? `(${results.expedia.count} hotels)` : `(${results.expedia.error})`}`)
  console.log(`🌐 Google Scraper: ${results.google.success ? '✅ PASS' : '❌ FAIL'} ${results.google.success ? `(${results.google.count} hotels)` : `(${results.google.error})`}`)
  console.log(`🔧 Netlify Function: ${results.netlify.success ? '✅ PASS' : '❌ FAIL'} ${results.netlify.success ? `(${results.netlify.source})` : `(${results.netlify.error})`}`)
  
  const successCount = Object.values(results).filter(r => r.success).length
  console.log()
  console.log(`🎯 Overall: ${successCount}/3 tests passed`)
  
  if (successCount === 0) {
    console.log('⚠️  All hotel APIs failed. App will use fallback mock data.')
  } else if (successCount < 3) {
    console.log('⚠️  Some APIs failed, but fallback systems will work.')
  } else {
    console.log('🎉 All hotel APIs working perfectly!')
  }
}

// Start tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error)
  process.exit(1)
}) 