import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import ActivityCard from '../ActivityCard'

export default function DayCard({ day, isExpanded = false }) {
  const [expandedSection, setExpandedSection] = useState(isExpanded ? 'all' : null)

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const activities = [
    { ...day.morning, timeOfDay: 'Morning', icon: '🌅' },
    { ...day.afternoon, timeOfDay: 'Afternoon', icon: '☀️' },
    { ...day.evening, timeOfDay: 'Evening', icon: '🌙' }
  ].filter(activity => activity.activity)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Day Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              Day {day.dayNumber}: {day.title}
            </h3>
            <p className="text-white/60">{formatDate(day.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">
              {activities.length} activities
            </span>
          </div>
        </div>

        {/* Transportation for the day */}
        {day.transportation && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-sm font-medium">Getting Around</p>
              <p className="text-sm text-white/60">{day.transportation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="p-6 space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.timeOfDay}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ActivityCard
              activity={activity}
              isExpanded={expandedSection === activity.timeOfDay.toLowerCase() || expandedSection === 'all'}
              onToggle={() => toggleSection(activity.timeOfDay.toLowerCase())}
            />
          </motion.div>
        ))}

        {/* Meals */}
        {day.meals && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: activities.length * 0.1 }}
            className="mt-6 p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-white/10"
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>🍽️</span>
              <span>Meal Recommendations</span>
            </h4>
            
            <div className="space-y-2">
              {day.meals.breakfast && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-white/60 w-20">Breakfast:</span>
                  <span className="text-sm text-white/80 flex-1">{day.meals.breakfast}</span>
                </div>
              )}
              {day.meals.lunch && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-white/60 w-20">Lunch:</span>
                  <span className="text-sm text-white/80 flex-1">{day.meals.lunch}</span>
                </div>
              )}
              {day.meals.dinner && (
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-white/60 w-20">Dinner:</span>
                  <span className="text-sm text-white/80 flex-1">{day.meals.dinner}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Day Tips */}
        {day.tips && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (activities.length + 1) * 0.1 }}
            className="mt-6 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20"
          >
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary-400">
              <span>💡</span>
              <span>Tips for Today</span>
            </h4>
            <p className="text-sm text-white/80">{day.tips}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}