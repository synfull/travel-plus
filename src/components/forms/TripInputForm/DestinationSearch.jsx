import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Mock destinations for now - will be replaced with Google Places API
const POPULAR_DESTINATIONS = [
  { id: 1, city: 'Cancun', country: 'Mexico', emoji: '🏖️' },
  { id: 2, city: 'Paris', country: 'France', emoji: '🗼' },
  { id: 3, city: 'Tokyo', country: 'Japan', emoji: '🗾' },
  { id: 4, city: 'Barcelona', country: 'Spain', emoji: '🏛️' },
  { id: 5, city: 'New York', country: 'USA', emoji: '🗽' },
  { id: 6, city: 'Bali', country: 'Indonesia', emoji: '🌴' },
  { id: 7, city: 'London', country: 'UK', emoji: '💂' },
  { id: 8, city: 'Dubai', country: 'UAE', emoji: '🌆' },
]

export default function DestinationSearch({ value, onChange, onEnter }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const [filteredDestinations, setFilteredDestinations] = useState([])
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter destinations based on search
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredDestinations(filtered)
      setIsOpen(filtered.length > 0)
    } else {
      setFilteredDestinations(POPULAR_DESTINATIONS)
      setIsOpen(false)
    }
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (destination) => {
    const fullName = `${destination.city}, ${destination.country}`
    setSearchTerm(fullName)
    onChange(fullName)
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onChange(value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm) {
      onEnter && onEnter()
    }
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search destinations..."
          className="glass-input pr-12 text-lg"
          autoComplete="off"
        />
        
        {/* Search Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2"
          >
            <div className="glass-card p-2 max-h-80 overflow-y-auto">
              {filteredDestinations.length > 0 ? (
                <>
                  {searchTerm.length === 0 && (
                    <p className="text-xs text-white/50 px-3 py-2">Popular destinations</p>
                  )}
                  {filteredDestinations.map((destination) => (
                    <DestinationItem
                      key={destination.id}
                      destination={destination}
                      onSelect={handleSelect}
                      isActive={searchTerm.toLowerCase().includes(destination.city.toLowerCase())}
                    />
                  ))}
                </>
              ) : (
                <div className="px-3 py-4 text-center text-white/50">
                  No destinations found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular destinations chips (shown when input is empty) */}
      {!searchTerm && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <p className="text-sm text-white/50 mb-3">Popular destinations</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => (
              <motion.button
                key={dest.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(dest)}
                className="category-chip text-sm"
              >
                <span>{dest.emoji}</span>
                <span>{dest.city}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Destination item component
function DestinationItem({ destination, onSelect, isActive }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => onSelect(destination)}
      className={`
        w-full text-left px-3 py-3 rounded-lg transition-colors
        ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{destination.emoji}</span>
        <div>
          <p className="font-medium">{destination.city}</p>
          <p className="text-sm text-white/60">{destination.country}</p>
        </div>
      </div>
    </motion.button>
  )
} 