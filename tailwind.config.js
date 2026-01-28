/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFBC40',
          light: '#FFD580',
          dark: '#CC9633',
        },
        background: {
          DEFAULT: '#0C243E',
          light: '#194F8A',
        },
        card: {
          DEFAULT: 'rgba(0, 0, 0, 0.3)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        player: {
          yellow: '#FFBC40',
          blue: '#1F91D0',
          green: '#4CAF50',
          red: '#F35145',
        },
        event: {
          quiz: '#4A90E2',
          funding: '#50C878',
          duel: '#FF6B6B',
          opportunity: '#FFB347',
          challenge: '#9B59B6',
          safe: '#95A5A6',
        },
      },
      fontFamily: {
        title: ['LuckiestGuy_400Regular'],
        body: ['OpenSans_400Regular'],
        'body-medium': ['OpenSans_500Medium'],
        'body-semibold': ['OpenSans_600SemiBold'],
        'body-bold': ['OpenSans_700Bold'],
        mono: ['SpaceMono_400Regular'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
