import { useState } from 'react'
import { motion } from 'framer-motion'
import DestinationSearch from './DestinationSearch'
import BudgetSlider from './BudgetSlider'
import DateRangePicker from './DateRangePicker'
import PeopleCounter from './PeopleCounter'
import CategorySelector from './CategorySelector'
import { validateTripForm } from '../validation/tripValidation'

export default function TripInputForm({ initialDestination, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    destination: initialDestination || '',
    startDate: null,
    endDate: null,
    people: 2,
    budget: 2000,
    budgetType: 'total', // 'total' or 'perPerson'
    includeFlights: true,
    categories: [],
    origin: '', // Where they're flying from
    specialRequests: ''
  })

  const [errors, setErrors] = useState({})

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    const validationErrors = validateTripForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Calculate total budget
    const totalBudget = formData.budgetType === 'perPerson' 
      ? formData.budget * formData.people 
      : formData.budget

    onSubmit({
      ...formData,
      totalBudget,
      budgetPerPerson: totalBudget / formData.people
    })
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Origin & Destination */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>📍</span>
          <span>Where are you traveling?</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Flying from
            </label>
            <input
              type="text"
              placeholder="New York, USA"
              value={formData.origin}
              onChange={(e) => updateFormData('origin', e.target.value)}
              className="glass-input"
            />
            {errors.origin && (
              <p className="text-red-400 text-sm mt-1">{errors.origin}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Going to
            </label>
            <DestinationSearch
              value={formData.destination}
              onChange={(value) => updateFormData('destination', value)}
            />
            {errors.destination && (
              <p className="text-red-400 text-sm mt-1">{errors.destination}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates & People */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>📅</span>
          <span>When & Who?</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Travel dates
            </label>
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onChange={(dates) => {
                updateFormData('startDate', dates.startDate)
                updateFormData('endDate', dates.endDate)
              }}
            />
            {errors.dates && (
              <p className="text-red-400 text-sm mt-1">{errors.dates}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Number of travelers
            </label>
            <PeopleCounter
              value={formData.people}
              onChange={(value) => updateFormData('people', value)}
            />
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>💰</span>
          <span>What's your budget?</span>
        </h2>

        <BudgetSlider
          value={formData.budget}
          onChange={(value) => updateFormData('budget', value)}
          budgetType={formData.budgetType}
          onBudgetTypeChange={(type) => updateFormData('budgetType', type)}
          people={formData.people}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includeFlights"
            checked={formData.includeFlights}
            onChange={(e) => updateFormData('includeFlights', e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-500/50"
          />
          <label htmlFor="includeFlights" className="text-white/80 cursor-pointer">
            Include flights in budget
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>✨</span>
          <span>What's your travel vibe?</span>
        </h2>

        <CategorySelector
          selectedCategories={formData.categories}
          onChange={(categories) => updateFormData('categories', categories)}
        />
        {errors.categories && (
          <p className="text-red-400 text-sm mt-1">{errors.categories}</p>
        )}
      </div>

      {/* Special Requests */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>💭</span>
          <span>Any special requests?</span>
        </h2>

        <textarea
          placeholder="Must-see attractions, dietary restrictions, accessibility needs..."
          value={formData.specialRequests}
          onChange={(e) => updateFormData('specialRequests', e.target.value)}
          rows={3}
          className="glass-input resize-none"
        />
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="gradient-button w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating Itinerary...' : 'Generate My Itinerary'}
      </motion.button>
    </motion.form>
  )
}