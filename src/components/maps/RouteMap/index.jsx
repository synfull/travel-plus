import { useEffect, useState, useCallback } from 'react'
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api'
import { motion } from 'framer-motion'
import { API_CONFIG } from '@services/api/config'

const libraries = ['places', 'geometry']

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
  ],
}

export default function RouteMap({ dayActivities, travelMode = 'DRIVING' }) {
  const [directions, setDirections] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [selectedMode, setSelectedMode] = useState(travelMode)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_CONFIG.GOOGLE_MAPS.API_KEY,
    libraries,
  })

  const calculateRoute = useCallback(() => {
    if (!isLoaded || !dayActivities || dayActivities.length < 2) return

    const directionsService = new window.google.maps.DirectionsService()

    // Create waypoints from activities (excluding first and last)
    const waypoints = dayActivities.slice(1, -1).map(activity => ({
      location: { lat: activity.lat, lng: activity.lng },
      stopover: true,
    }))

    const request = {
      origin: { lat: dayActivities[0].lat, lng: dayActivities[0].lng },
      destination: { 
        lat: dayActivities[dayActivities.length - 1].lat, 
        lng: dayActivities[dayActivities.length - 1].lng 
      },
      waypoints,
      travelMode: window.google.maps.TravelMode[selectedMode],
      optimizeWaypoints: true,
    }

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        setDirections(result)

        // Calculate total distance and duration
        let totalDistance = 0
        let totalDuration = 0

        result.routes[0].legs.forEach(leg => {
          totalDistance += leg.distance.value
          totalDuration += leg.duration.value
        })

        setRouteInfo({
          distance: (totalDistance / 1000).toFixed(1) + ' km',
          duration: Math.ceil(totalDuration / 60) + ' min',
          legs: result.routes[0].legs.map(leg => ({
            distance: leg.distance.text,
            duration: leg.duration.text,
            start: leg.start_address,
            end: leg.end_address,
          })),
        })
      }
    })
  }, [isLoaded, dayActivities, selectedMode])

  useEffect(() => {
    calculateRoute()
  }, [calculateRoute])

  if (!isLoaded) {
    return (
      <div className="glass-card animate-pulse h-96">
        <div className="w-full h-full bg-white/5 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Route Info Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Today's Route</h3>

          {/* Travel Mode Selector */}
          <div className="flex gap-2">
            {['DRIVING', 'WALKING', 'TRANSIT'].map(mode => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMode(mode)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${selectedMode === mode 
                    ? 'bg-gradient-primary text-white' 
                    : 'glass hover:bg-white/10'
                  }
                `}
              >
                {mode === 'DRIVING' && '🚗'}
                {mode === 'WALKING' && '🚶'}
                {mode === 'TRANSIT' && '🚌'}
                <span className="ml-1 capitalize">{mode.toLowerCase()}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Route Summary */}
        {routeInfo && (
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-white/60">Total Distance</p>
              <p className="text-xl font-semibold">{routeInfo.distance}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Total Time</p>
              <p className="text-xl font-semibold">{routeInfo.duration}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Stops</p>
              <p className="text-xl font-semibold">{dayActivities.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden h-96">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          options={mapOptions}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: '#6366f1',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
                markerOptions: {
                  icon: {
                    url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(`
                      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="18" fill="#6366f1" stroke="white" stroke-width="3"/>
                        <text x="20" y="26" text-anchor="middle" fill="white" font-size="20" font-weight="bold">📍</text>
                      </svg>
                    `),
                    scaledSize: new window.google.maps.Size(40, 40),
                  },
                },
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Step by Step Directions */}
      {routeInfo && routeInfo.legs && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Step by Step</h3>

          <div className="space-y-3">
            {dayActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{activity.name}</h4>
                  {activity.time && (
                    <p className="text-sm text-white/60">{activity.time}</p>
                  )}
                  
                  {index < routeInfo.legs.length && (
                    <div className="mt-2 p-3 rounded-lg bg-white/5 text-sm">
                      <p className="text-white/60">
                        → {routeInfo.legs[index].distance} ({routeInfo.legs[index].duration})
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}