export const Palette = {
  /**
   * StoLink Design System v3.0 - Calm & Readable Palette
   *
   * Design Philosophy:
   * - Muted, sophisticated tones that don't compete with content
   * - High readability with proper contrast
   * - Warm but restrained - no aggressive orange/coral
   *
   * Brand Concept: Literary IDE - "Calm Focus for Authors"
   */

  // Primary Brand - Soft Warm Brown (NOT orange)
  mocha: {
    50: "#FAF8F6", // Very light warm
    100: "#F0EBE6", // Light warm panel
    200: "#E0D6CC", // Soft borders
    400: "#A89080", // Muted taupe (Hover)
    500: "#8B7355", // Warm brown (Core) - Softer, no orange
    600: "#6E5A45", // Deep brown (Active)
    700: "#574838", // Dark brown
    900: "#3D302A", // Espresso
  },

  // Surface - Clean Warm Cream
  cloud: {
    50: "#FDFBF8", // Pure Cream White (Main BG)
    100: "#F8F5F0", // Warm Panel BG
    200: "#EDE8E1", // Soft Borders
    300: "#DDD6CC", // Stronger Borders
    900: "#1A1816", // Rich Black
  },

  // Text Color
  espresso: {
    500: "#6B5B4F", // Light brown text
    700: "#4A3F36", // Medium Brown Text
    900: "#2D241F", // Rich Coffee Text
  },

  // Accent - Muted Earth Tones
  doechii: {
    1: "#3D5A40", // Muted Forest Green
    2: "#B89B6A", // Soft Gold (not vivid)
    3: "#E5D4BE", // Cream Beige
    4: "#9B6B4A", // Muted Sienna (soft, not orange)
    5: "#5C3D2E", // Deep Chocolate
  },

  // Functional - Soft Sage (Focus & Growth)
  sage: {
    50: "#F8FAF7", // Near White
    100: "#EEF2EB", // Light Sage BG
    200: "#DCE3D6", // Soft Sage Border
    400: "#A8B89A", // Muted Sage
    500: "#7D9668", // Calm Olive (Focus Color)
    600: "#647A53", // Deeper Olive
    700: "#4D5E40", // Forest Sage
  },

  // Relationship Colors - Slightly Muted for Graph
  relationship: {
    friendly: "#5B9A5E", // Muted Green (Trust)
    hostile: "#C45B52", // Muted Red (Conflict)
    romance: "#C4687A", // Muted Pink (Passion)
    family: "#6B7BB5", // Muted Indigo (Connection)
    neutral: "#8A9AA5", // Blue Grey
  },

  // Status Colors - Clear but not harsh
  status: {
    success: "#4A9B7F", // Muted Emerald
    warning: "#C49545", // Muted Amber
    error: "#C45555", // Muted Red
    info: "#5B85C4", // Muted Blue
  },

  // Neutrals / Common
  common: {
    white: "#FFFFFF",
    black: "#1A1816",
    transparent: "transparent",
  },
} as const;

export type PaletteType = typeof Palette;
