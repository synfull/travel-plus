import NewRecommendationEngine from './src/services/recommendations/NewRecommendationEngine.js'

/**
 * Test script for the new recommendation engine
 */
async function testNewEngine() {
  console.log('🧪 Testing New Recommendation Engine - Phase 3 Discovery')
  console.log('=' .repeat(50))

  // Create engine instance with Phase 3 enabled
  const engine = new NewRecommendationEngine({
    qualityThreshold: 40,
    maxRecommendations: 20,
    enableRedditProcessing: false, // Disable for testing to avoid API calls
    enableEnrichment: false, // Disable for testing
    cacheEnabled: true,
    fallbackEnabled: true,
    usePhase3Discovery: true // Enable Phase 3 AI-enhanced discovery
  })

  // Test data
  const testTripData = {
    destination: 'Barcelona, Spain',
    categories: ['culture', 'dining'],
    startDate: '2025-07-10',
    endDate: '2025-07-12',
    people: 2,
    budget: 500
  }

  try {
    console.log(`🎯 Testing with destination: ${testTripData.destination}`)
    console.log(`📅 Trip dates: ${testTripData.startDate} to ${testTripData.endDate}`)
    console.log(`👥 People: ${testTripData.people}`)
    console.log(`💰 Budget: $${testTripData.budget}`)
    console.log()

    // Generate recommendations
    const startTime = Date.now()
    const result = await engine.generateRecommendations(testTripData)
    const endTime = Date.now()

    console.log(`⏱️ Generation completed in ${endTime - startTime}ms`)
    console.log()

    if (result.success) {
      console.log('✅ Recommendation generation successful!')
      console.log(`📊 Generated ${result.data.length} recommendations`)
      console.log(`🎯 Source: ${result.metadata.source || 'pipeline'}`)
      
      if (result.metadata.fallbackLevel) {
        console.log(`🔄 Fallback level: ${result.metadata.fallbackLevel}`)
        console.log(`📋 Fallback source: ${result.metadata.fallbackSource}`)
      }

      console.log()
      console.log('📝 Sample Recommendations:')
      console.log('-'.repeat(40))
      
      result.data.slice(0, 5).forEach((rec, index) => {
        const venue = rec.venue || rec
        console.log(`${index + 1}. ${venue.name}`)
        console.log(`   Category: ${venue.category}`)
        console.log(`   Quality Score: ${venue.confidenceScore?.toFixed(1) || 'N/A'}`)
        console.log(`   Description: ${venue.description?.substring(0, 80)}...`)
        console.log(`   Reasons: ${rec.reasons?.join(', ') || 'N/A'}`)
        console.log()
      })

      // Test metrics
      const metrics = engine.getMetrics()
      console.log('📈 Pipeline Metrics:')
      console.log('-'.repeat(40))
      console.log(`Overall Success Rate: ${metrics.overall.successRate?.toFixed(1)}%`)
      console.log(`Total Runs: ${metrics.overall.totalRuns}`)
      console.log(`Average Processing Time: ${metrics.overall.averageProcessingTime?.toFixed(0)}ms`)
      console.log()

      if (metrics.stages) {
        console.log('🔧 Stage Performance:')
        Object.entries(metrics.stages).forEach(([stageName, stageMetrics]) => {
          console.log(`  ${stageName}: ${stageMetrics.successRate?.toFixed(1)}% success rate`)
        })
      }

    } else {
      console.log('❌ Recommendation generation failed!')
      console.log(`Error: ${result.error}`)
      console.log(`Failed at: ${result.metadata?.failedAt}`)
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }

  console.log()
  console.log('🧪 Test completed!')
}

// Run the test
testNewEngine().catch(console.error) 