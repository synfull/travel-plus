// AI Prompt Templates for Itinerary Generation

export const SYSTEM_PROMPT = `You are an expert travel planner specializing in creating personalized, budget-conscious itineraries. 
Your goal is to craft unique travel experiences that match the traveler's preferences while staying within budget.
You have deep knowledge of local attractions, hidden gems, seasonal events, and practical travel tips.
Always consider the traveler's selected categories and create a narrative that flows naturally from day to day.`

export function generateItineraryPrompt({
  destination,
  startDate,
  endDate,
  people,
  budget,
  categories,
  specialRequests,
  flights,
  hotels,
  activities
}) {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
  const groupType = getGroupType(people)
  const interests = mapCategoriesToInterests(categories)
  
  return `
Create a detailed ${days}-day itinerary for ${destination} with the following requirements:

TRAVELER PROFILE:
- Group: ${people} ${groupType}
- Dates: ${formatDate(startDate)} to ${formatDate(endDate)}
- Budget: $${budget} total (approximately $${Math.round(budget / people)} per person)
- Interests: ${interests.join(', ')}
${specialRequests ? `- Special requests: ${specialRequests}` : ''}

AVAILABLE OPTIONS:
Flights: ${JSON.stringify(flights, null, 2)}
Hotels: ${JSON.stringify(hotels.slice(0, 3), null, 2)}
Activities: ${JSON.stringify(activities, null, 2)}

REQUIREMENTS:
1. Create a day-by-day narrative itinerary that tells a story
2. For each day, include:
   - Morning, afternoon, and evening activities
   - Specific timings and durations
   - Transportation between locations
   - Meal recommendations that match their interests
   - Cost estimates for each activity

3. Match activities to their interests:
${categories.map(cat => `   - ${getCategoryGuidance(cat)}`).join('\n')}

4. Include a mix of:
   - Must-see attractions (but explain WHY they're special)
   - Hidden gems and local experiences
   - Free/low-cost activities to balance expensive ones
   - Downtime for relaxation

5. Practical tips:
   - Best times to visit each attraction
   - How to avoid crowds
   - Money-saving tips
   - What to bring/wear
   - Local customs or phrases

6. Format the response as a JSON object with this structure:
{
  "title": "Catchy title for the trip",
  "overview": "2-3 sentence trip summary",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "title": "Theme for the day",
      "morning": {
        "time": "9:00 AM",
        "activity": "Activity name",
        "description": "Why this is perfect for them",
        "duration": "2 hours",
        "cost": 50,
        "tips": "Insider advice"
      },
      "afternoon": {...},
      "evening": {...},
      "meals": {
        "breakfast": "Suggestion with price",
        "lunch": "Suggestion with price", 
        "dinner": "Suggestion with price"
      },
      "transportation": "How to get around today"
    }
  ],
  "budgetSummary": {
    "flights": ${flights.totalPrice},
    "accommodation": ${hotels[0].price * days},
    "activities": "calculated total",
    "food": "estimated total",
    "transportation": "estimated total",
    "total": "sum of all"
  },
  "packingList": ["essential items based on activities"],
  "insiderTips": ["5-7 valuable local insights"]
}

Remember: Make this itinerary feel personal and exciting, not like a generic template!`
}

export function generateExcursionPrompt({ destination, categories, budget, groupSize, existingActivities }) {
  return `
Find unique experiences in ${destination} that match these interests: ${categories.join(', ')}.

Beyond these standard options: ${existingActivities.map(a => a.name).join(', ')}

I want you to suggest LOCAL, UNIQUE experiences that tourists typically miss:
- Hidden gems only locals know
- Seasonal or time-specific events
- Unique combinations (e.g., "history + drinking" = prohibition-era bar tour)
- Experiences that tell a story about the destination

For each suggestion, provide:
- Name and description
- Why it SPECIFICALLY matches their interests (be detailed!)
- Estimated cost per person
- Duration
- Best time to go
- How to book/find it
- What makes it special

Budget: $${budget} per person for activities
Group: ${groupSize} people

Think creatively and avoid generic tourist traps!`
}

// Helper functions
function getGroupType(people) {
  if (people === 1) return 'solo traveler'
  if (people === 2) return 'couple'
  if (people <= 5) return 'small group'
  return 'large group'
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function mapCategoriesToInterests(categories) {
  const mapping = {
    nightlife: 'bars, clubs, cocktails, and nighttime entertainment',
    adventure: 'outdoor activities, sports, and adrenaline experiences',
    culture: 'museums, historical sites, and cultural immersion',
    food: 'local cuisine, restaurants, and culinary experiences',
    family: 'kid-friendly activities and family bonding',
    relaxation: 'beaches, spas, and peaceful retreats',
    arts: 'galleries, performances, and creative experiences',
    shopping: 'markets, boutiques, and local crafts'
  }
  
  return categories.map(cat => mapping[cat] || cat)
}

function getCategoryGuidance(category) {
  const guidance = {
    nightlife: 'Find trendy bars, unique cocktail experiences, live music venues, or cultural night events. Consider speakeasies, rooftop bars, or local party districts.',
    adventure: 'Include hiking, water sports, zip-lining, or unique outdoor experiences. Match intensity to their fitness level.',
    culture: 'Incorporate museums, historical tours, local traditions, or cultural workshops. Find ways to interact with locals.',
    food: 'Suggest food tours, cooking classes, must-try restaurants, and street food. Include both high-end and local favorites.',
    family: 'Ensure all activities are age-appropriate, educational but fun, with rest breaks. Include interactive experiences.',
    relaxation: 'Balance active days with beach time, spa visits, or peaceful gardens. Include sunset viewing spots.',
    arts: 'Find galleries, street art tours, live performances, or hands-on creative workshops.',
    shopping: 'Locate authentic markets, artisan workshops, and unique local products. Avoid tourist trap shops.'
  }
  
  return guidance[category] || 'Match activities to their stated interests'
}

// Prompt for optimizing budget
export function generateBudgetOptimizationPrompt(itinerary, currentCost, targetBudget) {
  return `
The current itinerary costs $${currentCost}, but the budget is $${targetBudget}.

Please optimize by:
1. Suggesting alternative accommodations that are cheaper but still good
2. Replacing expensive activities with equally enjoyable budget options
3. Adding free or low-cost activities that match their interests
4. Providing money-saving tips for each day
5. Suggesting where to splurge vs save

Maintain the quality of the experience while reducing cost by $${currentCost - targetBudget}.
Keep all the activities that truly match their interests and find creative alternatives.`
}