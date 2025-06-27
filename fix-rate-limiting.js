#!/usr/bin/env node

/**
 * Quick fix for rate limiting issues
 */

import fs from 'fs'

// Fix Expedia Service
const expediaFile = './src/services/api/ExpediaRapidService.js'
let expediaContent = fs.readFileSync(expediaFile, 'utf8')
expediaContent = expediaContent.replace(
  'return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))',
  'return new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs))'
)
fs.writeFileSync(expediaFile, expediaContent)

// Fix Google Hotels Service
const googleFile = './src/services/api/GoogleHotelsScraperService.js'
let googleContent = fs.readFileSync(googleFile, 'utf8')
googleContent = googleContent.replace(
  'this.rateLimitDelay = 2000',
  'this.rateLimitDelayMs = 2000'
).replace(
  'return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))',
  'return new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs))'
)
fs.writeFileSync(googleFile, googleContent)

console.log('✅ Fixed rate limiting issues in both services') 