/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        space: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
