import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-vercel-config',
      closeBundle() {
        // Copy vercel.json to dist folder for deployment
        try {
          copyFileSync(
            join(__dirname, 'vercel.json'),
            join(__dirname, 'dist', 'vercel.json')
          )
        } catch (e) {
          // File might not exist, that's okay
        }
      }
    }
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})

