#!/usr/bin/env node

/**
 * Test DeepSeek Enhancement with Real Venues
 * Verifies the enhancement system works end-to-end
 */

import dotenv from 'dotenv'
import smartGenerator from './src/services/itinerary/smartGenerator.js'

// Load environment variables
dotenv.config()

console.log('🧪 Testing DeepSeek Enhancement System')
console.log('=====================================')

/**
 * Test the complete enhancement pipeline
 */
async function testDeepSeekEnhancement() {
  try {
    // Use the smart generator instance
    const generator = smartGenerator
    
    // Verify enhancement is enabled
    console.log(`🔧 DeepSeek Enhancement: ${generator.enableDeepSeekEnhancement ? 'ENABLED' : 'DISABLED'}`)
    console.log(`🎯 Enhancement Mode: ${generator.deepSeekEnhancementMode}`)
    console.log('')
    
    // Test with sample Barcelona venues (from our previous Google Places success)
    const testVenues = [
      {
        name: 'Sagrada Familia',
        category: 'Architecture',
        description: 'Famous basilica designed by Antoni Gaudí',
        rating: 4.6,
        location: { lat: 41.4036, lng: 2.1744 }
      },
      {
        name: 'Park Güell',
        category: 'Park',
        description: 'Colorful park with mosaic art by Gaudí',
        rating: 4.4,
        location: { lat: 41.4145, lng: 2.1527 }
      },
      {
        name: 'Casa Batlló',
        category: 'Architecture',
        description: 'Modernist building by Antoni Gaudí',
        rating: 4.5,
        location: { lat: 41.3916, lng: 2.1649 }
      }
    ]
    
    const tripContext = {
      destination: 'Barcelona, Spain',
      preferences: ['Architecture', 'Culture', 'Art'],
      categories: ['attractions', 'cultural'],
      duration: '3 days'
    }
    
    console.log('📍 Test Venues:')
    testVenues.forEach((venue, index) => {
      console.log(`   ${index + 1}. ${venue.name} (${venue.category})`)
    })
    console.log('')
    
    // Test the DeepSeek enhancer directly
    console.log('🤖 Testing DeepSeek Enhancement...')
    const startTime = Date.now()
    
    const enhancedVenues = await generator.deepSeekEnhancer.enhanceVenues(testVenues, tripContext)
    
    const processingTime = Date.now() - startTime
    console.log(`⏱️  Processing time: ${processingTime}ms`)
    console.log('')
    
    // Verify results
    console.log('📊 Enhancement Results:')
    console.log('======================')
    
    if (enhancedVenues.length !== testVenues.length) {
      console.log(`❌ Venue count mismatch: ${testVenues.length} → ${enhancedVenues.length}`)
      return false
    }
    
    let enhancementCount = 0
    enhancedVenues.forEach((venue, index) => {
      const original = testVenues[index]
      const isEnhanced = venue.enhanced || venue.enhancedDescription
      
      console.log(`\n${index + 1}. ${venue.name}`)
      console.log(`   Enhanced: ${isEnhanced ? '✅ YES' : '❌ NO'}`)
      
      if (isEnhanced) {
        enhancementCount++
        if (venue.enhancedDescription) {
          console.log(`   Description: "${venue.enhancedDescription}"`)
        }
        if (venue.highlights && venue.highlights.length > 0) {
          console.log(`   Highlights: ${venue.highlights.join(', ')}`)
        }
        if (venue.bestTime) {
          console.log(`   Best Time: ${venue.bestTime}`)
        }
      }
    })
    
    console.log(`\n📈 Enhancement Summary:`)
    console.log(`   Total venues: ${enhancedVenues.length}`)
    console.log(`   Enhanced: ${enhancementCount}`)
    console.log(`   Success rate: ${Math.round((enhancementCount / enhancedVenues.length) * 100)}%`)
    
    // Get metrics
    const metrics = generator.deepSeekEnhancer.getMetrics()
    console.log(`\n📊 DeepSeek Metrics:`)
    console.log(`   Attempts: ${metrics.enhancementsAttempted}`)
    console.log(`   Successful: ${metrics.enhancementsSuccessful}`)
    console.log(`   Failed: ${metrics.enhancementsFailed}`)
    console.log(`   API Errors: ${metrics.apiErrors}`)
    console.log(`   Avg Processing: ${metrics.averageProcessingTime}ms`)
    
    return enhancementCount > 0
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

/**
 * Test the full itinerary generation with enhancement
 */
async function testFullItineraryGeneration() {
  console.log('\n🔄 Testing Full Itinerary Generation')
  console.log('====================================')
  
  try {
    const generator = smartGenerator
    
    const tripRequest = {
      destination: 'Barcelona',
      preferences: ['architecture', 'culture'],
      budget: 200,
      duration: 2,
      travelers: 2
    }
    
    console.log('🎯 Trip Request:', JSON.stringify(tripRequest, null, 2))
    console.log('\n🚀 Generating itinerary with DeepSeek enhancement...')
    
    const startTime = Date.now()
    const itinerary = await generator.generateSmartItinerary(tripRequest)
    const recommendations = itinerary.days.flatMap(day => day.activities || [])
    const totalTime = Date.now() - startTime
    
    console.log(`⏱️  Total generation time: ${totalTime}ms`)
    console.log(`📊 Generated ${recommendations.length} recommendations`)
    
    // Check for enhanced content
    let enhancedCount = 0
    recommendations.forEach(rec => {
      if (rec.enhanced || rec.enhancedDescription) {
        enhancedCount++
      }
    })
    
    console.log(`✨ Enhanced recommendations: ${enhancedCount}/${recommendations.length}`)
    
    // Show sample enhanced recommendation
    const enhanced = recommendations.find(r => r.enhanced || r.enhancedDescription)
    if (enhanced) {
      console.log('\n🌟 Sample Enhanced Recommendation:')
      console.log(`   Name: ${enhanced.name}`)
      console.log(`   Category: ${enhanced.category}`)
      if (enhanced.enhancedDescription) {
        console.log(`   Enhanced: "${enhanced.enhancedDescription}"`)
      }
      if (enhanced.highlights) {
        console.log(`   Highlights: ${enhanced.highlights.join(', ')}`)
      }
    }
    
    return enhancedCount > 0
    
  } catch (error) {
    console.error('❌ Full generation test failed:', error.message)
    return false
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting DeepSeek Enhancement Tests...\n')
  
  const test1 = await testDeepSeekEnhancement()
  const test2 = await testFullItineraryGeneration()
  
  console.log('\n🏁 Test Results Summary')
  console.log('=======================')
  console.log(`🧪 Direct Enhancement Test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`🔄 Full Generation Test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! DeepSeek enhancement is working!')
    console.log('✨ Travel+ now has AI-enhanced venue descriptions!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.')
  }
}

// Run the tests
runTests().catch(console.error) 