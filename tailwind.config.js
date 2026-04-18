/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        surface: {
          DEFAULT: "#f4f4f5",
          raised: "#ffffff",
        },
        ink: {
          DEFAULT: "#18181b",
          muted: "#52525b",
          subtle: "#a1a1aa",
        },
        border: {
          DEFAULT: "#e4e4e7",
        },
      },
    },
  },
  plugins: [],
};
