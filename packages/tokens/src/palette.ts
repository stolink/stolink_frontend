export const Palette = {
  // Brand Colors - Vivid Clean Brown Theme (Mocha & Cloud)
  mocha: {
    400: "#C69F8F", // Soft Vivid Cocoa (Hover)
    500: "#A6735E", // Vivid Clean Brown (Core Brand)
    700: "#7D4E3C", // Deep Vivid Cocoa (Dark/Active)
    900: "#4A332A", // Darkest Brown
  },
  cloud: {
    50: "#F5F1EB", // Warm Ivory (Main BG)
    100: "#E8E6E1", // Panel BG
    200: "#D9D7D2", // Borders
    900: "#0D0D0D", // Deep Obsidian
  },
  espresso: {
    900: "#3D302A", // Dark Coffee Text
  },
  // Exact DOECHII Official Wordmarks Palette (Preserved, but could be updated if needed)
  doechii: {
    1: "#122611",
    2: "#BF8A49",
    3: "#D9B89C",
    4: "#8C3D20",
    5: "#401309",
  },

  // Functional Colors - Redefined Sage (Clean Warm Grey/Brown)
  sage: {
    50: "#F9F8F6",
    100: "#F0EBE5",
    200: "#E2D8CF",
    400: "#C4B2A3",
    500: "#A47764", // Aligned with Brand
    600: "#8D6652",
    700: "#755442",
  },

  // Relationship Colors - Adhering to Vintage Theme
  relationship: {
    friendly: "#7A8C6F", // Muted Olive
    hostile: "#E11D48", // Rose-600 (Clear Red)
    romance: "#DB2777", // Pink-600 (Clear Pink)
    family: "#4F5861", // Steel Blue-Grey
    neutral: "#9CA3AF", // Cool Grey (Clean)
  },

  // Status Colors
  status: {
    success: "#059669", // Emerald-600
    warning: "#D97706", // Amber-600 (Clean Orange, not Ocher)
    error: "#DC2626", // Red-600
    info: "#0284C7", // Sky-600
  },

  // Neutrals / Common
  common: {
    white: "#FFFFFF",
    black: "#0D0D0D", // Deep Obsidian
    transparent: "transparent",
  },
} as const;

export type PaletteType = typeof Palette;
