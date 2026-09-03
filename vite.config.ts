import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forwards same-origin /api/* calls to the real backend so the browser
      // never makes a cross-origin request in dev — sidesteps CORS entirely
      // until the backend's own CORS policy is fixed (see README).
      '/api': {
        target: 'https://localhost:44318',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
