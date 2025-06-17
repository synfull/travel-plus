import { motion } from 'framer-motion'
import { useState } from 'react'

export default function OfflineMapToggle({ isOffline, onToggle }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          p-3 rounded-lg transition-all
          ${isOffline 
            ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-neon' 
            : 'glass hover:bg-white/20'
          }
        `}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isOffline ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
            />
          ) : (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
            />
          )}
        </svg>
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 z-50"
        >
          <div className="bg-dark-800 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm">
            {isOffline ? 'Online Mode' : 'Offline Mode'}
          </div>
          <div className="absolute bottom-full right-4 transform translate-y-1">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-dark-800" />
          </div>
        </motion.div>
      )}
    </div>
  )
}