import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F7F5',
        ink: '#16181D',
        muted: '#6B7076',
        line: '#E4E3DD',
        brand: {
          50: '#EEF0F8',
          100: '#DADFF0',
          400: '#4A5A93',
          600: '#2C3A6B',
          700: '#212C52',
        },
        marigold: {
          400: '#EDB35C',
          500: '#E8A33D',
          600: '#C7822A',
        },
        success: {
          50: '#E9F7EE',
          500: '#1F9D55',
          600: '#188045',
        },
        danger: {
          50: '#FDECEC',
          500: '#D64545',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}

export default config
