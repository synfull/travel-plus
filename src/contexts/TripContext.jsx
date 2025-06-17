import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Initial trip state
const initialState = {
  // Trip basic info
  destination: '',
  startDate: '',
  endDate: '',
  people: 1,
  totalBudget: 1000,
  
  // Activity preferences
  categories: [],
  
  // Form state
  currentStep: 1,
  isValid: false,
  
  // Generated data
  currentItinerary: null,
  savedItineraries: [],
  
  // UI state
  isLoading: false,
  error: null,
}

// Action types
const TRIP_ACTIONS = {
  SET_DESTINATION: 'SET_DESTINATION',
  SET_DATES: 'SET_DATES',
  SET_PEOPLE: 'SET_PEOPLE',
  SET_BUDGET: 'SET_BUDGET',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CURRENT_ITINERARY: 'SET_CURRENT_ITINERARY',
  ADD_SAVED_ITINERARY: 'ADD_SAVED_ITINERARY',
  RESET_TRIP: 'RESET_TRIP',
  VALIDATE_TRIP: 'VALIDATE_TRIP',
}

// Reducer function
function tripReducer(state, action) {
  switch (action.type) {
    case TRIP_ACTIONS.SET_DESTINATION:
      return {
        ...state,
        destination: action.payload,
      }
    
    case TRIP_ACTIONS.SET_DATES:
      return {
        ...state,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
      }
    
    case TRIP_ACTIONS.SET_PEOPLE:
      return {
        ...state,
        people: action.payload,
      }
    
    case TRIP_ACTIONS.SET_BUDGET:
      return {
        ...state,
        totalBudget: action.payload,
      }
    
    case TRIP_ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
      }
    
    case TRIP_ACTIONS.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
      }
    
    case TRIP_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      }
    
    case TRIP_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    
    case TRIP_ACTIONS.SET_CURRENT_ITINERARY:
      return {
        ...state,
        currentItinerary: action.payload,
        isLoading: false,
        error: null,
      }
    
    case TRIP_ACTIONS.ADD_SAVED_ITINERARY:
      return {
        ...state,
        savedItineraries: [...state.savedItineraries, action.payload],
      }
    
    case TRIP_ACTIONS.VALIDATE_TRIP:
      const isValid = validateTripData(state)
      return {
        ...state,
        isValid,
      }
    
    case TRIP_ACTIONS.RESET_TRIP:
      return {
        ...initialState,
        savedItineraries: state.savedItineraries, // Keep saved itineraries
      }
    
    default:
      return state
  }
}

// Validation function
function validateTripData(state) {
  return !!(
    state.destination &&
    state.startDate &&
    state.endDate &&
    state.people > 0 &&
    state.totalBudget > 0 &&
    new Date(state.endDate) > new Date(state.startDate)
  )
}

// Create context
const TripContext = createContext()

// Context provider component
export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(tripReducer, initialState)

  // Load saved data on mount
  useEffect(() => {
    const savedTrip = localStorage.getItem('currentTrip')
    if (savedTrip) {
      try {
        const tripData = JSON.parse(savedTrip)
        Object.keys(tripData).forEach(key => {
          if (tripData[key] !== initialState[key]) {
            dispatch({
              type: `SET_${key.toUpperCase()}`,
              payload: tripData[key],
            })
          }
        })
      } catch (error) {
        console.error('Failed to load saved trip data:', error)
      }
    }
  }, [])

  // Save trip data when it changes
  useEffect(() => {
    const tripData = {
      destination: state.destination,
      startDate: state.startDate,
      endDate: state.endDate,
      people: state.people,
      totalBudget: state.totalBudget,
      categories: state.categories,
    }
    localStorage.setItem('currentTrip', JSON.stringify(tripData))
  }, [state.destination, state.startDate, state.endDate, state.people, state.totalBudget, state.categories])

  // Action creators
  const actions = {
    setDestination: (destination) => {
      dispatch({ type: TRIP_ACTIONS.SET_DESTINATION, payload: destination })
      dispatch({ type: TRIP_ACTIONS.VALIDATE_TRIP })
    },

    setDates: (startDate, endDate) => {
      dispatch({ type: TRIP_ACTIONS.SET_DATES, payload: { startDate, endDate } })
      dispatch({ type: TRIP_ACTIONS.VALIDATE_TRIP })
    },

    setPeople: (count) => {
      dispatch({ type: TRIP_ACTIONS.SET_PEOPLE, payload: count })
      dispatch({ type: TRIP_ACTIONS.VALIDATE_TRIP })
    },

    setBudget: (budget) => {
      dispatch({ type: TRIP_ACTIONS.SET_BUDGET, payload: budget })
      dispatch({ type: TRIP_ACTIONS.VALIDATE_TRIP })
    },

    setCategories: (categories) => {
      dispatch({ type: TRIP_ACTIONS.SET_CATEGORIES, payload: categories })
      dispatch({ type: TRIP_ACTIONS.VALIDATE_TRIP })
    },

    setCurrentStep: (step) => {
      dispatch({ type: TRIP_ACTIONS.SET_CURRENT_STEP, payload: step })
    },

    setLoading: (loading) => {
      dispatch({ type: TRIP_ACTIONS.SET_LOADING, payload: loading })
    },

    setError: (error) => {
      dispatch({ type: TRIP_ACTIONS.SET_ERROR, payload: error })
    },

    setCurrentItinerary: (itinerary) => {
      dispatch({ type: TRIP_ACTIONS.SET_CURRENT_ITINERARY, payload: itinerary })
    },

    saveItinerary: (itinerary) => {
      dispatch({ type: TRIP_ACTIONS.ADD_SAVED_ITINERARY, payload: itinerary })
    },

    resetTrip: () => {
      dispatch({ type: TRIP_ACTIONS.RESET_TRIP })
      localStorage.removeItem('currentTrip')
    },

    // Get trip data formatted for API calls
    getTripData: () => ({
      destination: state.destination,
      startDate: state.startDate,
      endDate: state.endDate,
      people: state.people,
      totalBudget: state.totalBudget,
      categories: state.categories,
    }),
  }

  const value = {
    ...state,
    ...actions,
  }

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  )
}

// Custom hook to use trip context
export function useTrip() {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider')
  }
  return context
}

export default TripContext 