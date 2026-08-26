/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#0f172a', // Deep Slate
          950: '#0b0f19', // Darkest Navy/Black
        },
        accent: {
          DEFAULT: '#4f46e5', // Muted Indigo
          hover: '#4338ca',
          subtle: '#eef2ff',
          dark: '#3730a3',
        },
        risk: {
          critical: {
            DEFAULT: '#b94a48', // Desaturated Crimson / Critical Red
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
            darkBg: 'rgba(185, 74, 72, 0.18)',
            darkText: '#f87171',
          },
          high: {
            DEFAULT: '#d97706', // Muted Amber / Orange
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#92400e',
            darkBg: 'rgba(217, 119, 6, 0.18)',
            darkText: '#fbbf24',
          },
          medium: {
            DEFAULT: '#ca8a04', // Warm Ochre
            bg: '#fefce8',
            border: '#fef08a',
            text: '#854d0e',
            darkBg: 'rgba(202, 138, 4, 0.18)',
            darkText: '#facc15',
          },
          low: {
            DEFAULT: '#059669', // Deep Emerald
            bg: '#ecfdf5',
            border: '#a7f3d0',
            text: '#065f46',
            darkBg: 'rgba(5, 150, 105, 0.18)',
            darkText: '#34d399',
          },
        },
      },
      boxShadow: {
        'cs-sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'cs-md': '0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'cs-lg': '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'cs-glow': '0 0 20px -2px rgba(79, 70, 229, 0.25)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
