/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: {
          DEFAULT: '#000000',
          secondary: '#0a0a0a',
          tertiary: '#141414',
        },
        foreground: {
          DEFAULT: '#ffffff',
          secondary: '#a0a0a0',
          tertiary: '#707070',
        },
        error: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
      },
    },
  },
  plugins: [],
}

