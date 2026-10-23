/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens lifted from the UI reference so every screen shares one palette.
        canvas: '#E5E3E0', // page background behind the shell
        shell: '#EFECE6', // the large rounded application container
        ink: '#2D2D2E', // primary text
        accent: {
          DEFAULT: '#E62E6B',
          hover: '#D0255E',
          soft: '#FCE7F0',
        },
      },
      borderRadius: {
        shell: '32px',
        panel: '28px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
