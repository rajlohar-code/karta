import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS Configuration for Karta
 * Grounded in: karta_design_system.md
 *
 * This configuration extends Tailwind with Karta's exact design tokens:
 * - Brand Greens: karta-500 (#16a34a) as Primary, forest shades for darks
 * - Strict Border Radius: 8px default, 12px for cards/panels
 * - Neutral Inks and Surface backgrounds
 */
export default {
  // Content files where Tailwind scans for class names to generate minimal CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Karta Brand Green Palette
        karta: {
          50:  '#f0fdf4', // surface background
          100: '#dcfce7',
          200: '#bbf7d0', // frost / badge borders
          300: '#4ade80', // mint / highlights
          400: '#22c55e',
          500: '#16a34a', // Primary Green (buttons, headers, links)
          600: '#15803d', // button hover
          700: '#166534', // wordmark, dark headings
          800: '#14532d', // forest text
          900: '#052e16',
        },
        // Neutral Design Tokens
        ink:     '#09090b', // main headings, table names
        body:    '#374151', // body text, column names
        muted:   '#6b7280', // captions, types, placeholders
        border:  '#e5e7eb', // dividers, borders
        bg:      '#f9fafb', // page background
        canvas:  '#fafafa', // diagram canvas background
        surface: '#f0fdf4', // sidebar & panel background
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,.06)',
        raised:   '0 4px 16px rgba(0,0,0,.08)',
        selected: '0 0 0 2px #16a34a',
        focus:    '0 0 0 3px #bbf7d0',
      },
      borderRadius: {
        DEFAULT: '8px',
        card:    '12px',
      }
    }
  },
  plugins: [],
} satisfies Config
