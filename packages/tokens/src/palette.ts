export const Palette = {
  // Brand Colors - Warm & Soft
  mocha: {
    400: "#BD9B8D", // Hover status
    500: "#A47764", // Primary Brand
    700: "#7D5A4B", // Dark / Active
    900: "#3D302A", // Text / Strong
  },
  cloud: {
    50: "#F1F0EC", // Main Background
    100: "#E8E6E1", // Subtle Variation
    200: "#D9D7D2", // Borders
    900: "#191817", // Dark Mode Surface
  },
  espresso: {
    900: "#3D302A", // Primary Text
  },

  // Functional Colors - Foreshadowing & Narrative
  sage: {
    50: "#F0F4EF",
    100: "#E1E9E0",
    200: "#C3D3C1",
    400: "#7A9878",
    500: "#5F7D5F", // Brand Green
    600: "#4E6B4E",
    700: "#3E4C3E",
  },

  // Relationship Colors (Narrative Context)
  relationship: {
    friendly: "#7A8C6F", // Muted Olive
    hostile: "#9C4A3F", // Rust Red
    romance: "#B38B82", // Dusty Rose
    family: "#4F5861", // Steel Blue-Grey
    neutral: "#8D8B88", // Warm Grey
  },

  // Status Colors
  status: {
    success: "#5B7B4B",
    warning: "#B8860B",
    error: "#A33A3A",
    info: "#4B7D7D",
  },

  // Neutrals / Common
  common: {
    white: "#FFFFFF",
    black: "#000000",
    transparent: "transparent",
  },
} as const;

export type PaletteType = typeof Palette;
