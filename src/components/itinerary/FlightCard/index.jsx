import { motion } from 'framer-motion'
import { useState } from 'react'
import { formatTime, formatDuration, formatPrice } from '@utils/formatters'

export default function FlightCard({ flight, onBook, className = '' }) {
  const [showDetails, setShowDetails] = useState(false)

  if (!flight) return null

  const { outbound, return: returnFlight, totalPrice, currency = 'USD', bookingUrl } = flight

  const formatFlightTime = (timeString) => {
    if (!timeString) return ''
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  const getAirlineIcon = (airline) => {
    // Simple airline icon mapping
    const icons = {
      'American Airlines': '🇺🇸',
      'Delta': '🔺',
      'United': '🌐',
      'Southwest': '💙',
      'JetBlue': '💫',
      default: '✈️'
    }
    return icons[airline] || icons.default
  }

  const getStopsText = (stops) => {
    if (stops === 0) return 'Direct'
    if (stops === 1) return '1 Stop'
    return `${stops} Stops`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getAirlineIcon(outbound?.airline)}</div>
            <div>
              <h3 className="font-semibold text-white">{outbound?.airline}</h3>
              <p className="text-sm text-gray-300">{outbound?.flightNumber}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatPrice(totalPrice, currency)}
            </div>
            <p className="text-sm text-gray-300">Total for all passengers</p>
          </div>
        </div>

        {/* Outbound Flight */}
        {outbound && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {formatFlightTime(outbound.departure)}
                </div>
                <div className="text-sm text-gray-300">{outbound.departureAirport}</div>
              </div>
              
              <div className="flex-1 mx-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1"></div>
                  <div className="text-xs text-gray-300 bg-slate-800 px-2 py-1 rounded-full">
                    {getStopsText(outbound.stops)}
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1"></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {outbound.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {formatFlightTime(outbound.arrival)}
                </div>
                <div className="text-sm text-gray-300">{outbound.arrivalAirport}</div>
              </div>
            </div>
          </div>
        )}

        {/* Return Flight */}
        {returnFlight && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {formatFlightTime(returnFlight.departure)}
                </div>
                <div className="text-sm text-gray-300">{returnFlight.departureAirport}</div>
              </div>
              
              <div className="flex-1 mx-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent flex-1"></div>
                  <div className="text-xs text-gray-300 bg-slate-800 px-2 py-1 rounded-full">
                    {getStopsText(returnFlight.stops)}
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent flex-1"></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {returnFlight.duration?.replace('PT', '').replace('H', 'h ').replace('M', 'm')}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {formatFlightTime(returnFlight.arrival)}
                </div>
                <div className="text-sm text-gray-300">{returnFlight.arrivalAirport}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBook?.(flight)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
          >
            Book Flight ✈️
          </motion.button>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10 space-y-3"
          >
            {outbound && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Outbound Flight Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Flight:</span>
                    <span className="text-white ml-2">{outbound.flightNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Aircraft:</span>
                    <span className="text-white ml-2">{outbound.aircraft || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Departure Terminal:</span>
                    <span className="text-white ml-2">{outbound.terminal || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Class:</span>
                    <span className="text-white ml-2">{flight.bookingClass || 'Economy'}</span>
                  </div>
                </div>
              </div>
            )}

            {returnFlight && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Return Flight Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Flight:</span>
                    <span className="text-white ml-2">{returnFlight.flightNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Aircraft:</span>
                    <span className="text-white ml-2">{returnFlight.aircraft || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Departure Terminal:</span>
                    <span className="text-white ml-2">{returnFlight.terminal || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Class:</span>
                    <span className="text-white ml-2">{flight.bookingClass || 'Economy'}</span>
                  </div>
                </div>
              </div>
            )}

            {flight.lastTicketingDate && (
              <div className="text-sm">
                <span className="text-gray-400">Last Ticketing Date:</span>
                <span className="text-yellow-400 ml-2">
                  {new Date(flight.lastTicketingDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {flight.source && (
              <div className="text-xs text-gray-500">
                Source: {flight.source === 'amadeus' ? 'Amadeus API' : 'Fallback Data'}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 