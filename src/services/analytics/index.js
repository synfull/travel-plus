// Google Analytics tracking service

import { API_CONFIG } from '../api/config'

// Initialize GA
export function initializeAnalytics() {
  if (typeof window === 'undefined' || !API_CONFIG.GA_ID) return

  // Load Google Analytics script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${API_CONFIG.GA_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', API_CONFIG.GA_ID)
}

// Track custom events
export function trackEvent(eventName, parameters = {}) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', eventName, {
    ...parameters,
    timestamp: new Date().toISOString(),
  })
}

// Track page views
export function trackPageView(pagePath, pageTitle) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('config', API_CONFIG.GA_ID, {
    page_path: pagePath,
    page_title: pageTitle,
  })
}

// Track affiliate clicks
export function trackAffiliateClick(affiliateType, destination, itemId) {
  trackEvent('affiliate_click', {
    event_category: 'affiliate',
    event_label: affiliateType,
    destination: destination,
    item_id: itemId,
    value: 1,
  })
}

// Track search events
export function trackSearch(searchType, query, resultsCount) {
  trackEvent('search', {
    event_category: 'search',
    search_type: searchType,
    search_term: query,
    results_count: resultsCount,
  })
}

// Track conversion events
export function trackConversion(conversionType, value, currency = 'USD') {
  trackEvent('conversion', {
    event_category: 'conversion',
    conversion_type: conversionType,
    value: value,
    currency: currency,
  })
}

// Track errors
export function trackError(errorType, errorMessage, errorLocation) {
  trackEvent('error', {
    event_category: 'error',
    error_type: errorType,
    error_message: errorMessage,
    error_location: errorLocation,
  })
}

// Common event trackers
export const analytics = {
  // User actions
  trackTripPlanStart: (destination) => 
    trackEvent('trip_plan_start', { destination }),
  
  trackTripPlanComplete: (tripData) => 
    trackEvent('trip_plan_complete', {
      destination: tripData.destination,
      budget: tripData.totalBudget,
      days: tripData.days,
      categories: tripData.categories.join(','),
    }),
  
  trackItineraryView: (itineraryId) => 
    trackEvent('itinerary_view', { itinerary_id: itineraryId }),
  
  trackItineraryShare: (itineraryId, method) => 
    trackEvent('itinerary_share', { 
      itinerary_id: itineraryId,
      share_method: method 
    }),
  
  // Engagement metrics
  trackTimeOnPage: (pageName, seconds) => 
    trackEvent('engagement', {
      event_category: 'engagement',
      page_name: pageName,
      time_spent: seconds,
    }),
  
  trackScrollDepth: (pageName, percentage) => 
    trackEvent('scroll_depth', {
      event_category: 'engagement',
      page_name: pageName,
      scroll_percentage: percentage,
    }),
  
  // Feature usage
  trackFeatureUse: (featureName) => 
    trackEvent('feature_use', {
      event_category: 'feature',
      feature_name: featureName,
    }),
  
  trackFilterUse: (filterType, filterValue) => 
    trackEvent('filter_use', {
      event_category: 'filter',
      filter_type: filterType,
      filter_value: filterValue,
    }),
}

// Initialize analytics on app load
if (typeof window !== 'undefined') {
  initializeAnalytics()
}