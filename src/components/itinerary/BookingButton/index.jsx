import { motion } from 'framer-motion'
import { trackAffiliateClick } from '@services/analytics'

export default function BookingButton({ type, label, price, onClick, url }) {
  const getIcon = () => {
    switch (type) {
      case 'flight':
        return '✈️'
      case 'hotel':
        return '🏨'
      case 'activity':
        return '🎫'
      default:
        return '🔗'
    }
  }

  const getGradient = () => {
    switch (type) {
      case 'flight':
        return 'from-blue-500 to-cyan-500'
      case 'hotel':
        return 'from-purple-500 to-pink-500'
      case 'activity':
        return 'from-green-500 to-teal-500'
      default:
        return 'from-primary-500 to-purple-500'
    }
  }

  const handleClick = () => {
    // Track affiliate click
    trackAffiliateClick(type, label, url)
    
    if (onClick) {
      onClick()
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        w-full p-4 rounded-xl bg-gradient-to-r ${getGradient()}
        text-white font-medium shadow-lg hover:shadow-xl
        transition-all duration-200 relative overflow-hidden group
      `}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getIcon()}</span>
          <div className="text-left">
            <p className="font-semibold">{label}</p>
            {price && (
              <p className="text-sm text-white/80">
                From ${price}
              </p>
            )}
          </div>
        </div>
        
        <svg 
          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M14 5l7 7m0 0l-7 7m7-7H3" 
          />
        </svg>
      </div>
    </motion.button>
  )
}