export const Palette = {
  // Brand Colors - Vintage Cardboard Theme
  mocha: {
    400: "#D9BFA0", // Light Sand (cardboard-4)
    500: "#A69677", // Muted Vintage Tan (cardboard-1)
    700: "#BF8A49", // Golden Vintage (cardboard-3)
    900: "#403B33", // Dark Sepia (cardboard-2)
  },
  cloud: {
    50: "#F5F1EB", // Warm Ivory
    100: "#E8E6E1",
    200: "#D9D7D2",
    900: "#0D0D0D", // Deep Obsidian (cardboard-5)
  },
  espresso: {
    900: "#403B33", // Dark Sepia (cardboard-2)
  },
  // Exact DOECHII Official Wordmarks Palette (Preserved, but could be updated if needed)
  doechii: {
    1: "#122611",
    2: "#BF8A49",
    3: "#D9B89C",
    4: "#8C3D20",
    5: "#401309",
  },

  // Functional Colors - Redefined Sage based on #BF8A49
  sage: {
    50: "#F8F4EF",
    100: "#F1E8DC",
    200: "#E4D1BC",
    400: "#D2A676",
    500: "#BF8A49", // Base
    600: "#A6783F",
    700: "#8D6636",
  },

  // Relationship Colors - Adhering to Vintage Theme
  relationship: {
    friendly: "#7A8C6F", // Muted Olive (Kept for compatibility)
    hostile: "#9C4A3F", // Rust Red
    romance: "#B38B82", // Dusty Rose
    family: "#4F5861", // Steel Blue-Grey
    neutral: "#A69677", // Muted Vintage Tan
  },

  // Status Colors
  status: {
    success: "#5B7B4B",
    warning: "#BF8A49", // Golden Vintage
    error: "#A33A3A",
    info: "#4B7D7D",
  },

  // Neutrals / Common
  common: {
    white: "#FFFFFF",
    black: "#0D0D0D", // Deep Obsidian
    transparent: "transparent",
  },
} as const;

export type PaletteType = typeof Palette;
