// src/palette.ts
var Palette = {
  /**
   * StoLink Design System v2.0 - Vivid Warm Palette
   *
   * Color Theory Applied:
   * - Analogous Warm Harmony (Terracotta → Golden → Amber)
   * - High Saturation & Brightness for clarity on displays
   * - Strong contrast for readability
   *
   * Brand Concept: Literary IDE - "Warm Immersion for Authors"
   */
  // Primary Brand - Vivid Terracotta/Coral
  mocha: {
    400: "#E89D7A",
    // Bright Coral (Hover) - HSL: 18, 72%, 69%
    500: "#D4785A",
    // Vivid Terracotta (Core) - HSL: 15, 60%, 59%
    600: "#C4623F",
    // Rich Terracotta (Active)
    700: "#B85A3E",
    // Deep Terracotta (Dark)
    900: "#5C3020"
    // Espresso Dark
  },
  // Surface - Clean Warm Cream
  cloud: {
    50: "#FDFBF7",
    // Pure Cream White (Main BG)
    100: "#F8F4ED",
    // Warm Panel BG
    200: "#EDE7DD",
    // Soft Borders
    300: "#DDD4C6",
    // Stronger Borders
    900: "#1A1612"
    // Rich Black
  },
  // Text Color
  espresso: {
    700: "#5C4033",
    // Medium Brown Text
    900: "#3D2B1F"
    // Rich Coffee Text
  },
  // Accent - Vivid Golden/Amber (Inspiration & Warmth)
  doechii: {
    1: "#1E4620",
    // Forest Green (Accent)
    2: "#E5A33D",
    // Vivid Golden (Primary Accent) - HSL: 40, 78%, 57%
    3: "#F5D4A8",
    // Bright Peach (Secondary)
    4: "#C95D32",
    // Burnt Sienna (Emphasis)
    5: "#6B2D15"
    // Deep Chocolate
  },
  // Functional - Soft Olive/Sage (Focus & Growth)
  sage: {
    50: "#FBFAF7",
    // Near White
    100: "#F3F0E8",
    // Light Cream
    200: "#E5DFD2",
    // Warm Grey
    400: "#C7B99F",
    // Muted Tan
    500: "#9AAF7C",
    // Fresh Olive (Focus Color)
    600: "#7D9360",
    // Deeper Olive
    700: "#5E7345"
    // Forest Sage
  },
  // Relationship Colors - Clear & Vivid for Graph Visualization
  relationship: {
    friendly: "#4CAF50",
    // Vivid Green (Trust)
    hostile: "#F44336",
    // Clear Red (Conflict)
    romance: "#E91E63",
    // Vivid Pink (Passion)
    family: "#5C6BC0",
    // Indigo (Connection)
    neutral: "#90A4AE"
    // Blue Grey
  },
  // Status Colors - High Visibility
  status: {
    success: "#10B981",
    // Emerald-500 (Brighter)
    warning: "#F59E0B",
    // Amber-500 (Vivid)
    error: "#EF4444",
    // Red-500 (Clear)
    info: "#3B82F6"
    // Blue-500 (Bright)
  },
  // Neutrals / Common
  common: {
    white: "#FFFFFF",
    black: "#1A1612",
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
