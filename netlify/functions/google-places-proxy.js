import fetch from 'node-fetch'

/**
 * Google Places API Proxy Function
 * Handles CORS issues by proxying requests server-side
 */
export async function handler(event, context) {
  // Enable CORS for frontend requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Get API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.error('❌ Google Places API key not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Google Places API key not configured',
          success: false 
        })
      }
    }

    // Parse request data
    const queryParams = event.queryStringParameters || {}
    const endpoint = queryParams.endpoint
    
    if (!endpoint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing endpoint parameter',
          success: false 
        })
      }
    }

    // Extract parameters that start with 'params.'
    const params = {}
    Object.keys(queryParams).forEach(key => {
      if (key.startsWith('params.')) {
        const paramName = key.substring(7) // Remove 'params.' prefix
        params[paramName] = queryParams[key]
      }
    })

    console.log(`🌐 Google Places Proxy: ${endpoint} request`)
    console.log(`📝 Extracted params:`, params)

    // Route to appropriate Google Places API endpoint
    let googleApiUrl
    let apiQueryParams = new URLSearchParams({ key: apiKey })

    switch (endpoint) {
      case 'geocode':
        googleApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
        if (params.address) apiQueryParams.append('address', params.address)
        break

      case 'nearbysearch':
        googleApiUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        if (params.location) apiQueryParams.append('location', params.location)
        if (params.radius) apiQueryParams.append('radius', params.radius)
        if (params.keyword) apiQueryParams.append('keyword', params.keyword)
        if (params.type) apiQueryParams.append('type', params.type)
        break

      case 'textsearch':
        googleApiUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
        if (params.query) apiQueryParams.append('query', params.query)
        if (params.location) apiQueryParams.append('location', params.location)
        if (params.radius) apiQueryParams.append('radius', params.radius)
        if (params.type) apiQueryParams.append('type', params.type)
        break

      case 'details':
        googleApiUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
        if (params.place_id) apiQueryParams.append('place_id', params.place_id)
        if (params.fields) apiQueryParams.append('fields', params.fields)
        break

      case 'photos':
        googleApiUrl = 'https://maps.googleapis.com/maps/api/place/photo'
        if (params.photoreference) apiQueryParams.append('photoreference', params.photoreference)
        if (params.maxwidth) apiQueryParams.append('maxwidth', params.maxwidth)
        if (params.maxheight) apiQueryParams.append('maxheight', params.maxheight)
        break

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `Unsupported endpoint: ${endpoint}`,
            supported: ['geocode', 'nearbysearch', 'textsearch', 'details', 'photos'],
            success: false 
          })
        }
    }

    // Build final URL
    const finalUrl = `${googleApiUrl}?${apiQueryParams.toString()}`
    console.log(`📍 Calling Google API: ${googleApiUrl}`)

    // Make request to Google Places API
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Travel+ App/1.0'
      },
      timeout: 10000 // 10 second timeout
    })

    if (!response.ok) {
      console.error(`❌ Google API error: ${response.status} ${response.statusText}`)
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Google API error: ${response.statusText}`,
          status: response.status,
          success: false 
        })
      }
    }

    // For photo endpoint, return the image directly
    if (endpoint === 'photos') {
      const imageBuffer = await response.buffer()
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': response.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400' // Cache images for 24 hours
        },
        body: imageBuffer.toString('base64'),
        isBase64Encoded: true
      }
    }

    // Parse JSON response for other endpoints
    const data = await response.json()

    // Add success flag and timing
    const result = {
      ...data,
      success: data.status === 'OK',
      timestamp: new Date().toISOString(),
      endpoint,
      cached: false
    }

    // Log results
    const resultCount = data.results ? data.results.length : 0
    console.log(`✅ Google Places: ${endpoint} returned ${resultCount} results`)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
      },
      body: JSON.stringify(result)
    }

  } catch (error) {
    console.error('❌ Google Places Proxy error:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        success: false,
        timestamp: new Date().toISOString()
      })
    }
  }
} 