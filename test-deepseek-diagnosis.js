#!/usr/bin/env node

/**
 * DeepSeek API Diagnostic Test
 * Identifies and fixes timeout/connection issues
 */

import dotenv from 'dotenv'
import fetch from 'node-fetch'

// Load environment variables
dotenv.config()

// Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY
const BASE_URL = 'https://api.deepseek.com/v1/chat/completions'

console.log('🔧 DeepSeek API Diagnostic Test')
console.log('================================')
console.log(`🔑 API Key: ${DEEPSEEK_API_KEY ? 'Found' : 'Missing'}`)
console.log(`🌐 Base URL: ${BASE_URL}`)
console.log('')

/**
 * Test 1: Basic connectivity and authentication
 */
async function testBasicConnectivity() {
  console.log('📡 Test 1: Basic Connectivity & Authentication')
  console.log('----------------------------------------------')
  
  try {
    const startTime = Date.now()
    
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with exactly "API test successful" and nothing else.'
          },
          {
            role: 'user',
            content: 'Test'
          }
        ],
        max_tokens: 10,
        temperature: 0
      }),
      timeout: 30000 // 30 second timeout
    })
    
    const responseTime = Date.now() - startTime
    console.log(`⏱️  Response time: ${responseTime}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
      return false
    }
    
    const data = await response.json()
    console.log(`✅ Response: ${JSON.stringify(data, null, 2)}`)
    
    return true
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`)
    
    if (error.name === 'AbortError') {
      console.log('⚠️  Request timed out - API may be slow or overloaded')
    } else if (error.code === 'ENOTFOUND') {
      console.log('⚠️  DNS resolution failed - check internet connection')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Connection refused - API may be down')
    }
    
    return false
  }
}

/**
 * Test 2: Rate limiting and quota check
 */
async function testRateLimits() {
  console.log('\n📈 Test 2: Rate Limits & Quota')
  console.log('------------------------------')
  
  try {
    // Make a simple request to check quota
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        max_tokens: 5
      }),
      timeout: 15000
    })
    
    // Check response headers for rate limit info
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
    const rateLimitReset = response.headers.get('x-ratelimit-reset')
    const quotaRemaining = response.headers.get('x-quota-remaining')
    
    console.log(`📊 Rate Limit Remaining: ${rateLimitRemaining || 'Unknown'}`)
    console.log(`⏰ Rate Limit Reset: ${rateLimitReset || 'Unknown'}`)
    console.log(`💰 Quota Remaining: ${quotaRemaining || 'Unknown'}`)
    
    if (response.status === 429) {
      console.log('⚠️  Rate limit exceeded - need to wait')
      return false
    }
    
    if (response.status === 402) {
      console.log('⚠️  Insufficient balance - need to add credits')
      return false
    }
    
    return response.ok
    
  } catch (error) {
    console.log(`❌ Rate limit test failed: ${error.message}`)
    return false
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  if (!DEEPSEEK_API_KEY) {
    console.log('❌ No API key found. Please set DEEPSEEK_API_KEY or VITE_DEEPSEEK_API_KEY in .env')
    process.exit(1)
  }
  
  console.log('🚀 Starting DeepSeek API diagnostics...\n')
  
  // Run tests
  const connectivityOk = await testBasicConnectivity()
  const rateLimitsOk = await testRateLimits()
  
  // Summary
  console.log('\n📋 Diagnostic Summary')
  console.log('====================')
  console.log(`🔗 Connectivity: ${connectivityOk ? '✅ OK' : '❌ Failed'}`)
  console.log(`📊 Rate Limits: ${rateLimitsOk ? '✅ OK' : '❌ Issues'}`)
  
  // Recommendations
  console.log('\n💡 Recommendations')
  console.log('==================')
  
  if (!connectivityOk) {
    console.log('• Check your internet connection')
    console.log('• Verify API key is correct and active')
    console.log('• Try again later if API is overloaded')
  }
  
  if (!rateLimitsOk) {
    console.log('• Check account balance and add credits if needed')
    console.log('• Reduce request frequency if rate limited')
  }
  
  console.log('\n🏁 Diagnostics complete!')
}

// Run diagnostics
runDiagnostics().catch(console.error) 