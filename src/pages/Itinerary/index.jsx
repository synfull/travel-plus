import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useItinerary, useItineraryState } from '@hooks/useItinerary'
import ItineraryView from '@components/itinerary/ItineraryView'
import ItinerarySkeleton from '@components/itinerary/ItinerarySkeleton'

export default function Itinerary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: itinerary, isLoading, error } = useItinerary(id)
  const {
    selectedDay,
    selectDay,
    shareItinerary,
    downloadItinerary,
  } = useItineraryState()

  const [activeView, setActiveView] = useState('overview') // 'overview' | 'day' | 'budget'

  if (isLoading) {
    return <ItinerarySkeleton />
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Itinerary Not Found</h2>
          <p className="text-white/60 mb-6">
            We couldn't find this itinerary. It may have been removed or the link is incorrect.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/plan')}
            className="gradient-button"
          >
            Plan New Trip
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-dark-900/80 backdrop-blur-md">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </motion.button>

            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="hidden md:flex items-center gap-2 p-1 glass rounded-lg">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeView === 'overview'
                      ? 'bg-gradient-primary text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('day')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeView === 'day'
                      ? 'bg-gradient-primary text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Day by Day
                </button>
                <button
                  onClick={() => setActiveView('budget')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    activeView === 'budget'
                      ? 'bg-gradient-primary text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Budget
                </button>
              </div>

              {/* Actions */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => shareItinerary('copy')}
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                title="Share itinerary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.432 0m5.432 0a3 3 0 01-5.432 0M6.684 16.342a3 3 0 100 0" />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadItinerary}
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                title="Download itinerary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image (placeholder) */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-900/50 to-dark-900" />
          <img
            src={`https://source.unsplash.com/1600x400/?${itinerary.destination},travel`}
            alt={itinerary.destination}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 container-custom py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {itinerary.title || `Your ${itinerary.destination} Adventure`}
            </h1>
            <p className="text-xl text-white/80 mb-6">
              {itinerary.overview}
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{itinerary.days?.length || 0} Days</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{itinerary.people || 2} Travelers</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${itinerary.budgetSummary?.total || 0} Total</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile View Toggle */}
      <div className="md:hidden sticky top-[73px] z-30 bg-dark-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container-custom py-2">
          <div className="flex items-center gap-2 p-1 glass rounded-lg">
            <button
              onClick={() => setActiveView('overview')}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${
                activeView === 'overview'
                  ? 'bg-gradient-primary text-white'
                  : 'text-white/70'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('day')}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${
                activeView === 'day'
                  ? 'bg-gradient-primary text-white'
                  : 'text-white/70'
              }`}
            >
              Day by Day
            </button>
            <button
              onClick={() => setActiveView('budget')}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${
                activeView === 'budget'
                  ? 'bg-gradient-primary text-white'
                  : 'text-white/70'
              }`}
            >
              Budget
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-custom py-8">
        <ItineraryView
          itinerary={itinerary}
          activeView={activeView}
          selectedDay={selectedDay}
          onDaySelect={selectDay}
        />
      </main>
    </div>
  )
}