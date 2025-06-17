import { useMemo } from 'react'
import { motion } from 'framer-motion'
import InteractiveMap from '../InteractiveMap'

export default function TripMap({ itinerary, selectedDay = null }) {
  // Extract all locations from the itinerary
  const locations = useMemo(() => {
    if (!itinerary || !itinerary.days) return []

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
      // Skip if we're showing a specific day and this isn't it
      if (selectedDay !== null && selectedDay !== dayIndex) return

      const addActivity = (activity, timeOfDay) => {
        if (activity && activity.location) {
          allLocations.push({
            id: `${day.dayNumber}-${timeOfDay}`,
            name: activity.activity,
            type: activity.type || 'activity',
            lat: activity.location.lat,
            lng: activity.location.lng,
            time: activity.time,
            dayNumber: day.dayNumber,
            description: activity.description,
            price: activity.cost,
          })
        }
      }

      if (day.morning) addActivity(day.morning, 'morning')
      if (day.afternoon) addActivity(day.afternoon, 'afternoon')
      if (day.evening) addActivity(day.evening, 'evening')
    })

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

      {/* Location List */}
      {locations.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDay !== null ? 'Today\'s Stops' : 'All Locations'}
          </h3>
          
          <div className="space-y-3">
            {locations.map((location, index) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className={`
                  w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center flex-shrink-0
                  ${location.type === 'hotel' ? 'from-purple-500 to-pink-500' :
                    location.type === 'restaurant' ? 'from-red-500 to-yellow-500' :
                    'from-green-500 to-teal-500'}
                `}>
                  <span className="text-lg">
                    {location.type === 'hotel' ? '🏨' :
                     location.type === 'restaurant' ? '🍽️' :
                     '📍'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{location.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                    {location.time && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {location.time}
                      </span>
                    )}
                    {location.dayNumber && (
                      <span>Day {location.dayNumber}</span>
                    )}
                  </div>
                </div>

                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
            ))}
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