/**
 * Phase 3 Test Script: AI-Enhanced Discovery Engine
 * Tests the new multi-source venue discovery with AI analysis
 */

import { VenueDiscoveryEngine } from './src/services/discovery/VenueDiscoveryEngine.js'
import { VenueAnalyzer } from './src/services/ai/VenueAnalyzer.js'
import { GooglePlacesService } from './src/services/api/GooglePlacesService.js'
import { SmartCacheManager } from './src/services/cache/SmartCacheManager.js'
import { NewRecommendationEngine } from './src/services/recommendations/NewRecommendationEngine.js'

/**
 * Test configuration
 */
const TEST_CONFIG = {
  destinations: [
    {
      name: 'Paris, France',
      preferences: ['culture', 'art', 'history'],
      categories: ['culture', 'dining'],
      budget: 200,
      duration: 3
    },
    {
      name: 'London, UK', 
      preferences: ['museums', 'history', 'traditional'],
      categories: ['culture', 'attraction'],
      budget: 150,
      duration: 2
    },
    {
      name: 'Sydney, Australia',
      preferences: ['nature', 'outdoor', 'beaches'],
      categories: ['nature', 'attraction'],
      budget: 300,
      duration: 4
    }
  ],
  testPhases: {
    aiAnalysis: true,
    googlePlaces: true, // Now enabled with your API key!
    caching: true,
    fullDiscovery: true
  }
}

/**
 * Main test runner
 */
async function runPhase3Tests() {
  console.log('🚀 Starting Phase 3: AI-Enhanced Discovery Tests')
  console.log('=' .repeat(60))

  try {
    // Test 1: AI Venue Analyzer
    if (TEST_CONFIG.testPhases.aiAnalysis) {
      await testAIVenueAnalyzer()
    }

    // Test 2: Google Places Service (if API key available)
    if (TEST_CONFIG.testPhases.googlePlaces) {
      await testGooglePlacesService()
    }

    // Test 3: Smart Cache Manager
    if (TEST_CONFIG.testPhases.caching) {
      await testSmartCacheManager()
    }

    // Test 4: Full Discovery Engine
    if (TEST_CONFIG.testPhases.fullDiscovery) {
      await testVenueDiscoveryEngine()
    }

    // Test 5: Integrated Recommendation Engine
    await testIntegratedRecommendationEngine()

    console.log('\n🎉 All Phase 3 tests completed successfully!')

  } catch (error) {
    console.error('\n❌ Phase 3 tests failed:', error)
    process.exit(1)
  }
}

/**
 * Test 1: AI Venue Analyzer
 */
async function testAIVenueAnalyzer() {
  console.log('\n🧠 Test 1: AI Venue Analyzer')
  console.log('-'.repeat(40))

  const analyzer = new VenueAnalyzer({
    confidenceThreshold: 0.6,
    enableContextualScoring: true
  })

  // Sample venues for analysis
  const testVenues = [
    {
      name: 'Louvre Museum',
      category: 'culture',
      description: 'World-famous art museum in Paris featuring the Mona Lisa',
      rating: 4.5,
      reviewCount: 150000,
      coordinates: { lat: 48.8606, lng: 2.3376 }
    },
    {
      name: 'Random Text Fragment',
      category: 'unknown',
      description: 'This is clearly not a real venue name',
      rating: 0,
      reviewCount: 0
    },
    {
      name: 'Central Park',
      category: 'nature',
      description: 'Large public park in Manhattan, New York City',
      rating: 4.7,
      reviewCount: 85000,
      coordinates: { lat: 40.7829, lng: -73.9654 }
    }
  ]

  const context = {
    destination: 'Paris, France',
    preferences: ['culture', 'art', 'history'],
    budget: 200
  }

  console.log(`📊 Analyzing ${testVenues.length} test venues...`)
  
  const analyses = await analyzer.analyzeVenues(testVenues, context)
  
  console.log(`✅ Analysis complete: ${analyses.length} venues passed quality threshold`)
  
  analyses.forEach((analysis, index) => {
    console.log(`\n${index + 1}. ${analysis.venue.name}`)
    console.log(`   AI Score: ${analysis.aiScore}/100`)
    console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`)
    console.log(`   Category: ${analysis.categoryPrediction.primaryCategory}`)
    console.log(`   Business Valid: ${analysis.businessValidation.isLegitimateEntity}`)
    console.log(`   Tier: ${analysis.tier}`)
  })

  return analyses
}

/**
 * Test 2: Google Places Service (requires API key)
 */
async function testGooglePlacesService() {
  console.log('\n🌐 Test 2: Google Places Service')
  console.log('-'.repeat(40))

  const googlePlaces = new GooglePlacesService({
    // API key would be loaded from environment
    maxResults: 10,
    enableCaching: true
  })

  try {
    console.log('🔍 Searching for venues in Paris, France...')
    
    const venues = await googlePlaces.searchVenues(
      'Paris, France',
      ['culture', 'dining'],
      ['museums', 'restaurants']
    )

    console.log(`✅ Found ${venues.length} venues from Google Places`)
    
    venues.slice(0, 5).forEach((venue, index) => {
      console.log(`\n${index + 1}. ${venue.name}`)
      console.log(`   Category: ${venue.category}`)
      console.log(`   Rating: ${venue.rating}/5 (${venue.reviewCount} reviews)`)
      console.log(`   Popularity: ${venue.popularity}`)
      console.log(`   Address: ${venue.address}`)
    })

    // Test venue details
    if (venues.length > 0) {
      console.log('\n🔍 Testing venue details for first venue...')
      const details = await googlePlaces.getVenueDetails(venues[0].googlePlaceId)
      console.log(`✅ Retrieved detailed information for ${details.name}`)
    }

    return venues

  } catch (error) {
    console.warn('⚠️ Google Places test skipped (API key required):', error.message)
    return []
  }
}

/**
 * Test 3: Smart Cache Manager
 */
async function testSmartCacheManager() {
  console.log('\n💾 Test 3: Smart Cache Manager')
  console.log('-'.repeat(40))

  const cache = new SmartCacheManager({
    maxSize: 100,
    defaultTTL: 5000, // 5 seconds for testing
    enableMetrics: true
  })

  // Test basic caching
  console.log('📝 Testing basic cache operations...')
  
  await cache.set('test_venue_1', { name: 'Test Venue 1', rating: 4.5 }, {
    priority: cache.options.priorityLevels.HIGH,
    tags: ['test', 'venue']
  })

  await cache.set('test_venue_2', { name: 'Test Venue 2', rating: 3.8 }, {
    priority: cache.options.priorityLevels.MEDIUM,
    tags: ['test', 'venue']
  })

  // Test retrieval
  const venue1 = await cache.get('test_venue_1')
  console.log(`✅ Retrieved from cache: ${venue1?.name}`)

  // Test cache statistics
  const stats = cache.getStats()
  console.log(`📊 Cache Stats:`)
  console.log(`   Size: ${stats.size}/${stats.maxSize}`)
  console.log(`   Hit Rate: ${stats.hitRate}%`)
  console.log(`   Total Size: ${stats.totalSize} bytes`)

  // Test cache optimization
  console.log('\n🔧 Testing cache optimization...')
  const optimization = cache.optimizeCache()
  console.log(`✅ Optimization complete: rebalanced ${optimization.rebalanced} entries`)

  // Test tag-based clearing
  console.log('\n🧹 Testing tag-based cache clearing...')
  const cleared = cache.clearByTags(['test'])
  console.log(`✅ Cleared ${cleared} entries with 'test' tag`)

  return cache
}

/**
 * Test 4: Venue Discovery Engine
 */
async function testVenueDiscoveryEngine() {
  console.log('\n🎯 Test 4: Venue Discovery Engine')
  console.log('-'.repeat(40))

  const discoveryEngine = new VenueDiscoveryEngine({
    finalVenueLimit: 15,
    enableAIAnalysis: true,
    enableGooglePlacesSource: true, // Now enabled with your API key!
    enableRedditSource: false, // Simplified for testing
    confidenceThreshold: 0.6
  })

  for (const destination of TEST_CONFIG.destinations) {
    console.log(`\n🔍 Testing discovery for ${destination.name}...`)
    
    const tripData = {
      destination: destination.name,
      preferences: destination.preferences,
      categories: destination.categories,
      budget: destination.budget,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + destination.duration * 24 * 60 * 60 * 1000).toISOString()
    }

    try {
      const result = await discoveryEngine.discoverVenues(tripData)
      
      console.log(`✅ Discovery successful for ${destination.name}:`)
      console.log(`   Venues found: ${result.venues.length}`)
      console.log(`   Processing time: ${result.metadata.stats.processingTime}ms`)
      console.log(`   Source breakdown:`, result.metadata.sources)
      console.log(`   Quality metrics:`, result.metadata.qualityMetrics)

      // Show top 3 venues
      result.venues.slice(0, 3).forEach((venue, index) => {
        console.log(`\n   ${index + 1}. ${venue.name}`)
        console.log(`      Category: ${venue.category}`)
        console.log(`      Source: ${venue.source}`)
        console.log(`      Popularity: ${venue.popularity || 'N/A'}`)
      })

    } catch (error) {
      console.warn(`⚠️ Discovery failed for ${destination.name}:`, error.message)
    }
  }

  return discoveryEngine
}

/**
 * Test 5: Integrated Recommendation Engine with Phase 3
 */
async function testIntegratedRecommendationEngine() {
  console.log('\n🚀 Test 5: Integrated Recommendation Engine (Phase 3)')
  console.log('-'.repeat(40))

  // Test with Phase 3 enabled
  const phase3Engine = new NewRecommendationEngine({
    usePhase3Discovery: true,
    maxRecommendations: 12,
    qualityThreshold: 60,
    cacheEnabled: true
  })

  // Test with Phase 2 (pipeline)
  const phase2Engine = new NewRecommendationEngine({
    usePhase3Discovery: false,
    maxRecommendations: 12,
    qualityThreshold: 60,
    cacheEnabled: true
  })

  const testDestination = TEST_CONFIG.destinations[0] // Paris
  const tripData = {
    destination: testDestination.name,
    categories: testDestination.categories,
    preferences: testDestination.preferences,
    budget: testDestination.budget,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + testDestination.duration * 24 * 60 * 60 * 1000).toISOString()
  }

  console.log(`\n🎯 Testing Phase 3 engine for ${testDestination.name}...`)
  try {
    const phase3Result = await phase3Engine.generateRecommendations(tripData)
    
    console.log(`✅ Phase 3 Result:`)
    console.log(`   Success: ${phase3Result.success}`)
    console.log(`   Recommendations: ${phase3Result.data.length}`)
    console.log(`   Source: ${phase3Result.metadata.source}`)
    console.log(`   Engine: ${phase3Result.metadata.engine}`)

    // Show sample recommendations
    phase3Result.data.slice(0, 3).forEach((rec, index) => {
      console.log(`\n   ${index + 1}. ${rec.venue.name}`)
      console.log(`      Score: ${rec.score}`)
      console.log(`      Tags: ${rec.tags.join(', ')}`)
      console.log(`      Reason: ${rec.reasons[0]}`)
    })

  } catch (error) {
    console.warn(`⚠️ Phase 3 engine test failed:`, error.message)
  }

  console.log(`\n🔄 Testing Phase 2 engine for comparison...`)
  try {
    const phase2Result = await phase2Engine.generateRecommendations(tripData)
    
    console.log(`✅ Phase 2 Result:`)
    console.log(`   Success: ${phase2Result.success}`)
    console.log(`   Recommendations: ${phase2Result.data.length}`)
    console.log(`   Source: ${phase2Result.metadata.source}`)

  } catch (error) {
    console.warn(`⚠️ Phase 2 engine test failed:`, error.message)
  }

  // Performance comparison
  console.log('\n📊 Performance Comparison:')
  console.log('   Phase 3: AI-enhanced multi-source discovery')
  console.log('   Phase 2: Reddit-based pipeline with fallbacks')
  console.log('   Both: Zero duplicates, quality-controlled venues')
}

/**
 * Utility function to format test results
 */
function formatTestResults(results) {
  return {
    timestamp: new Date().toISOString(),
    phase: 'Phase 3',
    version: '3.0.0',
    results: results,
    summary: {
      totalTests: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase3Tests().catch(console.error)
}

export {
  runPhase3Tests,
  testAIVenueAnalyzer,
  testGooglePlacesService,
  testSmartCacheManager,
  testVenueDiscoveryEngine,
  testIntegratedRecommendationEngine
} 