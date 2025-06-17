export function validateTripForm(formData) {
    const errors = {}
  
    // Origin validation
    if (!formData.origin || formData.origin.trim().length < 2) {
      errors.origin = 'Please enter your departure location'
    }
  
    // Destination validation
    if (!formData.destination || formData.destination.trim().length < 2) {
      errors.destination = 'Please select a destination'
    }
  
    // Date validation
    if (!formData.startDate || !formData.endDate) {
      errors.dates = 'Please select your travel dates'
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (formData.startDate < today) {
        errors.dates = 'Start date cannot be in the past'
      } else if (formData.endDate <= formData.startDate) {
        errors.dates = 'End date must be after start date'
      }
      
      // Check if trip is too long
      const tripLength = Math.ceil((formData.endDate - formData.startDate) / (1000 * 60 * 60 * 24))
      if (tripLength > 30) {
        errors.dates = 'Trip duration cannot exceed 30 days'
      }
    }
  
    // Budget validation
    if (!formData.budget || formData.budget < 100) {
      errors.budget = 'Minimum budget is $100'
    } else if (formData.budget > 50000) {
      errors.budget = 'Maximum budget is $50,000'
    }
  
    // People validation (already handled by min/max in component)
    if (!formData.people || formData.people < 1 || formData.people > 10) {
      errors.people = 'Number of travelers must be between 1 and 10'
    }
  
    // Categories validation
    if (!formData.categories || formData.categories.length === 0) {
      errors.categories = 'Please select at least one travel preference'
    }
  
    return errors
  }
  
  // Helper function to format validation errors for display
  export function getErrorMessage(errors) {
    const errorMessages = Object.values(errors)
    if (errorMessages.length === 0) return null
    if (errorMessages.length === 1) return errorMessages[0]
    return 'Please fix the errors in the form'
  }
  
  // Helper function to check if form is valid
  export function isFormValid(formData) {
    const errors = validateTripForm(formData)
    return Object.keys(errors).length === 0
  }