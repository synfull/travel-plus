import { motion } from 'framer-motion'
import { useState } from 'react'
import { formatPrice } from '@utils/formatters'
import StarRating from '@components/common/StarRating'

export default function HotelCard({ hotel, onBook, className = '' }) {
  const [showDetails, setShowDetails] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!hotel) return null

  const {
    name,
    rating,
    price,
    currency = 'USD',
    location,
    address,
    amenities = [],
    images = [],
    room,
    policies,
    bookingUrl,
    distance,
    source
  } = hotel

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const getLocationIcon = () => {
    if (location?.toLowerCase().includes('beach')) return '🏖️'
    if (location?.toLowerCase().includes('center') || location?.toLowerCase().includes('downtown')) return '🏙️'
    if (location?.toLowerCase().includes('airport')) return '✈️'
    return '📍'
  }

  const formatAmenities = (amenities) => {
    const amenityIcons = {
      'Pool': '🏊‍♂️',
      'Free WiFi': '📶',
      'WiFi': '📶',
      'Breakfast': '🍳',
      'Gym': '💪',
      'Fitness': '💪',
      'Spa': '🧘‍♀️',
      'Restaurant': '🍽️',
      'Bar': '🍸',
      'Beach Access': '🏖️',
      'Parking': '🚗',
      'Business Center': '💼',
      'Concierge': '🛎️',
      'Room Service': '🛏️',
      'Laundry': '👕',
      'Air Conditioning': '❄️',
      'Pet Friendly': '🐕'
    }

    return amenities.slice(0, 6).map(amenity => ({
      name: amenity,
      icon: amenityIcons[amenity] || '✨'
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${className}`}
    >
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={images[currentImageIndex]}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=Hotel+Image'
            }}
          />
          
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ›
              </button>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
            
            <div className="flex items-center space-x-4 mb-2">
              {rating && (
                <div className="flex items-center space-x-1">
                  <StarRating rating={rating} size="sm" />
                  <span className="text-sm text-gray-300">({rating})</span>
                </div>
              )}
              
              {distance && (
                <div className="text-sm text-gray-400">
                  📍 {distance}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <span>{getLocationIcon()}</span>
              <span>{location}</span>
            </div>
            
            {address && (
              <p className="text-xs text-gray-400 mt-1">{address}</p>
            )}
          </div>
          
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-white">
              {formatPrice(price, currency)}
            </div>
            <p className="text-sm text-gray-300">per night</p>
          </div>
        </div>

        {/* Room Info */}
        {room && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-1">{room.type}</h4>
            {room.description && (
              <p className="text-xs text-gray-300">{room.description}</p>
            )}
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {formatAmenities(amenities).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded-full"
                >
                  <span>{amenity.icon}</span>
                  <span>{amenity.name}</span>
                </span>
              ))}
              {amenities.length > 6 && (
                <span className="text-xs text-gray-400">
                  +{amenities.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Policies Preview */}
        {policies && (
          <div className="mb-4 text-sm">
            <div className="flex items-center justify-between text-gray-300">
              <span>Check-in: {policies.checkIn || '15:00'}</span>
              <span>Check-out: {policies.checkOut || '11:00'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-800/50 border-t border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBook?.(hotel)}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            Book Hotel 🏨
          </motion.button>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10 space-y-4"
          >
            {/* Contact Information */}
            {hotel.contact && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  {hotel.contact.phone && (
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white ml-2">{hotel.contact.phone}</span>
                    </div>
                  )}
                  {hotel.contact.email && (
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white ml-2">{hotel.contact.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Policies */}
            {policies && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Policies</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-400">Check-in:</span>
                    <span className="text-white ml-2">{policies.checkIn || '15:00'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Check-out:</span>
                    <span className="text-white ml-2">{policies.checkOut || '11:00'}</span>
                  </div>
                  {policies.cancellation && (
                    <div>
                      <span className="text-gray-400">Cancellation:</span>
                      <span className="text-white ml-2">{policies.cancellation}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Amenities */}
            {amenities.length > 6 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">All Amenities</h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="text-gray-300">
                      • {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {source && (
              <div className="text-xs text-gray-500">
                Source: {source === 'amadeus' ? 'Amadeus API' : 'Fallback Data'}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 