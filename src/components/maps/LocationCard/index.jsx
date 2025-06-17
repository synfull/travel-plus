import { motion } from 'framer-motion'
import { useState } from 'react'
import InteractiveMap from '../InteractiveMap'

export default function LocationCard({ location, showMap = true }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getLocationIcon = () => {
    switch (location.type) {
      case 'hotel': return '🏨'
      case 'restaurant': return '🍽️'
      case 'beach': return '🏖️'
      case 'museum': return '🏛️'
      case 'shopping': return '🛍️'
      case 'nightlife': return '🍺'
      case 'activity': return '🎫'
      default: return '📍'
    }
  }

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden"
    >
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{getLocationIcon()}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{location.name}</h3>
              
              {location.address && (
                <p className="text-sm text-white/60 mb-2">{location.address}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm">
                {location.time && (
                  <div className="flex items-center gap-1 text-white/60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{location.time}</span>
                  </div>
                )}
                
                {location.duration && (
                  <div className="flex items-center gap-1 text-white/60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{location.duration}</span>
                  </div>
                )}
                
                {location.price && (
                  <div className="flex items-center gap-1 text-white/60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>${location.price}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-3"
          >
            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-white/10"
        >
          {location.description && (
            <div className="p-6 pt-4">
              <p className="text-white/80">{location.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-6 flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Open in Google Maps
                const query = location.address || location.name
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
              }}
              className="glass-button text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </motion.button>

            {location.phone && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = `tel:${location.phone}`}
                className="glass-button text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </motion.button>
            )}

            {location.website && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(location.website, '_blank')}
                className="glass-button text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Website
              </motion.button>
            )}
          </div>

          {/* Mini Map */}
          {showMap && location.lat && location.lng && (
            <div className="h-48">
              <InteractiveMap
                locations={[location]}
                center={{ lat: location.lat, lng: location.lng }}
                zoom={15}
                height="192px"
              />
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}