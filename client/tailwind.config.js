/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f3ff',
          purple: '#bc13fe',
          green: '#0aff0a'
        },
        dark: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          input: '#2a2a2a'
        }
      }
    },
  },
  plugins: [],
}
