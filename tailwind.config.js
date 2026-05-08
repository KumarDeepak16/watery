/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // aqua: light cyan -> deep ocean
        aqua: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },
        // ocean: deeper blue scale
        ocean: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        // mist: cool neutral grays
        mist: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // night: dark theme blacks tinted blue
        night: {
          50: '#E6E9F2',
          100: '#C2C8DA',
          200: '#9AA3BF',
          300: '#717CA4',
          400: '#525E8C',
          500: '#3A4673',
          600: '#2A3458',
          700: '#1F273F',
          800: '#1A1F2E',
          900: '#10141F',
          950: '#0A0E1A',
        },
        sunrise: {
          DEFAULT: '#FDBA74',
          glow: '#FED7AA',
          deep: '#EA580C',
        },
        sunset: {
          DEFAULT: '#F472B6',
          glow: '#FBCFE8',
          deep: '#BE185D',
        },
      },
      fontFamily: {
        'jakarta-regular': ['PlusJakartaSans_400Regular'],
        'jakarta-medium': ['PlusJakartaSans_500Medium'],
        'jakarta-semibold': ['PlusJakartaSans_600SemiBold'],
        'jakarta-bold': ['PlusJakartaSans_700Bold'],
        'grotesk-regular': ['SpaceGrotesk_400Regular'],
        'grotesk-medium': ['SpaceGrotesk_500Medium'],
        'grotesk-semibold': ['SpaceGrotesk_600SemiBold'],
        'grotesk-bold': ['SpaceGrotesk_700Bold'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
