export const Palette = {
  /**
   * StoLink Design System v3.1 - Mocha & Cloud Dancer (Warm & Soft)
   *
   * Design Philosophy:
   * - Warm, soft, and premium literary aesthetic
   * - High readability (Cloud Dancer background + Espresso text)
   * - Muted brand colors (Mocha) avoiding aggressive saturation
   */

  // Primary Brand - Mocha (Warm Brown)
  mocha: {
    50: "#FAF8F6",
    100: "#F5F0EE",
    200: "#EBE2DE",
    300: "#D6C4BC",
    400: "#BD9B8D", // Hover (High brightness)
    500: "#A47764", // Core Brand
    600: "#8E6656",
    700: "#7D5A4B", // Dark/Active
    800: "#5C4237",
    900: "#3D302A", // Espresso base
  },

  // Surface - Cloud Dancer (Clean Warm Cream)
  cloud: {
    25: "#FBFBF9", // Ultra light for depth
    50: "#F1F0EC", // Main BG (Cloud Dancer)
    100: "#E8E6E0", // Secondary Panel
    200: "#DAD7CE", // Borders (Soft)
    300: "#C6C1B4", // Borders (Strong)
    400: "#ABA596",
    900: "#1A1816",
  },

  // Text Color - Espresso
  espresso: {
    500: "#8B736B", // Muted text
    700: "#60524D", // Secondary text
    900: "#3D302A", // Primary text (Mocha 900)
  },

  // Accent - Sage & Earth
  sage: {
    50: "#F2F4F0",
    100: "#E3E8DE",
    200: "#CCD6C5",
    400: "#9FB38E",
    500: "#7D9668", // Sage (Success/Growth)
    600: "#647A53",
    700: "#4D5E40",
  },

  // Relationship Colors (Muted Narrative Palette)
  relationship: {
    friendly: "#5B7B4B", // Dark Green (신뢰, 협력)
    hostile: "#A33A3A", // Red (갈등, 적대)
    romantic: "#D67A8C", // Vivid Blossom (Muted)
    family: "#688DB6", // Muted Blue
    neutral: "#8C96A0", // Blue Grey
  },

  // Status Colors (Softened for better readability)
  status: {
    success: "#5B7B4B", // Same as friendly (Sage-ish)
    warning: "#B8860B", // Gold (Readable)
    error: "#A33A3A", // Engineering Red (Muted)
    info: "#4B7B9F", // Muted Blue
  },

  common: {
    white: "#FFFFFF",
    black: "#1A1816",
    transparent: "transparent",
    overlay: "rgba(61, 48, 42, 0.05)", // Soft espresso overlay
  },
} as const;

export type PaletteType = typeof Palette;
