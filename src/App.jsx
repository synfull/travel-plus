import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Pages
import Home from '@pages/Home'
import PlanTrip from '@pages/PlanTrip'
import Itinerary from '@pages/Itinerary'
import About from '@pages/About'
import NotFound from '@pages/NotFound'

// PWA Components
import InstallPrompt from '@components/common/InstallPrompt'
import OfflineIndicator from '@components/common/OfflineIndicator'
import ErrorBoundary from '@components/common/ErrorBoundary'

// Contexts
import { TripProvider } from '@contexts/TripContext'
import { UserProvider, useUser } from '@contexts/UserContext'

// Create a client for React Query with optimized settings for Travel+
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - good for travel data
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
    },
    mutations: {
      retry: 1,
    },
  },
})

// Main App component that waits for user context to load
function AppContent() {
  const { isLoading: userLoading } = useUser()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show loading screen while user context is loading
  if (userLoading) {
    return <AppLoader />
  }

  return (
    <TripProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* PWA Components */}
          <OfflineIndicator isOnline={isOnline} />
          <InstallPrompt />
          
          {/* Animated background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* Main content */}
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/plan" element={<PlanTrip />} />
                <Route path="/itinerary/:id" element={<Itinerary />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </div>

          {/* Toast notifications with glassmorphic styling */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#6366f1',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </TripProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

// Enhanced loading component with Travel+ branding
function AppLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Animated logo with Travel+ styling */}
          <div className="w-20 h-20 mx-auto mb-8 relative">
            <motion.div
              className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(99, 102, 241, 0.5)',
                  '0 0 40px rgba(99, 102, 241, 0.8)',
                  '0 0 20px rgba(99, 102, 241, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Plus icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-white text-2xl font-bold"
                animate={{ rotate: [0, 90, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                +
              </motion.div>
            </div>
          </div>
          
          {/* Loading text with gradient */}
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Travel+
          </motion.h1>
          
          <motion.p
            className="text-white/60 text-sm mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Crafting your perfect journey...
          </motion.p>
          
          {/* Loading dots with staggered animation */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  y: [-8, 0, -8],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default App