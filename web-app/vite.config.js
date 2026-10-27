import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/oauth2': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})