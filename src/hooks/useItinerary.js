import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { itineraryGenerator } from '../services/itinerary/itineraryGenerator'
import { analytics } from '../services/analytics'

// Hook for generating itineraries
export function useGenerateItinerary() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tripData) => {
      // Track start of generation
      analytics.trackTripPlanStart(tripData.destination)
      
      // Generate itinerary
      const itinerary = await itineraryGenerator.generateItinerary(tripData)
      
      // Track completion
      analytics.trackTripPlanComplete(tripData)
      
      return itinerary
    },
    onSuccess: (itinerary) => {
      // Make sure we have a valid itinerary with an ID
      if (!itinerary || !itinerary.id) {
        console.error('Invalid itinerary response:', itinerary)
        toast.error('Invalid itinerary response. Please try again.')
        return
      }
      
      console.log('🎉 Itinerary generation successful!')
      console.log('📊 Generated itinerary:', itinerary)
      console.log('🔑 Caching with key:', ['itinerary', itinerary.id])
      
      // Cache the itinerary
      queryClient.setQueryData(['itinerary', itinerary.id], itinerary)
      
      // Verify the cache was set
      const cached = queryClient.getQueryData(['itinerary', itinerary.id])
      console.log('🔍 Verification - cached data exists:', !!cached)
      
      console.log('✅ Cached successfully, navigating to:', `/itinerary/${itinerary.id}`)
      
      // Show success message
      toast.success('Your itinerary is ready!')
      
      // Add a small delay to ensure cache is properly set before navigation
      setTimeout(() => {
      navigate(`/itinerary/${itinerary.id}`)
      }, 100)
    },
    onError: (error) => {
      console.error('Failed to generate itinerary:', error)
      toast.error('Failed to generate itinerary. Please try again.')
      
      // Track error
      analytics.trackError('itinerary_generation', error.message, 'useGenerateItinerary')
    }
  })
}

// Hook for fetching a specific itinerary
export function useItinerary(itineraryId) {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ['itinerary', itineraryId],
    queryFn: async () => {
      console.log('🔍 Fetching itinerary with ID:', itineraryId)
      
      // In a real app, this would fetch from your backend
      // For now, we'll get it from the query cache
      const cached = queryClient.getQueryData(['itinerary', itineraryId])
      console.log('📦 Cached data found:', !!cached)
      console.log('📦 Cached data:', cached)
      
      if (cached) {
        console.log('✅ Returning cached itinerary for destination:', cached.destination)
        return cached
      }
      
      // Check all query cache entries to see what we have
      const queryCache = queryClient.getQueryCache()
      const allQueries = queryCache.getAll()
      console.log('🗄️ All cached queries:', allQueries.map(q => ({ key: q.queryKey, hasData: !!q.state.data })))
      
      // If not in cache, look for any itinerary data in the cache
      // This handles cases where the ID might not match exactly
      const itineraryQueries = allQueries.filter(q => 
        q.queryKey[0] === 'itinerary' && q.state.data
      )
      
      if (itineraryQueries.length > 0) {
        console.log('🔄 Found itinerary in cache with different ID, using it')
        const fallbackItinerary = itineraryQueries[0].state.data
        // Update the cache with the correct ID
        queryClient.setQueryData(['itinerary', itineraryId], fallbackItinerary)
        return fallbackItinerary
      }
      
      // If still no data, generate a fallback based on the ID pattern
      console.log('⚠️ No cached data found, generating fallback itinerary')
      
      // Try to extract destination from localStorage or other sources
      const savedTrip = localStorage.getItem('currentTrip')
      let destination = 'Your Destination'
      let tripData = {}
      
      if (savedTrip) {
        try {
          tripData = JSON.parse(savedTrip)
          destination = tripData.destination || 'Your Destination'
        } catch (e) {
          console.warn('Failed to parse saved trip data')
        }
      }
      
      const mockItinerary = {
        id: itineraryId,
        destination: destination,
        title: `${destination} Adventure`,
        overview: `Your perfect ${destination} adventure awaits!`,
        startDate: tripData.startDate || '2024-06-15',
        endDate: tripData.endDate || '2024-06-18',
        people: tripData.people || 2,
        days: [
          {
            dayNumber: 1,
            date: tripData.startDate || '2024-06-15',
            title: `Arrival & Beach Vibes`,
            morning: {
              time: '9:00 AM',
              activity: 'Explore Local Attractions',
              description: `Start your day exploring the highlights of ${destination}`,
              estimatedCost: 25,
            },
            afternoon: {
              time: '2:00 PM', 
              activity: 'Local Cuisine Experience',
              description: `Enjoy authentic local cuisine at recommended restaurants`,
              estimatedCost: 40,
            },
            evening: {
              time: '7:00 PM',
              activity: 'Cultural Experience',
              description: `Immerse yourself in the local culture with evening activities`,
              estimatedCost: 35,
            }
          }
        ],
        budgetSummary: {
          flights: 600,
          accommodation: 240,
          activities: 300,
          meals: 120,
          total: 1260,
        },
        insiderTips: [
          `Book accommodations in advance for better rates in ${destination}`,
          'Try to learn a few basic phrases in the local language',
          'Always carry a portable charger and download offline maps'
        ]
      }
      
      // Store it in cache for future use
      queryClient.setQueryData(['itinerary', itineraryId], mockItinerary)
      return mockItinerary
    },
    enabled: !!itineraryId,
    onSuccess: () => {
      analytics.trackItineraryView(itineraryId)
    }
  })
}

// Hook for searching destinations
export function useDestinationSearch(query) {
  return useQuery({
    queryKey: ['destinations', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      
      // In production, this would call Google Places API
      // For now, return mock data
      const mockDestinations = [
        { id: '1', name: 'Cancun, Mexico', placeId: 'ChIJ21P2Xx4pTI8Rg1YZmhNnMlo' },
        { id: '2', name: 'Paris, France', placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ' },
        { id: '3', name: 'Tokyo, Japan', placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4' },
      ].filter(dest => 
        dest.name.toLowerCase().includes(query.toLowerCase())
      )
      
      analytics.trackSearch('destination', query, mockDestinations.length)
      
      return mockDestinations
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// Hook for managing itinerary state
export function useItineraryState() {
  const [currentItinerary, setCurrentItinerary] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)

  const updateItinerary = useCallback((updates) => {
    setCurrentItinerary(prev => ({
      ...prev,
      ...updates,
    }))
  }, [])

  const selectDay = useCallback((dayIndex) => {
    setSelectedDay(dayIndex)
    analytics.trackFeatureUse('day_navigation')
  }, [])

  const toggleEdit = useCallback(() => {
    setIsEditing(prev => !prev)
    analytics.trackFeatureUse('itinerary_edit')
  }, [])

  const shareItinerary = useCallback((method = 'link') => {
    if (!currentItinerary) return
    
    // In production, this would generate a shareable link
    const shareUrl = `${window.location.origin}/itinerary/${currentItinerary.id}`
    
    if (method === 'copy') {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    } else if (method === 'email') {
      window.location.href = `mailto:?subject=Check out my trip to ${currentItinerary.destination}&body=${shareUrl}`
    }
    
    analytics.trackItineraryShare(currentItinerary.id, method)
  }, [currentItinerary])

  const downloadItinerary = useCallback(() => {
    if (!currentItinerary) return
    
    // Convert itinerary to PDF or downloadable format
    // For now, just create a text version
    const text = formatItineraryAsText(currentItinerary)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentItinerary.destination}-itinerary.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    analytics.trackFeatureUse('itinerary_download')
  }, [currentItinerary])

  return {
    currentItinerary,
    isEditing,
    selectedDay,
    setCurrentItinerary,
    updateItinerary,
    selectDay,
    toggleEdit,
    shareItinerary,
    downloadItinerary,
  }
}

// Helper function to format itinerary as text
function formatItineraryAsText(itinerary) {
  let text = `${itinerary.title}\n\n`
  text += `${itinerary.overview}\n\n`
  
  itinerary.days.forEach(day => {
    text += `Day ${day.dayNumber} - ${day.title}\n`
    text += `Date: ${day.date}\n\n`
    
    if (day.morning) {
      text += `Morning (${day.morning.time}):\n`
      text += `${day.morning.activity}\n`
      text += `${day.morning.description}\n\n`
    }
    
    if (day.afternoon) {
      text += `Afternoon (${day.afternoon.time}):\n`
      text += `${day.afternoon.activity}\n`
      text += `${day.afternoon.description}\n\n`
    }
    
    if (day.evening) {
      text += `Evening (${day.evening.time}):\n`
      text += `${day.evening.activity}\n`
      text += `${day.evening.description}\n\n`
    }
    
    text += '---\n\n'
  })
  
  if (itinerary.budgetSummary) {
    text += 'Budget Summary:\n'
    text += `Flights: $${itinerary.budgetSummary.flights}\n`
    text += `Hotels: $${itinerary.budgetSummary.accommodation}\n`
    text += `Activities: $${itinerary.budgetSummary.activities}\n`
    text += `Total: $${itinerary.budgetSummary.total}\n\n`
  }
  
  if (itinerary.insiderTips) {
    text += 'Insider Tips:\n'
    itinerary.insiderTips.forEach(tip => {
      text += `• ${tip}\n`
    })
  }
  
  return text
}