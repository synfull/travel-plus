import { useState } from 'react'
import { OverlayView } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'

export default function MapPin({ position, location, onClick }) {
  const [isHovered, setIsHovered] = useState(false)

  const getPinColor = () => {
    switch (location.type) {
      case 'hotel':
        return 'from-purple-500 to-pink-500'
      case 'flight':
        return 'from-blue-500 to-cyan-500'
      case 'activity':
        return 'from-green-500 to-teal-500'
      case 'restaurant':
        return 'from-red-500 to-yellow-500'
      default:
        return 'from-primary-500 to-purple-500'
    }
  }

  const getPinIcon = () => {
    switch (location.type) {
      case 'hotel':
        return '🏨'
      case 'flight':
        return '✈️'
      case 'activity':
        return '🎫'
      case 'restaurant':
        return '🍽️'
      case 'beach':
        return '🏖️'
      case 'museum':
        return '🏛️'
      case 'shopping':
        return '🛍️'
      case 'nightlife':
        return '🍺'
      default:
        return '📍'
    }
  }

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-dark-800 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                <p className="font-semibold text-sm">{location.name}</p>
                {location.time && (
                  <p className="text-xs text-white/70">{location.time}</p>
                )}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-dark-800" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`
            relative w-12 h-12 rounded-full bg-gradient-to-r ${getPinColor()}
            shadow-lg flex items-center justify-center transform -translate-y-6
            ${isHovered ? 'shadow-neon' : ''}
          `}
        >
          {/* Pin tail */}
          <div
            className={`
              absolute top-full left-1/2 transform -translate-x-1/2 -mt-1
              w-0 h-0 border-l-[8px] border-l-transparent 
              border-r-[8px] border-r-transparent border-t-[12px]
            `}
            style={{
              borderTopColor: location.type === 'hotel' ? '#ec4899' : 
                              location.type === 'flight' ? '#06b6d4' :
                              location.type === 'activity' ? '#14b8a6' :
                              '#8b5cf6'
            }}
          />
          
          {/* Icon */}
          <span className="text-xl">{getPinIcon()}</span>
          
          {/* Pulse animation for current location */}
          {location.isCurrent && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{
                  scale: [1, 1.5, 1.5],
                  opacity: [0.5, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-white/20"
                animate={{
                  scale: [1, 1.3, 1.3],
                  opacity: [0.3, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
              />
            </>
          )}
        </motion.div>

        {/* Day number badge */}
        {location.dayNumber && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark-900 border-2 border-white flex items-center justify-center">
            <span className="text-xs font-bold">{location.dayNumber}</span>
          </div>
        )}
      </div>
    </OverlayView>
  )
}