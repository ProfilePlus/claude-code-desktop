/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',
        'border': 'var(--border-color)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent-blue': 'var(--accent-blue)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'message-slide-in': 'messageSlideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-in-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-bottom': 'slideInFromBottom 0.3s ease-out',
        'slide-in-left': 'slideInFromLeft 0.3s ease-out',
        'slide-in-right': 'slideInFromRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'ripple': 'ripple 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        messageSlideIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideInFromTop: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromBottom: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInFromRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
