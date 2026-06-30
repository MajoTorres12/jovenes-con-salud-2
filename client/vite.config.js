import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // Comprobar en tiempo de compilación si existen los archivos de Firebase
    'import.meta.env.VITE_HAS_ANDROID_GOOGLE_SERVICES': JSON.stringify(
      fs.existsSync(path.resolve(__dirname, 'android/app/google-services.json'))
    ),
    'import.meta.env.VITE_HAS_IOS_GOOGLE_SERVICES': JSON.stringify(
      fs.existsSync(path.resolve(__dirname, 'ios/App/App/GoogleService-Info.plist'))
    ),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
