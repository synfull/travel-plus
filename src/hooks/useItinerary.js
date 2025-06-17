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
      
      // Cache the itinerary
      queryClient.setQueryData(['itinerary', itinerary.id], itinerary)
      
      // Show success message
      toast.success('Your itinerary is ready!')
      
      // Navigate to itinerary page
      navigate(`/itinerary/${itinerary.id}`)
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
      // In a real app, this would fetch from your backend
      // For now, we'll get it from the query cache
      const cached = queryClient.getQueryData(['itinerary', itineraryId])
      if (cached) return cached
      
      // If not in cache, fetch from backend
      throw new Error('Itinerary not found')
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