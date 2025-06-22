#!/usr/bin/env node

/**
 * Simple DeepSeek API Test
 * Tests basic API functionality and key detection
 */

import dotenv from 'dotenv'
import fetch from 'node-fetch'

// Load environment variables
dotenv.config()

const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY
const BASE_URL = 'https://api.deepseek.com/v1/chat/completions'

console.log('🔧 Simple DeepSeek API Test')
console.log('===========================')
console.log(`🔑 API Key: ${API_KEY ? 'Found' : 'Missing'}`)
console.log(`🌐 Base URL: ${BASE_URL}`)
console.log('')

/**
 * Test simple venue enhancement
 */
async function testVenueEnhancement() {
  if (!API_KEY) {
    console.log('❌ No API key found. Please check your .env file.')
    return false
  }

  try {
    console.log('🤖 Testing venue enhancement...')
    
    const testVenues = [
      { name: 'Sagrada Familia', category: 'Architecture' },
      { name: 'Park Güell', category: 'Park' }
    ]
    
    const prompt = `Enhance these Barcelona venue descriptions with engaging details:

${testVenues.map(v => `- ${v.name}: ${v.category}`).join('\n')}

Please respond with JSON:
{
  "enhancements": [
    {
      "name": "exact venue name",
      "description": "engaging 2-3 sentence description",
      "highlights": ["key feature 1", "key feature 2"]
    }
  ]
}`

    const startTime = Date.now()
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a travel expert. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })
    
    const responseTime = Date.now() - startTime
    console.log(`⏱️  Response time: ${responseTime}ms`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ API Error: ${response.status} ${response.statusText}`)
      console.log(`   Details: ${errorText}`)
      return false
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      console.log('❌ No content received from API')
      return false
    }
    
    console.log('✅ API Response received!')
    console.log('📝 Enhanced content:')
    console.log(content)
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(content)
      console.log('\n🎯 Parsed enhancements:')
      parsed.enhancements?.forEach((enhancement, index) => {
        console.log(`   ${index + 1}. ${enhancement.name}`)
        console.log(`      Description: "${enhancement.description}"`)
        if (enhancement.highlights) {
          console.log(`      Highlights: ${enhancement.highlights.join(', ')}`)
        }
      })
      return true
    } catch (parseError) {
      console.log('⚠️  Response is not valid JSON, but API is working')
      return true
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`)
    return false
  }
}

/**
 * Test with DeepSeekEnhancer class
 */
async function testEnhancerClass() {
  console.log('\n🧪 Testing DeepSeekEnhancer Class')
  console.log('=================================')
  
  try {
    // Import and test the enhancer
    const { DeepSeekEnhancer } = await import('./src/services/ai/DeepSeekEnhancer.js')
    
    const enhancer = new DeepSeekEnhancer({
      enabled: true,
      enhancementMode: 'descriptions_only',
      timeoutMs: 30000
    })
    
    console.log(`🔑 Enhancer API Key: ${enhancer.apiKey ? 'Found' : 'Missing'}`)
    
    if (!enhancer.apiKey) {
      console.log('❌ DeepSeekEnhancer cannot find API key')
      return false
    }
    
    const testVenues = [
      {
        name: 'Sagrada Familia',
        category: 'Architecture',
        description: 'Famous basilica'
      }
    ]
    
    const tripContext = {
      destination: 'Barcelona, Spain',
      preferences: ['Architecture'],
      categories: ['attractions']
    }
    
    console.log('🚀 Testing venue enhancement...')
    const enhanced = await enhancer.enhanceVenues(testVenues, tripContext)
    
    console.log(`📊 Results: ${enhanced.length} venues processed`)
    
    if (enhanced[0].enhanced || enhanced[0].enhancedDescription) {
      console.log('✅ Enhancement successful!')
      console.log(`   Enhanced: "${enhanced[0].enhancedDescription || 'No description'}"`)
    } else {
      console.log('⚠️  No enhancement applied (but no errors)')
    }
    
    return true
    
  } catch (error) {
    console.log(`❌ DeepSeekEnhancer test failed: ${error.message}`)
    return false
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Simple DeepSeek Tests...\n')
  
  const test1 = await testVenueEnhancement()
  const test2 = await testEnhancerClass()
  
  console.log('\n🏁 Test Results')
  console.log('===============')
  console.log(`🔧 Direct API Test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`🧪 Enhancer Class Test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! DeepSeek is ready to use!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.')
  }
}

// Run tests
runTests().catch(console.error) 