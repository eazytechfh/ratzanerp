/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f3',
          100: '#fbe4e5',
          200: '#f5c3c5',
          300: '#ec9a9d',
          400: '#df6870',
          500: '#c8323f',
          600: '#ab171a',
          700: '#8a1417',
          800: '#6d1315',
          900: '#5c1315',
        },
        accent: {
          400: '#e8578a',
          500: '#cc3366',
          600: '#a8264f',
        },
        ink: {
          900: '#062233',
          800: '#0b3049',
          700: '#123a54',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(6, 34, 51, 0.08), 0 1px 2px -1px rgba(6, 34, 51, 0.08)',
        soft: '0 4px 20px -4px rgba(6, 34, 51, 0.12)',
      },
    },
  },
  plugins: [],
}
