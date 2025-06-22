#!/usr/bin/env node

/**
 * Final DeepSeek Integration Test
 * Tests the complete system with DeepSeek enhancement
 */

import dotenv from 'dotenv'
import smartGenerator from './src/services/itinerary/smartGenerator.js'

// Load environment variables
dotenv.config()

console.log('🎯 Final DeepSeek Integration Test')
console.log('==================================')

/**
 * Test direct enhancement
 */
async function testDirectEnhancement() {
  console.log('🧪 Test 1: Direct Enhancement')
  console.log('-----------------------------')
  
  try {
    const testVenues = [
      {
        name: 'Sagrada Familia',
        category: 'Architecture',
        description: 'Famous basilica designed by Antoni Gaudí'
      },
      {
        name: 'Park Güell',
        category: 'Park',
        description: 'Colorful park with mosaic art by Gaudí'
      }
    ]
    
    const tripContext = {
      destination: 'Barcelona, Spain',
      preferences: ['Architecture', 'Culture'],
      categories: ['attractions']
    }
    
    console.log(`🔧 DeepSeek Enhancement: ${smartGenerator.enableDeepSeekEnhancement ? 'ENABLED' : 'DISABLED'}`)
    console.log(`🔑 API Key: ${smartGenerator.deepSeekEnhancer.apiKey ? 'Found' : 'Missing'}`)
    
    const startTime = Date.now()
    const enhanced = await smartGenerator.deepSeekEnhancer.enhanceVenues(testVenues, tripContext)
    const processingTime = Date.now() - startTime
    
    console.log(`⏱️  Processing time: ${processingTime}ms`)
    console.log(`📊 Results: ${enhanced.length} venues processed`)
    
    let enhancedCount = 0
    enhanced.forEach((venue, index) => {
      const isEnhanced = venue.enhanced || venue.enhancedDescription
      console.log(`\n${index + 1}. ${venue.name}`)
      console.log(`   Enhanced: ${isEnhanced ? '✅ YES' : '❌ NO'}`)
      
      if (isEnhanced) {
        enhancedCount++
        if (venue.enhancedDescription) {
          console.log(`   Description: "${venue.enhancedDescription.substring(0, 100)}..."`)
        }
      }
    })
    
    console.log(`\n📈 Enhancement rate: ${Math.round((enhancedCount / enhanced.length) * 100)}%`)
    return enhancedCount > 0
    
  } catch (error) {
    console.error('❌ Direct enhancement test failed:', error.message)
    return false
  }
}

/**
 * Test complete itinerary generation
 */
async function testCompleteItinerary() {
  console.log('\n🔄 Test 2: Complete Itinerary Generation')
  console.log('----------------------------------------')
  
  try {
    const tripRequest = {
      destination: 'Barcelona',
      categories: ['culture', 'architecture'],
      budget: 200,
      startDate: '2024-07-01',
      endDate: '2024-07-03',
      travelers: 2
    }
    
    console.log('🎯 Trip Request:')
    console.log(`   Destination: ${tripRequest.destination}`)
    console.log(`   Categories: ${tripRequest.categories.join(', ')}`)
    console.log(`   Duration: ${tripRequest.startDate} to ${tripRequest.endDate}`)
    
    console.log('\n🚀 Generating complete itinerary...')
    const startTime = Date.now()
    
    const itinerary = await smartGenerator.generateSmartItinerary(tripRequest)
    
    const totalTime = Date.now() - startTime
    console.log(`⏱️  Total generation time: ${totalTime}ms`)
    
    if (!itinerary || !itinerary.days) {
      console.log('❌ No itinerary generated')
      return false
    }
    
    console.log(`📅 Generated ${itinerary.days.length} days`)
    
    // Check for enhanced activities
    let totalActivities = 0
    let enhancedActivities = 0
    
    itinerary.days.forEach((day, dayIndex) => {
      console.log(`\n📅 Day ${dayIndex + 1}:`)
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach((activity, actIndex) => {
          totalActivities++
          const isEnhanced = activity.enhanced || activity.enhancedDescription
          if (isEnhanced) enhancedActivities++
          
          console.log(`   ${actIndex + 1}. ${activity.name} ${isEnhanced ? '✨' : ''}`)
          if (activity.enhancedDescription) {
            console.log(`      Enhanced: "${activity.enhancedDescription.substring(0, 80)}..."`)
          }
        })
      } else {
        console.log('   No activities found')
      }
    })
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total activities: ${totalActivities}`)
    console.log(`   Enhanced activities: ${enhancedActivities}`)
    console.log(`   Enhancement rate: ${totalActivities > 0 ? Math.round((enhancedActivities / totalActivities) * 100) : 0}%`)
    
    return totalActivities > 0
    
  } catch (error) {
    console.error('❌ Complete itinerary test failed:', error.message)
    return false
  }
}

/**
 * Test DeepSeek metrics
 */
function testMetrics() {
  console.log('\n📊 Test 3: DeepSeek Metrics')
  console.log('---------------------------')
  
  try {
    const metrics = smartGenerator.getDeepSeekMetrics()
    
    console.log('📈 DeepSeek Performance Metrics:')
    console.log(`   Attempts: ${metrics.enhancementsAttempted}`)
    console.log(`   Successful: ${metrics.enhancementsSuccessful}`)
    console.log(`   Failed: ${metrics.enhancementsFailed}`)
    console.log(`   API Errors: ${metrics.apiErrors}`)
    console.log(`   Avg Processing Time: ${metrics.averageProcessingTime}ms`)
    
    const successRate = metrics.enhancementsAttempted > 0 
      ? Math.round((metrics.enhancementsSuccessful / metrics.enhancementsAttempted) * 100)
      : 0
    
    console.log(`   Success Rate: ${successRate}%`)
    
    return true
    
  } catch (error) {
    console.error('❌ Metrics test failed:', error.message)
    return false
  }
}

/**
 * Run all tests
 */
async function runFinalTests() {
  console.log('🚀 Starting Final DeepSeek Integration Tests...\n')
  
  const test1 = await testDirectEnhancement()
  const test2 = await testCompleteItinerary()
  const test3 = testMetrics()
  
  console.log('\n🏁 Final Test Results')
  console.log('=====================')
  console.log(`🧪 Direct Enhancement: ${test1 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`🔄 Complete Itinerary: ${test2 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`📊 Metrics Collection: ${test3 ? '✅ PASSED' : '❌ FAILED'}`)
  
  const allPassed = test1 && test2 && test3
  
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`)
  
  if (allPassed) {
    console.log('\n✨ DeepSeek Enhancement Successfully Enabled!')
    console.log('🚀 Travel+ now has AI-enhanced venue descriptions!')
    console.log('🎯 Ready for Phase 4: Full API Integration')
  } else {
    console.log('\n🔧 Some issues detected. Check the logs above for details.')
  }
  
  return allPassed
}

// Run the final tests
runFinalTests().catch(console.error) 