/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper:     '#0e0c08',
        'paper-2': '#16130c',
        'paper-3': '#1d1910',
        slot:      '#221d12',
        ink:       '#f1e8cd',
        'ink-2':   '#c2b698',
        muted:     '#82785f',
        'muted-2': '#4f4732',
        line:      '#3a3220',
        'line-soft': '#2a2418',
        gold:      '#d4ac3b',
        'gold-soft': '#8a6e1d',
        'gold-deep': '#5e4a13',
        stamp:     '#c4392a',
        ok:        '#6fa14a',
      },
      fontFamily: {
        saira: ['"Saira Condensed"', 'sans-serif'],
        archivo: ['Archivo', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
