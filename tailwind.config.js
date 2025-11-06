/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary theme color from logo
        primary: {
          50: '#F9F5F0',
          100: '#F4EDE5',
          200: '#EBDDC0', // Logo color
          300: '#E2D0AB',
          400: '#D9C396',
          500: '#D0B581',
          600: '#C7A86C',
          700: '#B8935C',
          800: '#9A7A4D',
          900: '#7C613E',
        },
        // Complementary warm accent
        accent: {
          50: '#FFF5EB',
          100: '#FFE8D1',
          200: '#FFD6A3',
          300: '#FFC375',
          400: '#FFB147',
          500: '#FF9E19',
          600: '#E68A00',
          700: '#B86E00',
          800: '#8A5200',
          900: '#5C3700',
        },
        // Modern neutrals
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        // Keep cream for backwards compatibility
        cream: {
          50: '#F9F5F0',
          100: '#F4EDE5',
          200: '#EBDDC0',
          300: '#E2D0AB',
          400: '#D9C396',
          500: '#D0B581',
        },
        charcoal: {
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #EBDDC0 0%, #E2D0AB 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFB147 0%, #FF9E19 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F9F5F0 0%, #EBDDC0 50%, #E2D0AB 100%)',
        'gradient-radial': 'radial-gradient(circle, #EBDDC0 0%, #D9C396 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(235, 221, 192, 0.3), 0 10px 20px -2px rgba(235, 221, 192, 0.15)',
        'medium': '0 4px 25px -5px rgba(235, 221, 192, 0.4), 0 15px 30px -5px rgba(235, 221, 192, 0.2)',
        'strong': '0 10px 40px -10px rgba(235, 221, 192, 0.5), 0 20px 50px -10px rgba(235, 221, 192, 0.3)',
        'glow': '0 0 20px rgba(255, 158, 25, 0.3), 0 0 40px rgba(255, 158, 25, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 1s infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}



