import { motion } from 'framer-motion'

export default function ExcursionRating({ rating, reviews, size = 'md', showReviewCount = true }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const starSize = sizeClasses[size]
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <motion.svg 
          key={`full-${i}`} 
          className={`${starSize} text-yellow-400 fill-current`} 
          viewBox="0 0 20 20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </motion.svg>
      )
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <motion.svg 
          key="half" 
          className={`${starSize} text-yellow-400`} 
          viewBox="0 0 20 20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: fullStars * 0.1, type: "spring", stiffness: 200 }}
        >
          <defs>
            <linearGradient id={`half-fill-${rating}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="rgba(75, 85, 99, 0.3)" />
            </linearGradient>
          </defs>
          <path 
            fill={`url(#half-fill-${rating})`}
            stroke="currentColor" 
            strokeWidth="0.5"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </motion.svg>
      )
    }
    
    // Empty stars
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <motion.svg 
          key={`empty-${i}`} 
          className={`${starSize} text-white/20`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 20 20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1, type: "spring", stiffness: 200 }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </motion.svg>
      )
    }
    
    return stars
  }

  const formatReviewCount = (count) => {
    if (!count) return ''
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-400'
    if (rating >= 4.0) return 'text-yellow-400' 
    if (rating >= 3.5) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>
      
      <div className="flex items-center gap-1">
        <span className={`${textSizeClasses[size]} font-medium ${getRatingColor(rating)}`}>
          {rating.toFixed(1)}
        </span>
        
        {showReviewCount && reviews && (
          <>
            <span className={`${textSizeClasses[size]} text-white/40`}>•</span>
            <span className={`${textSizeClasses[size]} text-white/60 hover:text-white/80 transition-colors cursor-pointer`}>
              {formatReviewCount(reviews)} review{reviews !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>
    </motion.div>
  )
}

// Optional: Export a simple star rating display without reviews
export function StarRating({ rating, size = 'sm' }) {
  return (
    <ExcursionRating 
      rating={rating} 
      size={size} 
      showReviewCount={false} 
    />
  )
}

// Optional: Export a compact inline version
export function InlineRating({ rating, reviews }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass text-xs">
      <span className="text-yellow-400">★</span>
      <span className="font-medium">{rating.toFixed(1)}</span>
      {reviews && (
        <span className="text-white/60">({reviews})</span>
      )}
    </div>
  )
}