import { motion } from 'framer-motion'
import CategoryBadges from './CategoryBadges'
import ExcursionRating from './ExcursionRating'

export default function ExcursionCard({ excursion, onBook }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group"
    >
      {/* Image */}
      {excursion.image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={excursion.image}
            alt={excursion.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
          
          {/* Source Badge */}
          {excursion.source && (
            <div className="absolute top-4 right-4">
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${excursion.source === 'ai' 
                  ? 'bg-gradient-primary text-white' 
                  : 'bg-white/20 backdrop-blur-md text-white'
                }
              `}>
                {excursion.source === 'ai' ? '✨ Unique Find' : '🎫 Partner'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
            {excursion.name}
          </h3>
          
          {excursion.rating && (
            <ExcursionRating rating={excursion.rating} reviews={excursion.reviews} />
          )}
        </div>

        <p className="text-white/80 text-sm mb-4 line-clamp-3">
          {excursion.description}
        </p>

        {/* Why it matches */}
        {excursion.whyItMatches && (
          <div className="mb-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <p className="text-sm">
              <span className="font-medium text-primary-400">Perfect for you:</span>{' '}
              <span className="text-white/80">{excursion.whyItMatches}</span>
            </p>
          </div>
        )}

        {/* Categories */}
        {excursion.categories && (
          <div className="mb-4">
            <CategoryBadges categories={excursion.categories} />
          </div>
        )}

        {/* Details */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          {excursion.duration && (
            <div className="flex items-center gap-1 text-white/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{excursion.duration}</span>
            </div>
          )}
          
          {excursion.groupSize && (
            <div className="flex items-center gap-1 text-white/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{excursion.groupSize}</span>
            </div>
          )}
          
          {excursion.difficulty && (
            <div className="flex items-center gap-1 text-white/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{excursion.difficulty}</span>
            </div>
          )}
        </div>

        {/* Price and Book */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">
              ${excursion.price}
              <span className="text-sm font-normal text-white/60"> per person</span>
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBook(excursion)}
            className="px-6 py-2 bg-gradient-primary text-white rounded-lg font-medium shadow-lg hover:shadow-neon transition-all"
          >
            Book Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}