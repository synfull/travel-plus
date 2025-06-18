import { motion } from 'framer-motion'

export default function StarRating({ 
  rating, 
  totalRatings, 
  size = 'sm', 
  showText = true,
  className = '' 
}) {
  if (!rating) return null

  const sizes = {
    xs: { star: 'w-3 h-3', text: 'text-xs' },
    sm: { star: 'w-4 h-4', text: 'text-sm' },
    md: { star: 'w-5 h-5', text: 'text-base' },
    lg: { star: 'w-6 h-6', text: 'text-lg' }
  }

  const sizeClasses = sizes[size] || sizes.sm
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <motion.div
            key={`full-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`${sizeClasses.star} text-yellow-400`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </motion.div>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: fullStars * 0.05 }}
            className={`${sizeClasses.star} relative text-yellow-400`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20" className="absolute">
              <defs>
                <linearGradient id="half-star">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path 
                fill="url(#half-star)"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
              />
            </svg>
            <svg fill="none" stroke="currentColor" viewBox="0 0 20 20" className="text-yellow-400">
              <path 
                strokeWidth="1"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
              />
            </svg>
          </motion.div>
        )}

        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <motion.div
            key={`empty-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.05 }}
            className={`${sizeClasses.star} text-white/20`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 20 20" strokeWidth="1">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Rating text */}
      {showText && (
        <div className="flex items-center gap-1">
          <span className={`font-semibold text-white ${sizeClasses.text}`}>
            {rating}
          </span>
          {totalRatings && (
            <span className={`text-white/60 ${sizeClasses.text}`}>
              ({totalRatings.toLocaleString()})
            </span>
          )}
        </div>
      )}
    </div>
  )
} 