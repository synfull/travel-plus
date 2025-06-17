export default function CategoryBadges({ categories }) {
    const getCategoryStyle = (category) => {
      const styles = {
        adventure: 'from-green-500 to-teal-500',
        culture: 'from-amber-500 to-orange-500',
        food: 'from-red-500 to-yellow-500',
        nightlife: 'from-purple-500 to-pink-500',
        family: 'from-blue-500 to-green-500',
        relaxation: 'from-cyan-500 to-blue-500',
        shopping: 'from-indigo-500 to-purple-500',
        arts: 'from-pink-500 to-rose-500',
      }
      return styles[category] || 'from-gray-500 to-gray-600'
    }
  
    const getCategoryIcon = (category) => {
      const icons = {
        adventure: '🏔️',
        culture: '🏛️',
        food: '🍜',
        nightlife: '🍺',
        family: '👨‍👩‍👧‍👦',
        relaxation: '🏖️',
        shopping: '🛍️',
        arts: '🎨',
      }
      return icons[category] || '📍'
    }
  
    return (
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
              bg-gradient-to-r ${getCategoryStyle(category)} text-white
            `}
          >
            <span>{getCategoryIcon(category)}</span>
            <span className="capitalize">{category}</span>
          </span>
        ))}
      </div>
    )
  }