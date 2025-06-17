# Travel+ 🌍✈️

AI-powered budget travel itinerary planner that creates personalized trips with flights, hotels, and unique local experiences.

![Travel+ Preview](public/preview.png)

## 🚀 Features

- **AI-Powered Planning**: Discovers hidden gems and unique experiences beyond typical tourist attractions
- **Budget Optimization**: Stay within budget while maximizing travel experiences
- **Modern UI**: Glassmorphic design with smooth animations
- **Offline Support**: Full PWA functionality - works without internet
- **Smart Categories**: Multi-preference matching (e.g., "history + nightlife")
- **Interactive Maps**: Visual journey planning with custom styling
- **Real-time Updates**: Live flight, hotel, and activity data

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Netlify Functions (Serverless)
- **Database**: Supabase
- **APIs**: Amadeus (flights), Booking.com, Viator, Google Maps, OpenAI/DeepSeek
- **PWA**: Service Workers, IndexedDB, Offline Support
- **Analytics**: Google Analytics 4

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/travel-plus.git
cd travel-plus
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
VITE_AMADEUS_API_KEY=your_key
VITE_AMADEUS_API_SECRET=your_secret
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
# ... etc
```

## 🏃‍♂️ Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 📱 PWA Features

Travel+ is a Progressive Web App with:
- ✅ Installable on mobile/desktop
- ✅ Offline functionality
- ✅ Background sync
- ✅ Push notifications (coming soon)
- ✅ Automatic updates

## 🗂️ Project Structure

```
travel-plus/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route pages
│   ├── services/      # API and business logic
│   ├── hooks/         # Custom React hooks
│   ├── pwa/          # PWA functionality
│   └── styles/        # Global styles
├── netlify/functions/ # Serverless backend
└── public/           # Static assets
```

## 🚀 Deployment

Deploy to Netlify:

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

## 🧪 Testing

Run tests:
```bash
npm test
```

Check PWA score:
```bash
npm run lighthouse
```

## 📊 Analytics

Track key metrics:
- Itinerary generation rate
- Affiliate conversion rate
- User engagement time
- Popular destinations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Amadeus for flight data
- Booking.com for accommodation
- Viator for activities
- Google Maps for location services
- OpenAI/DeepSeek for AI capabilities

## 📞 Support

- Email: support@travelplus.app
- Twitter: @travelplusapp
- Discord: [Join our community](https://discord.gg/travelplus)

---

Built with ❤️ by the Travel+ team