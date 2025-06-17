import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const OfflineIndicator = ({ isOnline }) => {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
            You are currently offline. Some features may be limited.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineIndicator 