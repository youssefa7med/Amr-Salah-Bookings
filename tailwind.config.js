/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fef9f3',
          100: '#fef3e6',
          200: '#fce7cc',
          300: '#f9d5a8',
          400: '#f5b85f',
          500: '#f0a530',
          600: '#d68a1e',
          700: '#ad6b1a',
          800: '#8d5617',
          900: '#734516',
          950: '#3f2409',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
