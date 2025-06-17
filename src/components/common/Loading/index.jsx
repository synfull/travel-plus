import { motion } from 'framer-motion'

export default function Loading({ message = 'Loading...', size = 'medium' }) {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className={`${sizes[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-primary" />
        <div className="absolute inset-1 rounded-full bg-dark-900" />
        <div className="absolute inset-2 rounded-full bg-gradient-primary" />
      </motion.div>
      
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-white/70 text-sm"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}