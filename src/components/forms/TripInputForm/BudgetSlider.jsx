import { motion } from 'framer-motion'

export default function BudgetSlider({ value, onChange, budgetType, onBudgetTypeChange, people = 1 }) {
  const min = 100
  const max = 10000
  const percentage = ((value - min) / (max - min)) * 100

  // Calculate display values
  const totalBudget = budgetType === 'perPerson' ? value * people : value
  const perPersonBudget = budgetType === 'perPerson' ? value : Math.round(value / people)

  const handleSliderChange = (e) => {
    onChange(parseInt(e.target.value))
  }

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value) || 0
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-6">
      {/* Budget type toggle */}
      <div className="flex gap-2 p-1 glass rounded-lg">
        <button
          type="button"
          onClick={() => onBudgetTypeChange('total')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            budgetType === 'total'
              ? 'bg-gradient-primary text-white shadow-lg'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Total Budget
        </button>
        <button
          type="button"
          onClick={() => onBudgetTypeChange('perPerson')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            budgetType === 'perPerson'
              ? 'bg-gradient-primary text-white shadow-lg'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Per Person
        </button>
      </div>

      {/* Slider */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={50}
            value={value}
            onChange={handleSliderChange}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, 
                #6366f1 0%, 
                #8b5cf6 ${percentage}%, 
                rgba(255, 255, 255, 0.1) ${percentage}%, 
                rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
          
          {/* Custom thumb */}
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              border: 3px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
              transition: all 0.2s;
            }
            .slider::-webkit-slider-thumb:hover {
              transform: scale(1.2);
              box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
            }
            .slider::-moz-range-thumb {
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              border: 3px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
              transition: all 0.2s;
            }
          `}</style>
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between text-sm text-white/50">
          <span>${min}</span>
          <span>${max}+</span>
        </div>
      </div>

      {/* Budget display */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-4 text-center"
        >
          <p className="text-sm text-white/60 mb-1">
            {budgetType === 'total' ? 'Your Budget' : 'Per Person'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold gradient-text">
              ${value.toLocaleString()}
            </span>
            <input
              type="number"
              min={min}
              max={max}
              value={value}
              onChange={handleInputChange}
              className="w-24 bg-transparent text-3xl font-bold gradient-text focus:outline-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 text-center"
        >
          <p className="text-sm text-white/60 mb-1">
            {budgetType === 'total' ? 'Per Person' : 'Total Budget'}
          </p>
          <p className="text-3xl font-bold text-white/80">
            ${budgetType === 'total' ? perPersonBudget.toLocaleString() : totalBudget.toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Budget suggestions */}
      <div className="flex gap-2">
        <span className="text-sm text-white/50">Suggested:</span>
        {[1000, 2500, 5000].map((amount) => (
          <motion.button
            key={amount}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(amount)}
            className="text-sm px-3 py-1 rounded-full glass hover:bg-white/20 transition-colors"
          >
            ${amount}
          </motion.button>
        ))}
      </div>
    </div>
  )
}