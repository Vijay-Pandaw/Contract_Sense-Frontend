/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: '#f36963',
          hover: '#e65852',
          bg: '#ffece8',
        },
      },
    },
  },
  plugins: [],
}
