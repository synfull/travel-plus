import React, { createContext, useContext, useReducer, useEffect } from 'react'
import supabase from '@services/supabase'
import { handleApiError } from '@utils/errorHandlers'
import { trackEvent } from '@services/analytics'
import { toast } from 'react-hot-toast'

// Initial user state
const initialState = {
  // Authentication state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  
  // User profile data
  profile: {
    email: '',
    name: '',
    avatar_url: '',
    created_at: null,
  },
  
  // User preferences
  preferences: {
    preferred_categories: [],
    typical_budget_range: { min: 500, max: 5000 },
    home_location: '',
    past_destinations: [],
    currency: 'USD',
    units: 'metric', // metric or imperial
    language: 'en',
    notifications: {
      email: true,
      push: false,
      marketing: false,
    },
  },
  
  // Saved data
  savedItineraries: [],
  recentSearches: [],
  
  // UI state
  showAuthModal: false,
  authMode: 'signin', // 'signin', 'signup', 'reset'
  error: null,
}

// Action types
const USER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SESSION: 'SET_SESSION',
  SET_USER: 'SET_USER',
  SET_PROFILE: 'SET_PROFILE',
  SET_PREFERENCES: 'SET_PREFERENCES',
  SET_SAVED_ITINERARIES: 'SET_SAVED_ITINERARIES',
  ADD_SAVED_ITINERARY: 'ADD_SAVED_ITINERARY',
  REMOVE_SAVED_ITINERARY: 'REMOVE_SAVED_ITINERARY',
  SET_RECENT_SEARCHES: 'SET_RECENT_SEARCHES',
  ADD_RECENT_SEARCH: 'ADD_RECENT_SEARCH',
  SET_AUTH_MODAL: 'SET_AUTH_MODAL',
  SET_AUTH_MODE: 'SET_AUTH_MODE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_USER: 'RESET_USER',
}

// Reducer function
function userReducer(state, action) {
  switch (action.type) {
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      }
    
    case USER_ACTIONS.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      }
    
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      }
    
    case USER_ACTIONS.SET_PROFILE:
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
        },
      }
    
    case USER_ACTIONS.SET_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      }
    
    case USER_ACTIONS.SET_SAVED_ITINERARIES:
      return {
        ...state,
        savedItineraries: action.payload,
      }
    
    case USER_ACTIONS.ADD_SAVED_ITINERARY:
      return {
        ...state,
        savedItineraries: [action.payload, ...state.savedItineraries],
      }
    
    case USER_ACTIONS.REMOVE_SAVED_ITINERARY:
      return {
        ...state,
        savedItineraries: state.savedItineraries.filter(
          itinerary => itinerary.id !== action.payload
        ),
      }
    
    case USER_ACTIONS.SET_RECENT_SEARCHES:
      return {
        ...state,
        recentSearches: action.payload,
      }
    
    case USER_ACTIONS.ADD_RECENT_SEARCH:
      const newSearch = action.payload
      const filteredSearches = state.recentSearches.filter(
        search => search.destination !== newSearch.destination
      )
      return {
        ...state,
        recentSearches: [newSearch, ...filteredSearches].slice(0, 10), // Keep last 10
      }
    
    case USER_ACTIONS.SET_AUTH_MODAL:
      return {
        ...state,
        showAuthModal: action.payload,
      }
    
    case USER_ACTIONS.SET_AUTH_MODE:
      return {
        ...state,
        authMode: action.payload,
      }
    
    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    
    case USER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }
    
    case USER_ACTIONS.RESET_USER:
      return {
        ...initialState,
        isLoading: false,
      }
    
    default:
      return state
  }
}

// Create context
const UserContext = createContext()

// Context provider component
export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState)

  // Initialize authentication state
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
          }
          return
        }

        if (mounted) {
          dispatch({ type: USER_ACTIONS.SET_SESSION, payload: session })
          if (session?.user) {
            dispatch({ type: USER_ACTIONS.SET_USER, payload: session.user })
            await loadUserData(session.user.id)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
        }
      } finally {
        if (mounted) {
          dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)
        
        dispatch({ type: USER_ACTIONS.SET_SESSION, payload: session })
        dispatch({ type: USER_ACTIONS.SET_USER, payload: session?.user || null })

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id)
          trackEvent('user_signed_in', { user_id: session.user.id })
          toast.success('Welcome back!')
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: USER_ACTIONS.RESET_USER })
          trackEvent('user_signed_out')
          toast.success('Signed out successfully')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Load user data from database
  const loadUserData = async (userId) => {
    try {
      // Load user preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading preferences:', prefsError)
      } else if (preferences) {
        dispatch({
          type: USER_ACTIONS.SET_PREFERENCES,
          payload: {
            preferred_categories: preferences.preferred_categories || [],
            typical_budget_range: preferences.typical_budget_range || { min: 500, max: 5000 },
            home_location: preferences.home_location || '',
            past_destinations: preferences.past_destinations || [],
          },
        })
      }

      // Load saved itineraries
      const { data: itineraries, error: itinError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (itinError) {
        console.error('Error loading itineraries:', itinError)
      } else {
        dispatch({ type: USER_ACTIONS.SET_SAVED_ITINERARIES, payload: itineraries || [] })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Authentication methods
  const signUp = async (email, password, userData = {}) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: USER_ACTIONS.CLEAR_ERROR })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || '',
          },
        },
      })

      if (error) throw error

      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account')
      }

      trackEvent('user_signup_attempt', { email, method: 'email' })
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      handleApiError(error, 'Failed to create account')
      return { data: null, error }
    } finally {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const signIn = async (email, password) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: USER_ACTIONS.CLEAR_ERROR })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      trackEvent('user_signin_attempt', { email, method: 'email' })
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      handleApiError(error, 'Failed to sign in')
      return { data: null, error }
    } finally {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const signInWithProvider = async (provider) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: USER_ACTIONS.CLEAR_ERROR })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      trackEvent('user_signin_attempt', { method: provider })
      return { data, error: null }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      handleApiError(error, `Failed to sign in with ${provider}`)
      return { data: null, error }
    } finally {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const signOut = async () => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      handleApiError(error, 'Failed to sign out')
      return { error }
    } finally {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const resetPassword = async (email) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: USER_ACTIONS.CLEAR_ERROR })

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent!')
      trackEvent('password_reset_request', { email })
      return { data, error: null }
    } catch (error) {
      console.error('Password reset error:', error)
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      handleApiError(error, 'Failed to send reset email')
      return { data: null, error }
    } finally {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
    }
  }

  // User data methods
  const updateProfile = async (updates) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      })

      if (error) throw error

      dispatch({ type: USER_ACTIONS.SET_PROFILE, payload: updates })
      toast.success('Profile updated successfully')
      trackEvent('profile_updated')
      return { data, error: null }
    } catch (error) {
      console.error('Profile update error:', error)
      handleApiError(error, 'Failed to update profile')
      return { data: null, error }
    }
  }

  const updatePreferences = async (preferences) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: state.user.id,
          preferred_categories: preferences.preferred_categories,
          typical_budget_range: preferences.typical_budget_range,
          home_location: preferences.home_location,
          past_destinations: preferences.past_destinations,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      dispatch({ type: USER_ACTIONS.SET_PREFERENCES, payload: preferences })
      toast.success('Preferences updated')
      trackEvent('preferences_updated')
      return { data, error: null }
    } catch (error) {
      console.error('Preferences update error:', error)
      handleApiError(error, 'Failed to update preferences')
      return { data: null, error }
    }
  }

  const saveItinerary = async (itinerary) => {
    try {
      if (!state.user) {
        // Show auth modal for guest users
        dispatch({ type: USER_ACTIONS.SET_AUTH_MODAL, payload: true })
        dispatch({ type: USER_ACTIONS.SET_AUTH_MODE, payload: 'signup' })
        throw new Error('Please sign in to save your itinerary')
      }

      const { data, error } = await supabase
        .from('itineraries')
        .insert({
          user_id: state.user.id,
          destination: itinerary.destination,
          start_date: itinerary.startDate,
          end_date: itinerary.endDate,
          people: itinerary.people || 1,
          budget: itinerary.budgetSummary?.total || 0,
          categories: itinerary.categories || [],
          itinerary_data: itinerary,
        })
        .select()
        .single()

      if (error) throw error

      dispatch({ type: USER_ACTIONS.ADD_SAVED_ITINERARY, payload: data })
      toast.success('Itinerary saved!')
      trackEvent('itinerary_saved', {
        destination: itinerary.destination,
        user_id: state.user.id,
      })
      return { data, error: null }
    } catch (error) {
      console.error('Save itinerary error:', error)
      handleApiError(error, 'Failed to save itinerary')
      return { data: null, error }
    }
  }

  const removeItinerary = async (itineraryId) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', itineraryId)
        .eq('user_id', state.user.id)

      if (error) throw error

      dispatch({ type: USER_ACTIONS.REMOVE_SAVED_ITINERARY, payload: itineraryId })
      toast.success('Itinerary removed')
      trackEvent('itinerary_removed', { itinerary_id: itineraryId })
      return { error: null }
    } catch (error) {
      console.error('Remove itinerary error:', error)
      handleApiError(error, 'Failed to remove itinerary')
      return { error }
    }
  }

  // UI methods
  const openAuthModal = (mode = 'signin') => {
    dispatch({ type: USER_ACTIONS.SET_AUTH_MODE, payload: mode })
    dispatch({ type: USER_ACTIONS.SET_AUTH_MODAL, payload: true })
  }

  const closeAuthModal = () => {
    dispatch({ type: USER_ACTIONS.SET_AUTH_MODAL, payload: false })
    dispatch({ type: USER_ACTIONS.CLEAR_ERROR })
  }

  const addRecentSearch = (searchData) => {
    dispatch({ type: USER_ACTIONS.ADD_RECENT_SEARCH, payload: searchData })
  }

  // Context value
  const value = {
    // State
    ...state,
    
    // Auth methods
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    
    // User data methods
    updateProfile,
    updatePreferences,
    saveItinerary,
    removeItinerary,
    
    // UI methods
    openAuthModal,
    closeAuthModal,
    addRecentSearch,
    
    // Utility methods
    clearError: () => dispatch({ type: USER_ACTIONS.CLEAR_ERROR }),
    requireAuth: () => {
      if (!state.isAuthenticated) {
        openAuthModal()
        return false
      }
      return true
    },
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use user context
export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default UserContext 