/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // StoLink Design System - Sage Green (Optimized for Low Visual Fatigue)
        sage: {
          50: "#F4F7F4",
          100: "#E8EFE8",
          200: "#C5D8C5",
          300: "#A2C1A2",
          400: "#82A182", // Light - reduced fluorescence
          500: "#5F7D5F", // Primary - optimized contrast
          600: "#5A7A5A",
          700: "#3E523E", // Dark - enhanced readability
          800: "#3A5A3A",
          900: "#2A4A2A",
        },
        stone: {
          50: "#F8F8F7", // Off-white with reduced eye strain
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#2D2A28", // Body text - ink bleed prevention
          900: "#1C1917",
        },
        // Premium/Crafted colors
        paper: "#F8F8F7", // Warm off-white
        ink: "#2D2A28", // Soft charcoal black (higher readability)
        // Relationship colors (Narrative-focused palette)
        relation: {
          friendly: "#4B9F7D", // Emerald - trust and calmness
          hostile: "#B14B4B", // Russet Red - tension without aggression
          romance: "#C4718A", // Muted Rose - mature romance
          family: "#4A4E5A", // Deep Slate - depth and stability
          neutral: "#8B929E", // Sharkskin - clear presence
        },
        // Status colors (Engineering-grade visibility)
        status: {
          success: "#45A049", // 3:1+ contrast on Sage 50
          warning: "#D9A406", // Legible with white text
          error: "#D32F2F", // Standard engineering red
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
