import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm terracotta / clay / japanese paper palette
        // Maximum 4 colors + white/black
        terracotta: {
          50: '#faf8f6',
          100: '#f5f0eb',
          200: '#e8ddd0',
          300: '#d4c4b0',
          400: '#b89d84',
          500: '#9d7f65',
          600: '#8a6d57',
          700: '#705849',
          800: '#5c483d',
          900: '#4d3d34',
        },
        clay: {
          50: '#faf9f7',
          100: '#f5f2ee',
          200: '#e8e0d6',
          300: '#d6c9b8',
          400: '#b8a58c',
          500: '#9d8769',
          600: '#847258',
          700: '#6b5c4a',
          800: '#564b3e',
          900: '#473e34',
        },
        paper: {
          50: '#fefdfb',
          100: '#fdfbf7',
          200: '#f9f5ec',
          300: '#f2ead6',
          400: '#e8d9b8',
          500: '#dcc898',
          600: '#c4b082',
          700: '#a5946a',
          800: '#887957',
          900: '#70644a',
        },
        // Neutral for text and backgrounds
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      borderRadius: {
        'soft': '12px',
        'medium': '16px',
        'large': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
}
export default config
