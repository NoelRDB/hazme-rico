/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5b21b6',
        secondary: '#a855f7',
      },
    },
  },
  plugins: [],
};
