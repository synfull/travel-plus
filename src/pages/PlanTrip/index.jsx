import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import TripInputForm from '@components/forms/TripInputForm'
import { useGenerateItinerary } from '@hooks/useItinerary'

export default function PlanTrip() {
  const location = useLocation()
  const navigate = useNavigate()
  const generateItinerary = useGenerateItinerary()

  // Get destination from navigation state if coming from home
  const initialDestination = location.state?.destination || ''

  const handleSubmit = async (formData) => {
    generateItinerary.mutate(formData)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-dark-900/50 backdrop-blur-md">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </motion.button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">T+</span>
              </div>
              <span className="font-semibold gradient-text">Travel+</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 py-12 px-4">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Page title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Plan Your Perfect Trip</span>
              </h1>
              <p className="text-xl text-white/70">
                Tell us about your dream vacation and we'll handle the rest
              </p>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="text-sm text-white/70">Trip Details</span>
                </div>
                <div className="w-16 h-0.5 bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white/50">
                    2
                  </div>
                  <span className="text-sm text-white/50">Your Itinerary</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <TripInputForm
              initialDestination={initialDestination}
              onSubmit={handleSubmit}
              isLoading={generateItinerary.isPending}
            />
          </motion.div>
        </div>
      </main>

      {/* Loading overlay */}
      {generateItinerary.isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="relative mb-8">
              {/* Animated circles */}
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary-500/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary-500/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              />
              
              {/* Center icon */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  ✈️
                </motion.div>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">Creating Your Itinerary</h2>
            <p className="text-white/60">Our AI is finding the best experiences for you...</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}