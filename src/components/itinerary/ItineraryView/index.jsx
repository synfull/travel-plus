import { motion, AnimatePresence } from 'framer-motion'
import DayCard from '../DayCard'
import CostBreakdown from '../CostBreakdown'
import BookingButton from '../BookingButton'
import ExcursionCard from '../ExcursionCard'
import TripMap from '../../maps/TripMap'

export default function ItineraryView({ itinerary, activeView, selectedDay, onDaySelect }) {
  // Extract all activities from all days
  const allActivities = itinerary.days?.flatMap(day => {
    const activities = []
    if (day.morning?.activity) activities.push({ ...day.morning, dayNumber: day.dayNumber, timeOfDay: 'Morning' })
    if (day.afternoon?.activity) activities.push({ ...day.afternoon, dayNumber: day.dayNumber, timeOfDay: 'Afternoon' })
    if (day.evening?.activity) activities.push({ ...day.evening, dayNumber: day.dayNumber, timeOfDay: 'Evening' })
    return activities
  }) || []

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Overview Cards */}
              <div className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>🗓️</span>
                  <span>Your Journey</span>
                </h2>
                
                <div className="space-y-4">
                  {itinerary.days?.map((day, index) => (
                    <motion.div
                      key={day.dayNumber}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        onDaySelect(index)
                        document.getElementById('day-view')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 group-hover:text-primary-400 transition-colors">
                            Day {day.dayNumber}: {day.title}
                          </h3>
                          <p className="text-sm text-white/60">{day.date}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {day.morning && (
                              <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                                🌅 {day.morning.activity}
                              </span>
                            )}
                            {day.afternoon && (
                              <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                                ☀️ {day.afternoon.activity}
                              </span>
                            )}
                            {day.evening && (
                              <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                                🌙 {day.evening.activity}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-white/30 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>✨</span>
                  <span>Trip Highlights</span>
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {allActivities.slice(0, 6).map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{getActivityIcon(activity.activity)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{activity.activity}</h4>
                        <p className="text-sm text-white/60">Day {activity.dayNumber} • {activity.timeOfDay}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Insider Tips */}
              {itinerary.insiderTips && itinerary.insiderTips.length > 0 && (
                <div className="glass-card p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span>💡</span>
                    <span>Insider Tips</span>
                  </h2>
                  
                  <ul className="space-y-3">
                    {itinerary.insiderTips.map((tip, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="text-primary-400 mt-0.5">•</span>
                        <span className="text-white/80">{tip}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trip Overview Map */}
              <div className="mt-6">
                <TripMap itinerary={itinerary} />
              </div>
            </motion.div>
          )}

          {activeView === 'day' && (
            <motion.div
              key="day"
              id="day-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Day Navigation */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {itinerary.days?.map((day, index) => (
                  <motion.button
                    key={day.dayNumber}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDaySelect(index)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      selectedDay === index
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'glass hover:bg-white/10'
                    }`}
                  >
                    Day {day.dayNumber}
                  </motion.button>
                ))}
              </div>

              {/* Selected Day Details */}
              {itinerary.days && itinerary.days[selectedDay] && (
                <>
                  <DayCard
                    day={itinerary.days[selectedDay]}
                    isExpanded={true}
                  />
                  
                  {/* Map for current day */}
                  <div className="mt-6">
                    <TripMap 
                      itinerary={itinerary} 
                      selectedDay={selectedDay}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeView === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CostBreakdown
                budgetSummary={itinerary.budgetSummary}
                days={itinerary.days?.length || 0}
                people={itinerary.people || 2}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Ready to Book?</h3>
          
          <div className="space-y-3">
            {itinerary.flights && (
              <BookingButton
                type="flight"
                label="Book Flights"
                price={itinerary.budgetSummary?.flights}
                onClick={() => console.log('Book flights')}
              />
            )}
            
            {itinerary.hotels && (
              <BookingButton
                type="hotel"
                label="Book Hotels"
                price={itinerary.budgetSummary?.accommodation}
                onClick={() => console.log('Book hotels')}
              />
            )}
            
            {allActivities.length > 0 && (
              <BookingButton
                type="activity"
                label="Book Activities"
                price={itinerary.budgetSummary?.activities}
                onClick={() => console.log('Book activities')}
              />
            )}
          </div>
        </div>

        {/* Packing List */}
        {itinerary.packingList && itinerary.packingList.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎒</span>
              <span>Don't Forget</span>
            </h3>
            
            <div className="space-y-2">
              {itinerary.packingList.slice(0, 5).map((item, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-500/50"
                  />
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Weather Widget (placeholder) */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>☀️</span>
            <span>Weather Forecast</span>
          </h3>
          
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🌤️</div>
            <p className="text-2xl font-bold">75°F</p>
            <p className="text-sm text-white/60">Partly Cloudy</p>
            <p className="text-xs text-white/40 mt-2">Perfect travel weather!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get activity icons
function getActivityIcon(activityName) {
  const name = activityName.toLowerCase()
  if (name.includes('flight') || name.includes('arrival')) return '✈️'
  if (name.includes('hotel') || name.includes('check')) return '🏨'
  if (name.includes('beach')) return '🏖️'
  if (name.includes('food') || name.includes('restaurant') || name.includes('dinner')) return '🍽️'
  if (name.includes('tour') || name.includes('sightseeing')) return '🚌'
  if (name.includes('museum') || name.includes('culture')) return '🏛️'
  if (name.includes('adventure') || name.includes('hiking')) return '🏔️'
  if (name.includes('night') || name.includes('club') || name.includes('bar')) return '🍺'
  if (name.includes('shopping') || name.includes('market')) return '🛍️'
  if (name.includes('relax') || name.includes('spa')) return '💆'
  return '📍'
}