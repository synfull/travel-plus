import { motion, AnimatePresence } from 'framer-motion'
import StarRating from '../../common/StarRating'

export default function ActivityCard({ activity, isExpanded = true, onToggle }) {
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
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{activity.activity}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                    {activity.time}
                  </span>
                </div>
                
                {(activity.cost !== undefined || activity.estimatedCost !== undefined) && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-400">
                      ${activity.cost || activity.estimatedCost}
                    </div>
                    <div className="text-xs text-white/60">per person</div>
                  </div>
                )}
              </div>
              
              {activity.duration && (
                <p className="text-sm text-white/60 mb-2">
                  Duration: {activity.duration}
                </p>
              )}
              
              {/* Star Rating Display */}
              {activity.rating && (
                <div className="flex items-center justify-between mb-2">
                  <StarRating 
                    rating={activity.rating} 
                    totalRatings={activity.totalRatings}
                    size="sm"
                  />
                  {activity.priceRange && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                      {activity.priceRange}
                    </span>
                  )}
                </div>
              )}

              {activity.description && (
                <p className="text-sm text-white/80 mb-2 leading-relaxed">
                  {activity.description}
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

                    {/* Contact Information */}
                    {(activity.address || activity.phone || activity.website) && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
                        <div className="text-xs text-white/60 mb-2 font-medium">Contact & Location</div>
                        <div className="space-y-2 text-xs">
                          {activity.address && (
                            <div className="flex items-start gap-2">
                              <span className="text-primary-400 mt-0.5">📍</span>
                              <span className="text-white/80 flex-1">{activity.address}</span>
                            </div>
                          )}
                          {activity.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-primary-400">📞</span>
                              <a href={`tel:${activity.phone}`} className="text-white/80 hover:text-primary-400 transition-colors">
                                {activity.phone}
                              </a>
                            </div>
                          )}
                          {activity.website && (
                            <div className="flex items-center gap-2">
                              <span className="text-primary-400">🌐</span>
                              <a 
                                href={activity.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-white/80 hover:text-primary-400 transition-colors underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Business Hours */}
                    {activity.hours && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-400">🕒</span>
                          <div className="text-xs text-blue-300 font-medium">Business Hours</div>
                        </div>
                        <div className="text-xs text-white/80 ml-5">{activity.hours}</div>
                      </div>
                    )}

                    {/* Business Status Warning */}
                    {activity.businessStatus && activity.businessStatus !== 'OPERATIONAL' && (
                      <div className="p-2 rounded bg-red-500/20 border border-red-500/30 mb-3">
                        <div className="text-xs text-red-300">
                          ⚠️ {activity.businessStatus === 'CLOSED_TEMPORARILY' ? 'Temporarily closed' : 'Permanently closed'}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {activity.photos && activity.photos.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-white/60 mb-2">Photos:</div>
                        <div className="flex gap-2 overflow-x-auto">
                          {activity.photos.slice(0, 3).map((photo, index) => (
                            <div key={index} className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                              <span className="text-xs text-white/60">📷</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data Sources */}
                    {activity.sources && activity.sources.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-white/60 mb-2">Verified by:</div>
                        <div className="flex gap-1 flex-wrap">
                          {activity.sources.map((source, index) => (
                            <span key={index} className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-primary-500/20 to-primary-600/20 border border-primary-500/30 text-primary-300">
                              {source === 'google_places' ? '📍 Google Places' : 
                               source === 'reddit' ? '💬 Reddit Community' :
                               source === 'wikipedia' ? '📚 Wikipedia' : 
                               source === 'mock_google_places' ? '📍 Google Places (Demo)' : source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reddit Data */}
                    {activity.redditMentions && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-3">
                        <p className="text-xs text-white/80">
                          <span className="font-medium text-orange-400">Reddit mentions:</span> {activity.redditMentions} discussions
                        </p>
                        {activity.confidence && (
                          <p className="text-xs text-white/60 mt-1">
                            Confidence: {Math.round(activity.confidence * 100)}%
                          </p>
                        )}
                      </div>
                    )}
                    
                    {activity.tips && (
                      <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <p className="text-sm text-white/80">
                          <span className="font-medium text-primary-400">Tip:</span> {activity.tips}
                        </p>
                      </div>
                    )}
                    
                    {(activity.cost !== undefined || activity.estimatedCost !== undefined) && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-sm text-white/60">Estimated cost</span>
                        <span className="font-semibold text-primary-400">
                          ${activity.cost || activity.estimatedCost} per person
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