/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f8f5',
          100: '#e3f3ec',
          200: '#c5e7da',
          300: '#95d2bc',
          400: '#5bb598',
          500: '#228267',
          600: '#1b6b55', // Primary Ryvix Emerald
          700: '#155544',
          800: '#114436',
          900: '#0c352a',
          950: '#061e18',
        },
        coral: {
          50: '#fff5f3',
          100: '#ffe8e4',
          400: '#ff8573',
          500: '#ff6b57', // Accent Coral from chart & highlight
          600: '#f0533d',
        },
        surface: {
          canvas: '#f4f7f6',
          card: '#ffffff',
          muted: '#f8faf9',
          border: '#e6ece9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(27, 107, 85, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -4px rgba(27, 107, 85, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

