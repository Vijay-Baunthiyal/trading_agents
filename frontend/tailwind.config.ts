import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        profit: '#22c55e',
        loss: '#ef4444',
        warning: '#f59e0b',
        accent: '#6366f1',
      },
    },
  },
  plugins: [],
} satisfies Config;
