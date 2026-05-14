/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base:  'oklch(14% 0.02 250)',
          card:  'oklch(18% 0.025 250)',
          sheet: 'oklch(16% 0.022 250)',
          hover: 'oklch(22% 0.028 250)',
        },
        gold: {
          dim:    'oklch(65% 0.12 80)',
          base:   'oklch(74% 0.15 82)',
          bright: 'oklch(84% 0.18 88)',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans:  ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.3)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':  'fade-in 180ms ease-out',
        'pulse-dot':'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
