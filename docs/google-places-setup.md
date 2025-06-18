# Google Places API Setup Guide

The Travel+ app integrates with Google Places API to provide real venue information including ratings, photos, contact details, and business hours.

## Prerequisites

1. Google Cloud Project with billing enabled
2. Google Places API access

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

### 2. Enable APIs

Enable the following APIs in the [Google Cloud Console API Library](https://console.cloud.google.com/apis/library):

- **Places API (New)** - For text search and place details
- **Maps JavaScript API** - For map integration (optional)

### 3. Create API Key

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "API Key"
3. Copy the API key

### 4. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. Go to your API key settings
2. Under "Application restrictions":
   - For development: Select "None"
   - For production: Select "HTTP referrers" and add your domain
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Places API (New)" and "Maps JavaScript API"

### 5. Set Environment Variables

#### Development (.env.local)
```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

#### Production (Netlify)
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add: `GOOGLE_PLACES_API_KEY` = `your_api_key_here`

## API Usage & Costs

### Free Tier
- $200 free credit per month
- Equivalent to ~11,000 text searches or ~40,000 place details requests

### Pricing (after free credit)
- **Text Search**: $17 per 1,000 requests
- **Place Details**: $17 per 1,000 requests  
- **Find Place**: $17 per 1,000 requests

### Cost Optimization Tips

1. **Caching**: The app caches venue data to minimize API calls
2. **Rate Limiting**: Built-in delays prevent hitting rate limits
3. **Fallback Data**: Mock data is used when API is unavailable
4. **Selective Fields**: Only essential fields are requested to reduce costs

## Architecture

```
Frontend Request → Netlify Function → Google Places API → Response
```

### Why Use a Proxy Function?

1. **Security**: API key is hidden from frontend
2. **CORS**: Avoids cross-origin request issues
3. **Rate Limiting**: Server-side control over API usage
4. **Error Handling**: Graceful fallbacks

## Testing

### Without API Key
The app will use mock data that provides realistic venue information for testing.

### With API Key
1. Set the environment variable
2. Deploy to Netlify or run locally
3. Create a trip to see real venue data

## Monitoring Usage

1. Go to [Google Cloud Console APIs & Services](https://console.cloud.google.com/apis/dashboard)
2. Click on "Places API (New)"
3. View usage statistics and set up billing alerts

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check the key is correctly set in environment variables
   - Verify API is enabled in Google Cloud Console

2. **CORS Errors**
   - Use the proxy function (automatically handled)
   - Check API key restrictions

3. **Quota Exceeded**
   - Monitor usage in Google Cloud Console
   - Implement request throttling
   - Use caching more aggressively

4. **No Results Found**
   - App falls back to mock data automatically
   - Check venue name spelling and destination

### Debug Mode

Set `VITE_DEBUG_MODE=true` to see detailed logs about API calls and responses.

## Alternative Setup (Direct API Key)

For simple testing, you can set `VITE_GOOGLE_PLACES_API_KEY` in the frontend, but this is not recommended for production as it exposes your API key.

## Related Files

- `/netlify/functions/google-places-proxy.js` - API proxy function
- `/src/services/enrichment/venueEnrichment.js` - Main API integration
- `/env.example` - Environment variable template 