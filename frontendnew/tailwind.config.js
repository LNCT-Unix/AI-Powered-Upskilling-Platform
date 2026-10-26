/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          400: '#00f0ff',
          500: '#06b6d4',
          600: '#0891b2',
        },
        slate: {
          850: '#0b1120',
          900: '#060a12',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(0, 240, 255, 0.35)',
        'cyan-glow-sm': '0 0 10px -2px rgba(0, 240, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
