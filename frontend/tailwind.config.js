/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f4",
          100: "#faeee2",
          200: "#f4dac4",
          300: "#ebbe9c",
          400: "#e09a6f",
          500: "#d97b48",
          600: "#cb6239",
          700: "#a94c2e",
          800: "#873e2a",
          900: "#6e3525",
        },
        sage: {
          50: "#f4f8f6",
          100: "#e5f0ec",
          200: "#cee1da",
          300: "#a8cbbd",
          400: "#7cb09d",
          500: "#5c9480",
          600: "#477666",
        },
        coral: {
          500: "#ff6f61",
          600: "#e8594b",
        }
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem'
      }
    },
  },
  plugins: [],
};
