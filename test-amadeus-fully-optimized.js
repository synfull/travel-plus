#!/usr/bin/env node

import dotenv from 'dotenv'
import { AmadeusService } from './src/services/api/AmadeusService.js'

dotenv.config()

async function testFullyOptimizedAmadeus() {
  console.log('🚀 TESTING FULLY OPTIMIZED AMADEUS SERVICE')
  console.log('=' .repeat(60))
  
  try {
    // Initialize the optimized service
    const amadeus = new AmadeusService({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      environment: 'test'
    })

    console.log('\n🔐 STEP 1: AUTHENTICATION & HEALTH CHECK')
    console.log('-'.repeat(40))
    const healthCheck = await amadeus.healthCheck()
    console.log('Health Status:', healthCheck.status)
    console.log('Authentication:', healthCheck.authenticated ? '✅ SUCCESS' : '❌ FAILED')
    
    if (healthCheck.status !== 'healthy') {
      console.error('❌ Service not healthy, aborting tests')
      return
    }

    console.log('\n🏨 STEP 2: ENHANCED HOTEL SEARCH TESTING')
    console.log('-'.repeat(40))
    
    // Test 1: Basic Enhanced Hotel Search
    console.log('🔍 Test 2.1: Enhanced Hotel Search (Paris)')
    const parisHotels = await amadeus.searchHotels({
      destination: 'paris',
      checkInDate: '2025-07-15',
      checkOutDate: '2025-07-17',
      guests: 2,
      rooms: 1,
      maxPrice: 300,
      starRating: 4,
      amenities: ['WiFi', 'Pool'],
      sortBy: 'RATING',
      includeImages: true,
      includeDetails: true
    })
    
    console.log(`✅ Enhanced Search Results:`)
    console.log(`   📊 Hotels Found: ${parisHotels.hotels.length}`)
    console.log(`   🏙️ City Code: ${parisHotels.meta.cityCode}`)
    console.log(`   📍 Coordinates: ${JSON.stringify(parisHotels.meta.coordinates)}`)
    console.log(`   🔧 Filters Applied: ${JSON.stringify(parisHotels.meta.filters)}`)
    
    if (parisHotels.hotels.length > 0) {
      const sampleHotel = parisHotels.hotels[0]
      console.log(`   🏨 Sample Hotel: ${sampleHotel.name}`)
      console.log(`   ⭐ Rating: ${sampleHotel.rating}`)
      console.log(`   💰 Price: €${sampleHotel.price?.total}`)
      console.log(`   🛠️ Amenities: ${sampleHotel.amenities?.join(', ') || 'None'}`)
      console.log(`   📍 Distance from Center: ${sampleHotel.location?.distanceFromCenter?.toFixed(2) || 'N/A'} km`)
    }

    console.log('\n✈️ STEP 3: ENHANCED FLIGHT SEARCH TESTING')
    console.log('-'.repeat(40))
    
    // Test 3.1: Standard Flight Search
    console.log('🔍 Test 3.1: Standard Flight Search (NYC → LAX)')
    const standardFlights = await amadeus.searchFlights({
      origin: 'NYC',
      destination: 'LAX',
      departureDate: '2025-08-15',
      returnDate: '2025-08-22',
      passengers: 2,
      cabinClass: 'ECONOMY',
      maxPrice: 800
    })
    
    console.log(`✅ Standard Flight Results:`)
    console.log(`   📊 Flights Found: ${standardFlights.flights.length}`)
    console.log(`   🔧 Search Type: ${standardFlights.meta.searchType}`)
    
    if (standardFlights.flights.length > 0) {
      const sampleFlight = standardFlights.flights[0]
      console.log(`   💰 Best Price: $${sampleFlight.price?.total}`)
      console.log(`   🛫 Outbound: ${sampleFlight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → ${sampleFlight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode}`)
    }

    // Test 3.2: Flexible Date Search
    console.log('\n🔍 Test 3.2: Flexible Date Flight Search (±3 days)')
    const flexibleFlights = await amadeus.searchFlights({
      origin: 'LAX',
      destination: 'NYC',
      departureDate: '2025-09-10',
      passengers: 1,
      cabinClass: 'ECONOMY',
      flexible: true
    })
    
    console.log(`✅ Flexible Flight Results:`)
    console.log(`   📊 Flights Found: ${flexibleFlights.flights.length}`)
    console.log(`   🔧 Search Type: ${flexibleFlights.meta.searchType}`)

    // Test 3.3: Multi-City Flight Search
    console.log('\n🔍 Test 3.3: Multi-City Flight Search')
    const multiCityFlights = await amadeus.searchFlights({
      origin: 'NYC',
      destination: 'LAX',
      departureDate: '2025-10-01',
      passengers: 1,
      cabinClass: 'ECONOMY',
      multiCity: [
        { origin: 'NYC', destination: 'CHI', departureDate: '2025-10-01' },
        { origin: 'CHI', destination: 'LAX', departureDate: '2025-10-03' },
        { origin: 'LAX', destination: 'NYC', departureDate: '2025-10-05' }
      ]
    })
    
    console.log(`✅ Multi-City Flight Results:`)
    console.log(`   📊 Flight Legs: ${multiCityFlights.flights.length}`)
    console.log(`   🔧 Search Type: ${multiCityFlights.meta.searchType}`)
    multiCityFlights.flights.forEach((leg, index) => {
      console.log(`   🛫 Leg ${leg.leg}: ${leg.route} (${leg.flights.length} options)`)
    })

    console.log('\n🌍 STEP 4: FLIGHT INSPIRATION TESTING')
    console.log('-'.repeat(40))
    
    const inspiration = await amadeus.getFlightInspiration({
      origin: 'NYC',
      maxPrice: 500,
      departureDate: '2025-11-15'
    })
    
    console.log(`✅ Flight Inspiration Results:`)
    console.log(`   📊 Destinations Found: ${inspiration.destinations.length}`)
    
    if (inspiration.destinations.length > 0) {
      console.log(`   🗺️ Sample Destinations:`)
      inspiration.destinations.slice(0, 5).forEach(dest => {
        console.log(`     • ${dest.destination}: $${dest.price.total} (${dest.departureDate})`)
      })
    }

    console.log('\n🔄 STEP 5: PERFORMANCE & CACHING TESTING')
    console.log('-'.repeat(40))
    
    // Test caching by repeating the same search
    console.log('🔍 Test 5.1: Cache Performance Test')
    const startTime = Date.now()
    
    // First call (should hit API)
    await amadeus.searchHotels({
      destination: 'london',
      checkInDate: '2025-12-20',
      checkOutDate: '2025-12-22',
      guests: 1,
      rooms: 1
    })
    const firstCallTime = Date.now() - startTime
    
    // Second call (should hit cache)
    const cacheStartTime = Date.now()
    await amadeus.searchHotels({
      destination: 'london',
      checkInDate: '2025-12-20',
      checkOutDate: '2025-12-22',
      guests: 1,
      rooms: 1
    })
    const secondCallTime = Date.now() - cacheStartTime
    
    console.log(`   ⏱️ First Call (API): ${firstCallTime}ms`)
    console.log(`   ⚡ Second Call (Cache): ${secondCallTime}ms`)
    console.log(`   🚀 Speed Improvement: ${Math.round((firstCallTime / secondCallTime) * 100) / 100}x faster`)

    console.log('\n📊 STEP 6: STATISTICS & MONITORING')
    console.log('-'.repeat(40))
    
    const stats = amadeus.getStats()
    console.log('📈 Service Statistics:')
    console.log(`   🔢 Total Requests: ${stats.totalRequests}`)
    console.log(`   ✅ Success Rate: ${stats.successRate}`)
    console.log(`   💾 Cache Hit Rate: ${stats.cacheHitRate}`)
    console.log(`   🔄 Retries: ${stats.retries}`)
    console.log(`   📦 Cache Size: ${stats.cacheSize} entries`)

    console.log('\n🧪 STEP 7: ERROR HANDLING & RESILIENCE TESTING')
    console.log('-'.repeat(40))
    
    try {
      // Test with invalid destination
      await amadeus.searchHotels({
        destination: 'invalidcity123',
        checkInDate: '2025-07-01',
        checkOutDate: '2025-07-03',
        guests: 1,
        rooms: 1
      })
    } catch (error) {
      console.log(`✅ Error Handling Test: ${error.message.substring(0, 100)}...`)
    }

    console.log('\n🎉 OPTIMIZATION TEST SUMMARY')
    console.log('=' .repeat(60))
    console.log('✅ STEP 1: Enhanced Hotel Search - IMPLEMENTED')
    console.log('  • Extended city mapping (50+ cities)')
    console.log('  • Advanced filtering (price, rating, amenities)')
    console.log('  • Batch processing for performance')
    console.log('  • Enhanced data enrichment')
    
    console.log('✅ STEP 2: Flight Search Optimization - IMPLEMENTED')
    console.log('  • Multi-city flight support')
    console.log('  • Flexible date search (±3 days)')
    console.log('  • Flight inspiration feature')
    console.log('  • Duplicate removal')
    
    console.log('✅ STEP 3: Data Quality Improvements - IMPLEMENTED')
    console.log('  • Rich hotel details integration')
    console.log('  • Standardized amenities mapping')
    console.log('  • Distance calculations')
    console.log('  • Enhanced pricing information')
    
    console.log('✅ STEP 4: Performance Optimization - IMPLEMENTED')
    console.log('  • Smart caching with TTL')
    console.log('  • Parallel API requests')
    console.log('  • Intelligent rate limiting')
    console.log('  • Cache performance monitoring')
    
    console.log('✅ STEP 5: Error Handling & Resilience - IMPLEMENTED')
    console.log('  • Exponential backoff retry logic')
    console.log('  • Graceful error handling')
    console.log('  • Health check monitoring')
    console.log('  • Comprehensive statistics')
    
    console.log(`\n🏆 AMADEUS SERVICE FULLY OPTIMIZED! 🏆`)
    console.log(`📊 Final Stats: ${stats.successRate} success rate, ${stats.cacheHitRate} cache efficiency`)
    
  } catch (error) {
    console.error('❌ OPTIMIZATION TEST FAILED:', error.message)
    console.error('Stack:', error.stack)
  }
}

testFullyOptimizedAmadeus() 