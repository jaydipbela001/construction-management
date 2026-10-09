import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Local development only: forward API calls to the Express dev server.
      '/api': {
        target: process.env.VITE_DEV_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
