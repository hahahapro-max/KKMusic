/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-gray': '#1c1c1e',
        'apple-gray-light': '#2c2c2e',
      }
    },
  },
  plugins: [],
}
