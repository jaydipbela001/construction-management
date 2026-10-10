import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Vitest transforms test JSX with esbuild; this opts into the modern
    // automatic runtime. Vite's production build (oxc) ignores this.
    jsx: 'automatic',
  },
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
