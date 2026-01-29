import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zgas: {
          navy: '#002B5C',    // Primary: Deep Navy Blue
          'navy-light': '#003366', // Lighter Navy for inputs
          lime: '#C4D600',    // Secondary: Vibrant Lime Green
          sapphire: '#0055A4', // Details: Sapphire Blue
          'bg-start': '#003366',
          'bg-end': '#001F3F',
        }
      },
    },
  },
  plugins: [],
}

export default config
