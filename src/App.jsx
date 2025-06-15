import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'

// Pages (we'll create these next)
import Home from '@pages/Home'
// import PlanTrip from '@pages/PlanTrip'
// import Itinerary from '@pages/Itinerary'
// import About from '@pages/About'
// import NotFound from '@pages/NotFound'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <AppLoader />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-dark-900">
          {/* Background decoration */}
          <div className="fixed inset-0 bg-gradient-mesh opacity-30" />
          
          {/* Main content */}
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* <Route path="/plan" element={<PlanTrip />} />
              <Route path="/itinerary/:id" element={<Itinerary />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} /> */}
            </Routes>
          </div>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

// Loading component
function AppLoader() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Animated logo */}
          <div className="w-20 h-20 mx-auto mb-8">
            <div className="w-full h-full rounded-2xl bg-gradient-primary animate-pulse shadow-neon" />
          </div>
          
          {/* Loading text */}
          <h1 className="text-2xl font-bold gradient-text mb-2">Travel+</h1>
          <p className="text-white/60 text-sm">Preparing your journey...</p>
          
          {/* Loading dots */}
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 