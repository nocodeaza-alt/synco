import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4FE8',
          dark: '#3B33B0',
          soft: '#EEEDFB',
        },
        navy: '#0F1B2D',
        mint: {
          DEFAULT: '#00C896',
          dark: '#00936E',
        },
        amber: {
          DEFAULT: '#F5A623',
          text: '#C77E0A',
        },
        danger: '#E5484D',
        violet: '#8B5CF6',
        bg: '#F7F8FC',
        surface: '#FFFFFF',
        border: '#ECEEF5',
        'input-border': '#E5E7F0',
        't2': '#6B7385',
        'muted': '#9CA3B5',
        'faint': '#B7BCCB',
        'goal-pink': '#E5487F',
        'goal-blue': '#2E9BE6',
        'goal-violet': '#8B5CF6',
      },
      boxShadow: {
        card: '0 2px 10px rgba(15,27,45,0.04)',
        raised: '0 12px 30px rgba(15,27,45,0.12)',
        primary: '0 8px 20px rgba(91,79,232,0.30)',
        modal: '0 30px 80px rgba(0,0,0,0.45)',
      },
      borderRadius: {
        input: '12px',
        card: '16px',
        chip: '99px',
        btn: '12px',
        'btn-sm': '9px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['27px', { fontWeight: '800', letterSpacing: '-0.8px' }],
        'section-title': ['15px', { fontWeight: '800' }],
        'overline': ['11px', { fontWeight: '700', letterSpacing: '0.45px' }],
        'auth-headline': ['44px', { fontWeight: '800', letterSpacing: '-1.6px' }],
      },
      minWidth: {
        app: '1240px',
      },
      height: {
        topbar: '60px',
      },
      width: {
        sidebar: '250px',
      },
    },
  },
  plugins: [],
}

export default config
