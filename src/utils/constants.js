// Application constants

export const APP_NAME = 'Travel+'
export const APP_VERSION = '1.0.0'
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://travelplus.app'

// Travel categories
export const TRAVEL_CATEGORIES = {
  NIGHTLIFE: {
    id: 'nightlife',
    label: 'Nightlife & Drinks',
    icon: '🍺',
    description: 'Bars, clubs, cocktails, and late-night fun',
    gradient: 'from-purple-500 to-pink-500'
  },
  ADVENTURE: {
    id: 'adventure',
    label: 'Adventure & Outdoors',
    icon: '🏔️',
    description: 'Hiking, diving, extreme sports, and nature',
    gradient: 'from-green-500 to-teal-500'
  },
  CULTURE: {
    id: 'culture',
    label: 'History & Culture',
    icon: '🏛️',
    description: 'Museums, monuments, and cultural experiences',
    gradient: 'from-amber-500 to-orange-500'
  },
  FOOD: {
    id: 'food',
    label: 'Food & Cuisine',
    icon: '🍜',
    description: 'Local cuisine, restaurants, and food tours',
    gradient: 'from-red-500 to-yellow-500'
  },
  FAMILY: {
    id: 'family',
    label: 'Family Friendly',
    icon: '👨‍👩‍👧‍👦',
    description: 'Kid-friendly activities and attractions',
    gradient: 'from-blue-500 to-green-500'
  },
  RELAXATION: {
    id: 'relaxation',
    label: 'Beach & Relaxation',
    icon: '🏖️',
    description: 'Beaches, spas, and peaceful retreats',
    gradient: 'from-cyan-500 to-blue-500'
  },
  ARTS: {
    id: 'arts',
    label: 'Arts & Creative',
    icon: '🎨',
    description: 'Galleries, theaters, and creative workshops',
    gradient: 'from-pink-500 to-rose-500'
  },
  SHOPPING: {
    id: 'shopping',
    label: 'Shopping & Markets',
    icon: '🛍️',
    description: 'Local markets, boutiques, and shopping districts',
    gradient: 'from-indigo-500 to-purple-500'
  }
}

// Budget ranges
export const BUDGET_RANGES = {
  BUDGET: { min: 0, max: 1000, label: 'Budget' },
  MID_RANGE: { min: 1000, max: 3000, label: 'Mid-Range' },
  LUXURY: { min: 3000, max: 10000, label: 'Luxury' },
  ULTRA_LUXURY: { min: 10000, max: null, label: 'Ultra Luxury' }
}

// Trip duration options
export const TRIP_DURATIONS = {
  WEEKEND: { days: 3, label: 'Weekend Getaway' },
  WEEK: { days: 7, label: 'Week Long' },
  TWO_WEEKS: { days: 14, label: 'Two Weeks' },
  MONTH: { days: 30, label: 'Month Long' }
}

// Popular destinations
export const POPULAR_DESTINATIONS = [
  { id: 1, city: 'Cancun', country: 'Mexico', code: 'CUN', emoji: '🏖️' },
  { id: 2, city: 'Paris', country: 'France', code: 'CDG', emoji: '🗼' },
  { id: 3, city: 'Tokyo', country: 'Japan', code: 'NRT', emoji: '🗾' },
  { id: 4, city: 'Barcelona', country: 'Spain', code: 'BCN', emoji: '🏛️' },
  { id: 5, city: 'New York', country: 'USA', code: 'JFK', emoji: '🗽' },
  { id: 6, city: 'Bali', country: 'Indonesia', code: 'DPS', emoji: '🌴' },
  { id: 7, city: 'London', country: 'UK', code: 'LHR', emoji: '💂' },
  { id: 8, city: 'Dubai', country: 'UAE', code: 'DXB', emoji: '🌆' },
]

// API rate limits
export const API_LIMITS = {
  AMADEUS: {
    DAILY: 1000,
    MONTHLY: 30000,
    RATE_PER_SECOND: 10
  },
  GOOGLE_MAPS: {
    DAILY_CREDIT: 200,
    PLACES_PER_CALL: 10,
    DIRECTIONS_PER_CALL: 25
  }
}

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  API_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You need to be logged in to access this.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.'
}