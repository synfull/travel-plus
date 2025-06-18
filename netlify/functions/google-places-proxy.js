export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { query, placeId, action } = JSON.parse(event.body)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Google Places API key not configured' })
      }
    }

    let apiUrl
    
    if (action === 'search') {
      // Text Search API
      apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    } else if (action === 'details') {
      // Place Details API
      apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,photos,geometry,business_status,types&key=${apiKey}`
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action' })
      }
    }

    const response = await fetch(apiUrl)
    const data = await response.json()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(data)
    }

  } catch (error) {
    console.error('Google Places proxy error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
} 