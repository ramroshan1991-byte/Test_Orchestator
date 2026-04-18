/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#0F172A',
        'electric-blue': '#3B82F6',
        'emerald-green': '#10B981',
      },
    },
  },
  plugins: [],
};
