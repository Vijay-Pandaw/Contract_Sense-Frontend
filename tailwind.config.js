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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // Neon Violet / Electric Purple
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#121215', // Obsidian Glass Surface
          950: '#09090b', // Deep Matte Black Background
        },
        obsidian: {
          bg: '#09090b',
          deep: '#050505',
          card: '#121215',
          panel: '#18181b',
          border: 'rgba(255, 255, 255, 0.1)',
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          'border-highlight': 'rgba(124, 58, 237, 0.4)',
        },
        accent: {
          DEFAULT: '#7c3aed', // Electric Neon Violet
          hover: '#6d28d9',
          light: '#8b5cf6',
          subtle: 'rgba(124, 58, 237, 0.15)',
          dark: '#5b21b6',
          glow: 'rgba(124, 58, 237, 0.4)',
        },
        risk: {
          critical: {
            DEFAULT: '#ef4444', // Red-500
            bg: 'rgba(239, 68, 68, 0.12)',
            border: 'rgba(239, 68, 68, 0.28)',
            text: '#f87171',
            darkBg: 'rgba(239, 68, 68, 0.16)',
            darkText: '#f87171',
          },
          high: {
            DEFAULT: '#f59e0b', // Amber-500
            bg: 'rgba(245, 158, 11, 0.12)',
            border: 'rgba(245, 158, 11, 0.28)',
            text: '#fbbf24',
            darkBg: 'rgba(245, 158, 11, 0.16)',
            darkText: '#fbbf24',
          },
          medium: {
            DEFAULT: '#eab308', // Yellow-500
            bg: 'rgba(234, 179, 8, 0.12)',
            border: 'rgba(234, 179, 8, 0.28)',
            text: '#facc15',
            darkBg: 'rgba(234, 179, 8, 0.16)',
            darkText: '#facc15',
          },
          low: {
            DEFAULT: '#10b981', // Emerald-500
            bg: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.28)',
            text: '#34d399',
            darkBg: 'rgba(16, 185, 129, 0.16)',
            darkText: '#34d399',
          },
        },
      },
      boxShadow: {
        'cs-sm': '0 1px 3px rgba(0, 0, 0, 0.4)',
        'cs-md': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
        'cs-lg': '0 16px 40px -4px rgba(0, 0, 0, 0.7), 0 6px 18px -2px rgba(0, 0, 0, 0.4)',
        'cs-glow': '0 0 25px -3px rgba(124, 58, 237, 0.35)',
        'cs-glow-lg': '0 0 45px -4px rgba(124, 58, 237, 0.5)',
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
        sheenSweep: {
          '0%': { transform: 'translateX(-100%) rotate(25deg)' },
          '100%': { transform: 'translateX(220%) rotate(25deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.04)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        'sheen': 'sheenSweep 1.8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
