/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
      },
      colors: {
        obsidian: {
          900: '#0b0f19',
          950: '#080c14',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        }
      },
      boxShadow: {
        'fintech': '0 1px 0 0 rgba(255, 255, 255, 0.05) inset, 0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'fintech-lg': '0 1px 0 0 rgba(255, 255, 255, 0.08) inset, 0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
