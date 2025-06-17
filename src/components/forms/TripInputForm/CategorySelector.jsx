import { motion } from 'framer-motion'

const CATEGORIES = [
  {
    id: 'nightlife',
    label: 'Nightlife & Drinks',
    icon: '🍺',
    description: 'Bars, clubs, cocktails, and late-night fun',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'adventure',
    label: 'Adventure & Outdoors',
    icon: '🏔️',
    description: 'Hiking, diving, extreme sports, and nature',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    id: 'culture',
    label: 'History & Culture',
    icon: '🏛️',
    description: 'Museums, monuments, and cultural experiences',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    id: 'food',
    label: 'Food & Cuisine',
    icon: '🍜',
    description: 'Local cuisine, restaurants, and food tours',
    gradient: 'from-red-500 to-yellow-500'
  },
  {
    id: 'family',
    label: 'Family Friendly',
    icon: '👨‍👩‍👧‍👦',
    description: 'Kid-friendly activities and attractions',
    gradient: 'from-blue-500 to-green-500'
  },
  {
    id: 'relaxation',
    label: 'Beach & Relaxation',
    icon: '🏖️',
    description: 'Beaches, spas, and peaceful retreats',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'arts',
    label: 'Arts & Creative',
    icon: '🎨',
    description: 'Galleries, theaters, and creative workshops',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'shopping',
    label: 'Shopping & Markets',
    icon: '🛍️',
    description: 'Local markets, boutiques, and shopping districts',
    gradient: 'from-indigo-500 to-purple-500'
  }
]

export default function CategorySelector({ selectedCategories, onChange }) {
  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId))
    } else {
      onChange([...selectedCategories, categoryId])
    }
  }

  const selectAll = () => {
    onChange(CATEGORIES.map(cat => cat.id))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Select all
        </button>
        <span className="text-white/30">•</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Clear all
        </button>
        <span className="text-white/30">•</span>
        <span className="text-sm text-white/40">
          {selectedCategories.length} selected
        </span>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CATEGORIES.map((category, index) => {
          const isSelected = selectedCategories.includes(category.id)
          
          return (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleCategory(category.id)}
              className={`
                relative p-4 rounded-xl transition-all text-left
                ${isSelected 
                  ? 'bg-gradient-to-r text-white shadow-lg border-transparent' 
                  : 'glass hover:bg-white/10 border border-white/20'
                }
              `}
              style={{
                backgroundImage: isSelected ? `linear-gradient(135deg, ${category.gradient.split(' ')[1]} 0%, ${category.gradient.split(' ')[3]} 100%)` : 'none'
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{category.label}</h3>
                  <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
                    {category.description}
                  </p>
                </div>
                
                {/* Checkmark */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isSelected ? 1 : 0,
                    opacity: isSelected ? 1 : 0
                  }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Selected summary */}
      {selectedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4"
        >
          <p className="text-sm text-white/60 mb-2">Your travel style:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(catId => {
              const category = CATEGORIES.find(c => c.id === catId)
              return (
                <motion.span
                  key={catId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-sm"
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCategory(catId)
                    }}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </motion.span>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}