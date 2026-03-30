export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Georgian"', 'sans-serif'],
      },
      colors: {
        brand: { 50:'#E1F5EE',100:'#9FE1CB',200:'#5DCAA5',400:'#1D9E75',500:'#0F6E56',600:'#085041' },
        gift: { 50:'#EEEDFE',100:'#CECBF6',200:'#AFA9EC',400:'#7F77DD',500:'#6B5CE7',600:'#534AB7' },
      },
      animation: {
        'fade-in': 'fadeIn .3s ease-out',
        'slide-up': 'slideUp .35s cubic-bezier(.4,0,.2,1)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
