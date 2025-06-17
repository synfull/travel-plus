import { motion, AnimatePresence } from 'framer-motion'

export default function ActivityCard({ activity, isExpanded, onToggle }) {
  if (!activity.activity) return null

  return (
    <motion.div
      layout
      className="rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
      onClick={onToggle}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{activity.icon}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{activity.activity}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                  {activity.time}
                </span>
              </div>
              
              {activity.duration && (
                <p className="text-sm text-white/60 mb-2">
                  Duration: {activity.duration}
                </p>
              )}

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 space-y-3"
                  >
                    {activity.description && (
                      <p className="text-sm text-white/80">{activity.description}</p>
                    )}
                    
                    {activity.tips && (
                      <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <p className="text-sm text-white/80">
                          <span className="font-medium text-primary-400">Tip:</span> {activity.tips}
                        </p>
                      </div>
                    )}
                    
                    {activity.cost !== undefined && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-sm text-white/60">Estimated cost</span>
                        <span className="font-semibold text-primary-400">
                          ${activity.cost} per person
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-3 mt-1"
          >
            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}