# Amadeus API Setup Guide

## Current Status
- ❌ API Authentication failing (401 Unauthorized)
- ✅ Fallback system working (mock flights/hotels will appear)
- ✅ App should still work completely

## Fix Your Amadeus API Keys

### 1. Check Your Environment
Visit: https://developers.amadeus.com/my-apps

**Test vs Production:**
- **Test Environment**: For development (free, limited data)
- **Production Environment**: For live apps (paid, real bookings)

### 2. Get Test Environment Keys
1. Log into your Amadeus Developer account
2. Click on your app
3. Make sure you're in **"Test Environment"** (not Production)
4. Copy your **Test** API Key and Secret

### 3. Update Your .env File
Create/update `travel-plus/.env`:

```bash
# Amadeus API - TEST ENVIRONMENT
VITE_AMADEUS_API_KEY=your_test_api_key_here
VITE_AMADEUS_API_SECRET=your_test_api_secret_here

# For Netlify functions (without VITE_ prefix)
AMADEUS_API_KEY=your_test_api_key_here
AMADEUS_API_SECRET=your_test_api_secret_here

# DeepSeek API (working)
VITE_DEEPSEEK_API_KEY=sk-4b4e4b9f7b4e4b9f7b4e4b9f7b4e4b9f

# Google Places API
VITE_GOOGLE_PLACES_API_KEY=your_google_places_key

# App URLs
VITE_API_URL=/.netlify/functions
```

### 4. Test the Fix
```bash
# Test API directly
node test-amadeus-simple.js

# Start the app
npm run dev
```

## What's Working Right Now

Even with API issues, your app should show:

### ✅ Flights (Mock Data)
- American Airlines flights
- Realistic pricing ($324+ per person)
- Departure/arrival times

### ✅ Hotels (Mock Data)
- "Beachfront Resort & Spa" ($180/night)
- "Downtown Boutique Hotel" ($120/night)
- Amenities, ratings, images

### ✅ Activities
- Historic tours, food experiences
- Cultural museums, adventures
- Real pricing and durations

### ✅ AI-Enhanced Descriptions
- DeepSeek API working perfectly
- Rich, detailed venue descriptions
- Local insights and recommendations

## Next Steps

1. **Test the app now** - flights/hotels should appear (mock data)
2. **Fix Amadeus keys** - get real flight/hotel data
3. **Add Google Places key** - get real venue data
4. **Production ready!** 🚀

## Troubleshooting

**No flights/hotels showing?**
- Check browser console for errors
- Ensure Netlify functions are running
- Try `npm run dev` and visit http://localhost:3000

**Still getting 401 errors?**
- Double-check you're using TEST environment keys
- Verify your Amadeus account is active
- Try creating a new app in Amadeus dashboard 