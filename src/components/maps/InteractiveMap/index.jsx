import { useState, useCallback, memo } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { motion } from 'framer-motion'
import MapPin from '../MapPin'
import OfflineMapToggle from '../OfflineMapToggle'
import { API_CONFIG } from '@services/api/config'

// Map libraries to load
const libraries = ['places', 'geometry']

// Custom map styles for dark theme
const mapStyles = [
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
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
]

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
}

function InteractiveMap({ locations = [], center, zoom = 13, height = '400px', onLocationClick }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [map, setMap] = useState(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_CONFIG.GOOGLE_MAPS.API_KEY,
    libraries,
  })

  const onLoad = useCallback((map) => {
    setMap(map)
    
    // Fit bounds to show all markers
    if (locations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      locations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng })
      })
      map.fitBounds(bounds)
    }
  }, [locations])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMarkerClick = (location) => {
    setSelectedLocation(location)
    if (onLocationClick) {
      onLocationClick(location)
    }
  }

  if (loadError) {
    return (
      <div className="glass-card p-8 text-center" style={{ height }}>
        <div className="text-4xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold mb-2">Unable to load map</h3>
        <p className="text-white/60 text-sm">
          Please check your internet connection and try again.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="glass-card animate-pulse" style={{ height }}>
        <div className="w-full h-full bg-white/5 rounded-xl" />
      </div>
    )
  }

  // Default center (if not provided)
  const mapCenter = center || (locations[0] ? { lat: locations[0].lat, lng: locations[0].lng } : { lat: 0, lng: 0 })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative glass-card overflow-hidden"
      style={{ height }}
    >
      {/* Offline Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <OfflineMapToggle
          isOffline={isOfflineMode}
          onToggle={setIsOfflineMode}
        />
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 z-10 space-y-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => map?.panTo(mapCenter)}
          className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
          title="Center map"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.button>

        {locations.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (map && locations.length > 1) {
                const bounds = new window.google.maps.LatLngBounds()
                locations.forEach(location => {
                  bounds.extend({ lat: location.lat, lng: location.lng })
                })
                map.fitBounds(bounds)
              }
            }}
            className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
            title="Fit all markers"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Markers */}
        {locations.map((location, index) => (
          <MapPin
            key={location.id || index}
            position={{ lat: location.lat, lng: location.lng }}
            location={location}
            onClick={() => handleMarkerClick(location)}
          />
        ))}

        {/* Info Window */}
        {selectedLocation && (
          <InfoWindow
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={() => setSelectedLocation(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -40),
            }}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedLocation.name}
              </h3>
              {selectedLocation.type && (
                <p className="text-sm text-gray-600 mb-2">
                  {selectedLocation.type}
                </p>
              )}
              {selectedLocation.description && (
                <p className="text-sm text-gray-700 mb-2">
                  {selectedLocation.description}
                </p>
              )}
              {selectedLocation.time && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Time:</span> {selectedLocation.time}
                </p>
              )}
              {selectedLocation.price && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Price:</span> ${selectedLocation.price}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Offline Mode Overlay */}
      {isOfflineMode && (
        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📵</div>
            <h3 className="text-lg font-semibold mb-2">Offline Map</h3>
            <p className="text-white/60 text-sm">
              Download map for offline use coming soon
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default memo(InteractiveMap)