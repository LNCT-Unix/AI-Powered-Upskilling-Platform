import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetBackend = env.VITE_API_BASE_URL || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: targetBackend,
          changeOrigin: true,
          secure: false,
        },
        '/oauth2': {
          target: targetBackend,
          changeOrigin: true,
          secure: false,
        },
        '/login/oauth2': {
          target: targetBackend,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})
