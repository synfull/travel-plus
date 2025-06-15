import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DestinationSearch from '@components/forms/TripInputForm/DestinationSearch'

export default function Home() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')

  const handleGetStarted = () => {
    if (destination) {
      // Navigate to plan page with destination
      navigate('/plan', { state: { destination } })
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Content */}
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="w-24 h-24 mx-auto mb-8"
            >
              <div className="w-full h-full rounded-3xl bg-gradient-primary shadow-neon flex items-center justify-center">
                <span className="text-4xl font-bold text-white">T+</span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="gradient-text">AI-Powered</span>
              <br />
              <span className="text-white">Travel Planning</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto"
            >
              Create personalized itineraries with flights, hotels, and unique local experiences - all within your budget
            </motion.p>

            {/* Search Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card p-8">
                <h2 className="text-2xl font-semibold mb-6">Where do you want to go?</h2>
                
                <DestinationSearch
                  value={destination}
                  onChange={setDestination}
                  onEnter={handleGetStarted}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetStarted}
                  className="gradient-button w-full mt-6 text-lg"
                  disabled={!destination}
                >
                  Start Planning My Trip
                </motion.button>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <FeatureCard
                icon="🎯"
                title="Budget Optimized"
                description="Stay within budget while maximizing experiences"
              />
              <FeatureCard
                icon="🤖"
                title="AI-Powered"
                description="Discover hidden gems and local favorites"
              />
              <FeatureCard
                icon="🎫"
                title="Book Direct"
                description="Seamless booking with trusted partners"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 text-white/50"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </motion.div>
      </section>

      {/* How it works section (placeholder for now) */}
      <section className="py-20 px-4">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="gradient-text">How It Works</span>
          </h2>
          {/* Add content here later */}
        </div>
      </section>
    </div>
  )
}

// Feature card component
function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card text-center"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </motion.div>
  )
} 