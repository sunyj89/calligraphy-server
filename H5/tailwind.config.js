/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#148B23',
          light: '#E6F4EA',
          lighter: '#F5FBF7',
          dark: '#0D6B1A',
          foreground: '#FFFFFF',
        },
        homework: {
          DEFAULT: '#2196F3',
          light: '#F0F7FF',
        },
        competition: {
          DEFAULT: '#FFA726',
          light: '#FFF8F0',
        },
        text: {
          primary: '#1C1C1C',
          secondary: '#666666',
          tertiary: '#999999',
          disabled: '#8C8A87',
        },
        border: '#E0E0E0',
        divider: '#F0F0F0',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
        number: ['"Barlow Semi Condensed"', 'sans-serif'],
        score: ['"Source Serif 4"', 'serif'],
      },
      borderRadius: {
        'btn': '24px',
        'card': '16px',
        'input': '12px',
        'tag': '10px',
      },
      maxWidth: {
        'mobile': '393px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
