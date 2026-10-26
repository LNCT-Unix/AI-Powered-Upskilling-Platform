import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://suspected-finger-institutions-vid.trycloudflare.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'http://localhost:5173',
        },
      },
      '/oauth2': {
        target: 'https://suspected-finger-institutions-vid.trycloudflare.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'http://localhost:5173',
        },
      },
    },
  },
})