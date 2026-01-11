import type { Config } from "tailwindcss";
import { Palette } from "@stolink/tokens";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // StoLink Design System - Source of Truth: src/design-system/tokens/palette.ts
        mocha: Palette.mocha,
        cloud: Palette.cloud,
        sage: Palette.sage,
        espresso: Palette.espresso,

        // Premium/Crafted colors - Mapped to Palette
        paper: Palette.cloud[50],
        ink: Palette.espresso[900],

        // Relationship colors (Narrative-focused palette)
        relation: Palette.relationship,

        // Status colors
        status: Palette.status,

        // CSS Variable based colors for theme support (Preserved)
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        overlay: "var(--overlay)",
      },
      fontFamily: {
        mono: ['"Pretendard"', "monospace"],
        sans: ['"Pretendard"', "system-ui", "sans-serif"],
        serif: ['"Spectral"', "serif"],
        display: ['"DM Serif Display"', "serif"],
        body: ['"Spectral"', "serif"],
      },
      fontSize: {
        body: "16px",
        small: "14px",
        xs: "12px",
        h1: "32px",
        h2: "24px",
        h3: "20px",
      },
      spacing: {
        unit: "4px",
        "icon-sm": "32px",
        component: "16px",
        gap: "24px",
        section: "48px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      transitionTimingFunction: {
        organic: "cubic-bezier(0.19, 1, 0.22, 1)", // expo-out like
      },
      boxShadow: {
        paper: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "paper-hover":
          "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
        "paper-floating":
          "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
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
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
