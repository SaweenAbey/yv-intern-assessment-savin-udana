
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0b0f19',
          surface: '#141c2f',
          surfaceElevated: '#1e2942',
          primary: '#3b82f6',
          primaryHover: '#60a5fa',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          border: '#273556',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
