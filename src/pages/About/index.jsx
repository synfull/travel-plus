import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Planning',
      description: 'Our AI discovers unique experiences beyond typical tourist attractions'
    },
    {
      icon: '💰',
      title: 'Budget Optimization',
      description: 'Stay within budget while maximizing your travel experiences'
    },
    {
      icon: '📱',
      title: 'Works Offline',
      description: 'Access your itineraries anywhere, even without internet'
    },
    {
      icon: '🎯',
      title: 'Personalized for You',
      description: 'Tailored recommendations based on your interests and preferences'
    }
  ]

  const stats = [
    { number: '10K+', label: 'Happy Travelers' },
    { number: '50+', label: 'Destinations' },
    { number: '4.8★', label: 'User Rating' },
    { number: '24/7', label: 'AI Support' }
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/50 backdrop-blur-md">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </motion.button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">T+</span>
              </div>
              <span className="font-semibold gradient-text">Travel+</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container-custom max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            About <span className="gradient-text">Travel+</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/70 max-w-2xl mx-auto"
          >
            We're revolutionizing travel planning with AI-powered itineraries that discover hidden gems and create unforgettable experiences within your budget.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Travel+ was born from a simple belief: everyone deserves to experience the world's wonders without breaking the bank. 
              We combine cutting-edge AI technology with local insights to create personalized travel experiences that go beyond the typical tourist path.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Why Choose Travel+
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="text-3xl font-bold gradient-text mb-2">{stat.number}</div>
                <div className="text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container-custom max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-3xl font-bold mb-6"
          >
            Ready to Start Your Adventure?
          </motion.h2>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/plan')}
            className="gradient-button text-lg px-8 py-4"
          >
            Start Planning Now
          </motion.button>
        </div>
      </section>
    </div>
  )
}