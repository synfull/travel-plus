import { useMemo } from 'react'
import { motion } from 'framer-motion'
import InteractiveMap from '../InteractiveMap'

export default function TripMap({ itinerary, selectedDay = null }) {
  // Extract all locations from the itinerary
  const locations = useMemo(() => {
    if (!itinerary || !itinerary.days) return []

    console.log('🗺️ TripMap received itinerary:', itinerary)
    console.log('🗺️ Days data:', itinerary.days)

    const allLocations = []
    
    // Add hotel location if available
    if (itinerary.hotel) {
      allLocations.push({
        id: 'hotel',
        name: itinerary.hotel.name || 'Your Hotel',
        type: 'hotel',
        lat: itinerary.hotel.lat || 0,
        lng: itinerary.hotel.lng || 0,
        description: itinerary.hotel.address,
      })
    }

    // Add locations from each day
    itinerary.days.forEach((day, dayIndex) => {
      console.log(`🗓️ Processing day ${dayIndex + 1}:`, day)
      
      // Skip if we're showing a specific day and this isn't it
      if (selectedDay !== null && selectedDay !== dayIndex) return

      const addActivity = (activity, timeOfDay) => {
        console.log(`⏰ Processing ${timeOfDay} activity:`, activity)
        
        if (activity && activity.location) {
          const locationData = {
            id: `${day.dayNumber}-${timeOfDay}`,
            name: activity.activity,
            type: activity.type || 'activity',
            lat: activity.location.lat,
            lng: activity.location.lng,
            time: activity.time,
            dayNumber: day.dayNumber,
            description: activity.description,
            price: activity.estimatedCost || activity.cost, // Fix property name
          }
          
          console.log('📍 Adding location:', locationData)
          allLocations.push(locationData)
        } else {
          console.log(`❌ No location data for ${timeOfDay} activity:`, activity)
        }
      }

      if (day.morning) addActivity(day.morning, 'morning')
      if (day.afternoon) addActivity(day.afternoon, 'afternoon')
      if (day.evening) addActivity(day.evening, 'evening')
    })

    console.log('🎯 Final locations array:', allLocations)
    return allLocations
  }, [itinerary, selectedDay])

  // Calculate center based on locations
  const mapCenter = useMemo(() => {
    if (locations.length === 0) {
      // Default to destination coordinates if available
      return itinerary?.destination?.coordinates || { lat: 0, lng: 0 }
    }

    // Calculate average of all locations
    const sumLat = locations.reduce((sum, loc) => sum + loc.lat, 0)
    const sumLng = locations.reduce((sum, loc) => sum + loc.lng, 0)
    
    return {
      lat: sumLat / locations.length,
      lng: sumLng / locations.length,
    }
  }, [locations, itinerary])

  if (!itinerary) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white/60">No itinerary data available</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Map Header */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🗺️</span>
          <span>
            {selectedDay !== null 
              ? `Day ${itinerary.days[selectedDay].dayNumber} Map` 
              : 'Trip Overview Map'
            }
          </span>
        </h2>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="text-white/70">Hotel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-teal-500" />
            <span className="text-white/70">Activities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-yellow-500" />
            <span className="text-white/70">Dining</span>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <InteractiveMap
        locations={locations}
        center={mapCenter}
        zoom={selectedDay !== null ? 14 : 12}
        height="500px"
        onLocationClick={(location) => {
          console.log('Clicked location:', location)
          // You can add navigation or info display here
        }}
      />

      {/* Activity Details */}
      {locations.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDay !== null ? 'Today\'s Activities' : 'All Activities & Locations'}
          </h3>
          
          <div className="space-y-4">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center flex-shrink-0
                    ${location.type === 'hotel' ? 'from-purple-500 to-pink-500' :
                      location.type === 'dining' ? 'from-red-500 to-yellow-500' :
                      location.type === 'culture' ? 'from-blue-500 to-purple-500' :
                      'from-green-500 to-teal-500'}
                  `}>
                    <span className="text-2xl">
                      {location.type === 'hotel' ? '🏨' :
                       location.type === 'dining' ? '🍽️' :
                       location.type === 'culture' ? '🎭' :
                       location.type === 'sightseeing' ? '🏛️' :
                       '📍'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{location.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                          {location.time && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{location.time}</span>
                            </div>
                          )}
                          {location.dayNumber && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                              Day {location.dayNumber}
                            </span>
                          )}
                          {location.type && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs capitalize">
                              {location.type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {location.price && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-400">
                            ${location.price}
                          </div>
                          <div className="text-xs text-white/60">per person</div>
                        </div>
                      )}
                    </div>
                    
                    {location.description && (
                      <p className="text-white/80 text-sm mb-3 leading-relaxed">
                        {location.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const query = `${location.lat},${location.lng}`
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
                        }}
                        className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        View on Map
                      </motion.button>
                      
                      {location.type === 'dining' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-sm px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Make Reservation
                        </motion.button>
                      )}
                      
                      {(location.type === 'sightseeing' || location.type === 'culture') && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-sm px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          Book Tickets
                        </motion.button>
                      )}
                      
                      {location.price && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-sm px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 11h8" />
                          </svg>
                          Add to Budget
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary-400">Total Activities</h4>
                <p className="text-sm text-white/60">{locations.length} locations planned</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-400">
                  ${locations.reduce((sum, loc) => sum + (loc.price || 0), 0)}
                </div>
                <p className="text-sm text-white/60">estimated cost</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Locations Message */}
      {locations.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h3 className="text-lg font-semibold mb-2">No Locations Yet</h3>
          <p className="text-white/60 text-sm">
            Location data will appear here once your itinerary includes specific locations.
          </p>
        </div>
      )}
    </motion.div>
  )
}