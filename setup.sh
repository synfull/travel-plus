#!/bin/bash

# Create the initial project structure for Travel+

# Create main directories
mkdir -p src/{components,pages,services,hooks,utils,styles,contexts,pwa}
mkdir -p src/components/{common,forms,itinerary,maps}
mkdir -p src/components/common/{Button,Card,Loading,Modal,Navigation}
mkdir -p src/components/forms/{TripInputForm,validation}
mkdir -p src/components/itinerary/{ItineraryView,DayCard,ActivityCard,ExcursionCard,CostBreakdown,BookingButton}
mkdir -p src/components/maps/{InteractiveMap,MapPin,OfflineMapToggle}
mkdir -p src/pages/{Home,PlanTrip,Itinerary,About,NotFound}
mkdir -p src/services/{api,cache,affiliates,itinerary,excursions}
mkdir -p src/styles/themes
mkdir -p public/icons
mkdir -p netlify/functions
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs

# Create .gitignore
cat > .gitignore << 'EOL'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# PWA
public/sw.js
public/workbox-*.js

# Netlify
.netlify
EOL

# Create netlify.toml
cat > netlify.toml << 'EOL'
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
EOL

# Create postcss.config.js
cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Create index.html
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI-powered budget travel itinerary planner. Create personalized trips with flights, hotels, and unique local experiences." />
    <meta name="theme-color" content="#6366f1" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <!-- Inter font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    
    <title>Travel+ | AI-Powered Budget Trip Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOL

echo "✅ Project structure created successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Copy .env.example to .env and add your API keys"
echo "3. Run 'npm run dev' to start the development server" 