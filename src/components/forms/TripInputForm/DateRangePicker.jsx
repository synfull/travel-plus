import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, differenceInDays } from 'date-fns'

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add empty cells for days before month starts
  const startDayOfWeek = monthStart.getDay()
  const emptyDays = Array(startDayOfWeek).fill(null)

  const handleDateClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onChange({ startDate: date, endDate: null })
    } else {
      // Complete selection
      if (isAfter(date, startDate)) {
        onChange({ startDate, endDate: date })
      } else {
        onChange({ startDate: date, endDate: startDate })
      }
      setIsOpen(false)
    }
  }

  const isInRange = (date) => {
    if (!startDate || !endDate) return false
    return isAfter(date, startDate) && isBefore(date, endDate)
  }

  const isRangeHovered = (date) => {
    if (!startDate || endDate) return false
    if (!hoveredDate) return false
    return (
      (isAfter(date, startDate) && isBefore(date, hoveredDate)) ||
      (isBefore(date, startDate) && isAfter(date, hoveredDate))
    )
  }

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Select dates'
    if (startDate && !endDate) return format(startDate, 'MMM d, yyyy')
    if (startDate && endDate) {
      const nights = differenceInDays(endDate, startDate)
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')} (${nights} ${nights === 1 ? 'night' : 'nights'})`
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addDays(startOfMonth(prev), -1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => addDays(endOfMonth(prev), 1))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input w-full text-left flex items-center justify-between"
      >
        <span className={startDate ? 'text-white' : 'text-white/50'}>
          {formatDateRange()}
        </span>
        <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 glass-card p-4 w-full md:w-auto"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs text-white/50 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells */}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="p-3" />
              ))}
              
              {/* Month days */}
              {monthDays.map(date => {
                const isStart = startDate && isSameDay(date, startDate)
                const isEnd = endDate && isSameDay(date, endDate)
                const isSelected = isStart || isEnd
                const inRange = isInRange(date)
                const rangeHovered = isRangeHovered(date)
                const isToday = isSameDay(date, new Date())
                const isPast = isBefore(date, new Date())

                return (
                  <motion.button
                    key={date.toISOString()}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !isPast && handleDateClick(date)}
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    disabled={isPast}
                    className={`
                      relative p-3 rounded-lg transition-all text-sm
                      ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'bg-gradient-primary text-white font-semibold shadow-lg' : ''}
                      ${inRange || rangeHovered ? 'bg-primary-500/20' : ''}
                      ${!isSelected && !inRange && !rangeHovered ? 'hover:bg-white/10' : ''}
                      ${isToday && !isSelected ? 'ring-1 ring-primary-500/50' : ''}
                    `}
                  >
                    {format(date, 'd')}
                    {isStart && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
                        Start
                      </span>
                    )}
                    {isEnd && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
                        End
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Quick Select Options */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/50 mb-2">Quick select:</p>
              <div className="flex flex-wrap gap-2">
                <QuickSelectButton
                  label="Weekend"
                  onClick={() => {
                    const friday = addDays(new Date(), (5 - new Date().getDay() + 7) % 7)
                    onChange({ startDate: friday, endDate: addDays(friday, 2) })
                    setIsOpen(false)
                  }}
                />
                <QuickSelectButton
                  label="1 Week"
                  onClick={() => {
                    const start = addDays(new Date(), 1)
                    onChange({ startDate: start, endDate: addDays(start, 7) })
                    setIsOpen(false)
                  }}
                />
                <QuickSelectButton
                  label="2 Weeks"
                  onClick={() => {
                    const start = addDays(new Date(), 1)
                    onChange({ startDate: start, endDate: addDays(start, 14) })
                    setIsOpen(false)
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuickSelectButton({ label, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-3 py-1 text-sm rounded-full glass hover:bg-white/20 transition-colors"
    >
      {label}
    </motion.button>
  )
}