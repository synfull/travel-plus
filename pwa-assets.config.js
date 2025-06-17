// Configuration for generating PWA assets
// This would be used with a tool like @vite-pwa/assets-generator

export default {
    preset: 'minimal',
    images: [
      'public/logo.svg'
    ],
    
    // Icon configuration
    icons: {
      // Maskable icons with safe zone
      maskable: {
        sizes: [512],
        padding: 0.3,
        resizeOptions: {
          background: '#6366f1'
        }
      },
      // Regular icons
      transparent: {
        sizes: [72, 96, 128, 144, 152, 192, 384, 512],
        favicons: [[48, 'favicon.ico'], [64, 'favicon.ico']],
        resizeOptions: {
          background: 'transparent'
        }
      },
      // Apple touch icons
      apple: {
        sizes: [180],
        resizeOptions: {
          background: '#6366f1'
        }
      },
      // Apple splash screens
      appleSplashScreens: {
        padding: 0.3,
        resizeOptions: {
          background: '#0f172a',
          fit: 'contain'
        },
        darkResizeOptions: {
          background: '#000000'
        }
      }
    },
    
    // Output configuration
    output: {
      // Icon output
      icons: {
        dir: 'public/icons',
        files: {
          transparent: 'icon-[size].png',
          maskable: 'icon-maskable-[size].png',
          apple: 'apple-touch-icon.png'
        }
      },
      // Splash screens output
      appleSplashScreens: {
        dir: 'public/splash',
        files: {
          light: 'apple-splash-[width]-[height].png',
          dark: 'apple-splash-dark-[width]-[height].png'
        }
      }
    }
  }