/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050914',
      },
      // The parent area draws its hairline borders at 12 % white
      // (border-white/12); without this step the class is never generated and
      // the border falls back to the bright default.
      opacity: {
        '12': '0.12',
      },
      scale: {
        '98': '0.98',
        '102': '1.02',
      },
      animation: {
        fadeIn: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

