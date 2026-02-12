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
          bg: '#0d1117',
          darker: '#010409',
          card: '#161b22',
          border: '#30363d',
          blue: '#58a6ff',
          lightBlue: '#79c0ff',
          green: '#238636',
          lightGreen: '#7ee787',
          text: '#c9d1d9',
          muted: '#8b949e'
        },
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
      },
      keyframes: {
        "cell-ripple": {
          "0%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "0.4" }
        }
      },
      animation: {
        "cell-ripple": "cell-ripple 0.2s ease-out forwards"
      }
    },
  },
  plugins: [],
}
