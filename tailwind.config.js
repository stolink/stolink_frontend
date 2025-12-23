/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // StoLink Design System - Sage Green
        sage: {
          50: "#F4F7F4",
          100: "#E8EFE8",
          200: "#C5D8C5",
          300: "#A2C1A2",
          400: "#8BA888",
          500: "#6B8E6B", // Primary
          600: "#5A7A5A",
          700: "#4A6B4A", // Dark
          800: "#3A5A3A",
          900: "#2A4A2A",
        },
        stone: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        // Premium/Crafted colors
        paper: "#FAFAF9", // Warm off-white
        ink: "#1A1A1A", // Soft charcoal black
        // Relationship colors
        relation: {
          friendly: "#6B8E6B",
          hostile: "#DC7C7C",
          neutral: "#9CA3AF",
        },
        // Status colors
        status: {
          success: "#22C55E",
          warning: "#EAB308",
          error: "#EF4444",
        },
      },
      fontFamily: {
        heading: ["DM Serif Display", "Pretendard", "serif"],
        body: ["Spectral", "Pretendard", "serif"],
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      fontSize: {
        body: "16px",
        small: "14px",
        h1: "32px",
        h2: "24px",
        h3: "20px",
      },
      spacing: {
        unit: "4px",
        component: "16px",
        gap: "24px",
        section: "48px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      transitionTimingFunction: {
        "organic": "cubic-bezier(0.19, 1, 0.22, 1)", // expo-out like
      },
      boxShadow: {
        "paper": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "paper-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
        "paper-floating": "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
