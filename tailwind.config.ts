/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        mist: '#ecfeff',
        brass: '#b45309',
        pine: '#065f46',
        dark: {
          bg: '#0f0f0f',
          card: '#1a1a1a',
          surface: '#242424',
          border: '#333333',
        },
        accent: {
          pink: '#ff4d6d',
          red: '#e63946',
        },
      }
    }
  },
  plugins: []
};
