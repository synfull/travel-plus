import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function CostBreakdown({ budgetSummary, days = 1, people = 1 }) {
  if (!budgetSummary) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-white/60">Budget information not available</p>
      </div>
    )
  }

  // Prepare data for pie chart
  const chartData = [
    { name: 'Flights', value: budgetSummary.flights || 0, color: '#6366f1' },
    { name: 'Hotels', value: budgetSummary.accommodation || 0, color: '#8b5cf6' },
    { name: 'Activities', value: budgetSummary.activities || 0, color: '#ec4899' },
    { name: 'Food', value: budgetSummary.food || 0, color: '#f59e0b' },
    { name: 'Transport', value: budgetSummary.transportation || 0, color: '#10b981' },
  ].filter(item => item.value > 0)

  const total = budgetSummary.total || chartData.reduce((sum, item) => sum + item.value, 0)
  const perPerson = Math.round(total / people)
  const perDay = Math.round(total / days)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center"
        >
          <p className="text-sm text-white/60 mb-2">Total Cost</p>
          <p className="text-3xl font-bold gradient-text">${total.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 text-center"
        >
          <p className="text-sm text-white/60 mb-2">Per Person</p>
          <p className="text-3xl font-bold text-white">${perPerson.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 text-center"
        >
          <p className="text-sm text-white/60 mb-2">Per Day</p>
          <p className="text-3xl font-bold text-white">${perDay.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold mb-6">Cost Distribution</h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}: ${entry.value.toLocaleString()}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detailed Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold mb-6">Detailed Breakdown</h3>
        
        <div className="space-y-4">
          {chartData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-white/60">
                    {getPercentage(item.value, total)}% of total
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold">${item.value.toLocaleString()}</p>
                <p className="text-sm text-white/60">
                  ${Math.round(item.value / people)} per person
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Money Saving Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>💰</span>
          <span>Money Saving Tips</span>
        </h3>
        
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">•</span>
            <span className="text-white/80 text-sm">
              Book flights and hotels together for package discounts
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">•</span>
            <span className="text-white/80 text-sm">
              Consider traveling mid-week for lower prices
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">•</span>
            <span className="text-white/80 text-sm">
              Book activities in advance for early bird discounts
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 mt-0.5">•</span>
            <span className="text-white/80 text-sm">
              Use public transportation instead of taxis when possible
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

// Custom label renderer for pie chart
function renderCustomLabel(entry) {
  return `${getPercentage(entry.value, entry.payload.reduce((sum, item) => sum + item.value, 0))}%`
}

// Custom tooltip component
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-lg">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm text-primary-400">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

// Helper function to calculate percentage
function getPercentage(value, total) {
  return Math.round((value / total) * 100)
}