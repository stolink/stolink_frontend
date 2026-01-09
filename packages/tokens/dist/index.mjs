// src/palette.ts
var Palette = {
  // Brand Colors - Vivid Clean Brown Theme (Mocha & Cloud)
  mocha: {
    400: "#C69F8F",
    // Soft Vivid Cocoa (Hover)
    500: "#A6735E",
    // Vivid Clean Brown (Core Brand)
    700: "#7D4E3C",
    // Deep Vivid Cocoa (Dark/Active)
    900: "#4A332A"
    // Darkest Brown
  },
  cloud: {
    50: "#F5F1EB",
    // Warm Ivory (Main BG)
    100: "#E8E6E1",
    // Panel BG
    200: "#D9D7D2",
    // Borders
    900: "#0D0D0D"
    // Deep Obsidian
  },
  espresso: {
    900: "#3D302A"
    // Dark Coffee Text
  },
  // Exact DOECHII Official Wordmarks Palette (Preserved, but could be updated if needed)
  doechii: {
    1: "#122611",
    2: "#BF8A49",
    3: "#D9B89C",
    4: "#8C3D20",
    5: "#401309"
  },
  // Functional Colors - Redefined Sage (Clean Warm Grey/Brown)
  sage: {
    50: "#F9F8F6",
    100: "#F0EBE5",
    200: "#E2D8CF",
    400: "#C4B2A3",
    500: "#A47764",
    // Aligned with Brand
    600: "#8D6652",
    700: "#755442"
  },
  // Relationship Colors - Adhering to Vintage Theme
  relationship: {
    friendly: "#7A8C6F",
    // Muted Olive
    hostile: "#E11D48",
    // Rose-600 (Clear Red)
    romance: "#DB2777",
    // Pink-600 (Clear Pink)
    family: "#4F5861",
    // Steel Blue-Grey
    neutral: "#9CA3AF"
    // Cool Grey (Clean)
  },
  // Status Colors
  status: {
    success: "#059669",
    // Emerald-600
    warning: "#D97706",
    // Amber-600 (Clean Orange, not Ocher)
    error: "#DC2626",
    // Red-600
    info: "#0284C7"
    // Sky-600
  },
  // Neutrals / Common
  common: {
    white: "#FFFFFF",
    black: "#0D0D0D",
    // Deep Obsidian
    transparent: "transparent"
  }
};

// src/semantic.ts
var Semantic = {
  // Brand & Identity
  brand: {
    primary: Palette.mocha[500],
    secondary: Palette.cloud[100],
    accent: Palette.sage[500]
  },
  // Backgrounds & Surfaces
  bg: {
    canvas: Palette.cloud[50],
    // Main page background
    card: Palette.common.white,
    // Card background
    overlay: "rgba(0, 0, 0, 0.4)"
    // Modal overlay
  },
  // Text & Content
  text: {
    base: Palette.espresso[900],
    // Default text
    muted: Palette.mocha[700],
    // Muted / Secondary text
    inverted: Palette.cloud[50]
    // Text on dark background
  },
  // UI Elements
  border: {
    default: Palette.cloud[200],
    focused: Palette.mocha[500],
    error: Palette.status.error
  },
  // Feedback
  status: {
    success: Palette.status.success,
    warning: Palette.status.warning,
    error: Palette.status.error,
    info: Palette.status.info
  },
  // Domain Specific
  param: {
    foreshadowing: Palette.sage[500],
    relationship: Palette.relationship
  }
};
var Tokens = {
  palette: Palette,
  semantic: Semantic
};

// src/utils.ts
function hexToHsl(hex) {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return `${hDeg} ${sPct}% ${lPct}%`;
}
function generateCSSVariables(palette, prefix = "") {
  let vars = {};
  for (const [key, value] of Object.entries(palette)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "string") {
      vars[`--${newKey}`] = hexToHsl(value);
    } else if (typeof value === "object" && value !== null) {
      vars = { ...vars, ...generateCSSVariables(value, newKey) };
    }
  }
  return vars;
}
export {
  Palette,
  Semantic,
  Tokens,
  generateCSSVariables,
  hexToHsl
};
