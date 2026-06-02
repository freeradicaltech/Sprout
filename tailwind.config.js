/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        round: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif']
      },
      // Kid-friendly named themes referenced by Profile.theme
      colors: {
        sunrise: { DEFAULT: '#ff8a5b', soft: '#ffd6a5' },
        ocean: { DEFAULT: '#4cc9f0', soft: '#caf0f8' },
        forest: { DEFAULT: '#52b788', soft: '#d8f3dc' },
        grape: { DEFAULT: '#9d4edd', soft: '#e0c3fc' }
      }
    }
  },
  plugins: []
};
