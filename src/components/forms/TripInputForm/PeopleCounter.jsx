import { motion } from 'framer-motion'

export default function PeopleCounter({ value, onChange }) {
  const min = 1
  const max = 10

  const increment = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const decrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const getPeopleLabel = () => {
    if (value === 1) return 'Solo traveler'
    if (value === 2) return 'Couple'
    if (value >= 3 && value <= 5) return 'Small group'
    return 'Large group'
  }

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={decrement}
            disabled={value <= min}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all
              ${value <= min 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20 text-white'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </motion.button>

          <div className="text-center">
            <motion.div
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-4xl font-bold gradient-text"
            >
              {value}
            </motion.div>
            <p className="text-sm text-white/60 mt-1">{getPeopleLabel()}</p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={increment}
            disabled={value >= max}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all
              ${value >= max 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20 text-white'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 4, 6].map(num => (
          <motion.button
            key={num}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(num)}
            className={`
              py-2 px-3 rounded-lg text-sm transition-all
              ${value === num 
                ? 'bg-gradient-primary text-white shadow-lg' 
                : 'glass hover:bg-white/20'
              }
            `}
          >
            {num} {num === 1 ? 'person' : 'people'}
          </motion.button>
        ))}
      </div>

      {/* Visual representation */}
      <div className="glass-card p-4">
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: value }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.05, type: "spring" }}
              className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}