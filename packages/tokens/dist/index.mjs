// src/palette.ts
var Palette = {
  // Brand Colors - Vintage Cardboard Theme
  mocha: {
    400: "#D9BFA0",
    // Light Sand (cardboard-4)
    500: "#A69677",
    // Muted Vintage Tan (cardboard-1)
    700: "#BF8A49",
    // Golden Vintage (cardboard-3)
    900: "#403B33"
    // Dark Sepia (cardboard-2)
  },
  cloud: {
    50: "#F5F1EB",
    // Warm Ivory
    100: "#E8E6E1",
    200: "#D9D7D2",
    900: "#0D0D0D"
    // Deep Obsidian (cardboard-5)
  },
  espresso: {
    900: "#403B33"
    // Dark Sepia (cardboard-2)
  },
  // Exact DOECHII Official Wordmarks Palette (Preserved, but could be updated if needed)
  doechii: {
    1: "#122611",
    2: "#BF8A49",
    3: "#D9B89C",
    4: "#8C3D20",
    5: "#401309"
  },
  // Functional Colors - Redefined Sage based on #BF8A49
  sage: {
    50: "#F8F4EF",
    100: "#F1E8DC",
    200: "#E4D1BC",
    400: "#D2A676",
    500: "#BF8A49",
    // Base
    600: "#A6783F",
    700: "#8D6636"
  },
  // Relationship Colors - Adhering to Vintage Theme
  relationship: {
    friendly: "#7A8C6F",
    // Muted Olive (Kept for compatibility)
    hostile: "#9C4A3F",
    // Rust Red
    romance: "#B38B82",
    // Dusty Rose
    family: "#4F5861",
    // Steel Blue-Grey
    neutral: "#A69677"
    // Muted Vintage Tan
  },
  // Status Colors
  status: {
    success: "#5B7B4B",
    warning: "#BF8A49",
    // Golden Vintage
    error: "#A33A3A",
    info: "#4B7D7D"
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
