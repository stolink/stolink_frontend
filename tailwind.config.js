/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // StoLink Design System - Mocha & Cloud Dancer
        mocha: {
          400: "#BD9B8D", // Hover
          500: "#A47764", // Primary - Mocha Mousse
          700: "#7D5A4B", // Dark/Active
        },
        cloud: {
          50: "#F1F0EC", // Surface - Cloud Dancer
        },
        espresso: {
          900: "#3D302A", // Text
        },
        // Premium/Crafted colors
        paper: "#F1F0EC", // Cloud 50
        ink: "#3D302A", // Espresso 900
        // Relationship colors (Narrative-focused palette)
        relation: {
          friendly: "#7A8C6F", // Muted Olive
          hostile: "#9C4A3F", // Rust Red
          romance: "#B38B82", // Dusty Rose
          family: "#4F5861", // Steel Blue-Grey
          neutral: "#8D8B88", // Warm Grey
        },
        // Status colors
        status: {
          success: "#5B7B4B",
          warning: "#B8860B",
          error: "#A33A3A",
        },
        // CSS Variable based colors for theme support
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
