import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget =
    env.VITE_BACKEND_TARGET ||
    env.VITE_API_BASE_URL ||
    'https://practical-history-presenting-existed.trycloudflare.com';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: 'http://localhost:5173',
          },
        },
        '/oauth2': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: 'http://localhost:5173',
          },
        },
        '/login/oauth2': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: 'http://localhost:5173',
          },
        },
      },
    },
  };
})