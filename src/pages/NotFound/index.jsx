import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20 
          }}
          className="text-8xl md:text-9xl font-bold mb-8"
        >
          <span className="gradient-text">404</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          Lost in Transit?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-white/70 mb-8"
        >
          Looks like this page took a detour. Let's get you back on track!
        </motion.p>

        {/* Fun travel icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 text-4xl mb-8"
        >
          <span className="animate-float" style={{ animationDelay: '0s' }}>✈️</span>
          <span className="animate-float" style={{ animationDelay: '0.2s' }}>🗺️</span>
          <span className="animate-float" style={{ animationDelay: '0.4s' }}>🧳</span>
          <span className="animate-float" style={{ animationDelay: '0.6s' }}>🏝️</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="gradient-button"
          >
            Go Home
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/plan')}
            className="glass-button"
          >
            Plan a Trip
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="glass-button"
          >
            Go Back
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}