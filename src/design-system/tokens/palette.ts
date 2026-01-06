export const Palette = {
  // Brand Colors - Warm & Soft
  mocha: {
    400: "#C4B7AD", // Sand Beige (Remastered)
    500: "#8D766D", // Muted Cocoa (Remastered)
    700: "#A67C52", // Burnished Gold (Accent - Remastered)
    900: "#3E322C", // Charcoal Brown (Remastered)
  },
  cloud: {
    50: "#F5F0EB", // Dried Linen (Remastered)
    100: "#E8E6E1",
    200: "#D9D7D2",
    900: "#191817",
  },
  espresso: {
    900: "#3E322C", // Charcoal Brown (Remastered)
  },
  // Exact DOECHII Official Wordmarks Palette
  doechii: {
    1: "#122611",
    2: "#BF8A49",
    3: "#D9B89C",
    4: "#8C3D20",
    5: "#401309",
  },

  // Functional Colors - Foreshadowing & Narrative
  sage: {
    50: "#F0F4EF",
    100: "#E1E9E0",
    200: "#C3D3C1",
    400: "#7A9878",
    500: "#5F7D5F",
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
