var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Palette: () => Palette,
  Semantic: () => Semantic,
  Tokens: () => Tokens,
  generateCSSVariables: () => generateCSSVariables,
  hexToHsl: () => hexToHsl
});
module.exports = __toCommonJS(index_exports);

// src/palette.ts
var Palette = {
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
    400: "#BD9B8D",
    // Hover (High brightness)
    500: "#A47764",
    // Core Brand
    600: "#8E6656",
    700: "#7D5A4B",
    // Dark/Active
    800: "#5C4237",
    900: "#3D302A"
    // Espresso base
  },
  // Surface - Cloud Dancer (Clean Warm Cream)
  cloud: {
    25: "#FBFBF9",
    // Ultra light for depth
    50: "#F1F0EC",
    // Main BG (Cloud Dancer)
    100: "#E8E6E0",
    // Secondary Panel
    200: "#DAD7CE",
    // Borders (Soft)
    300: "#C6C1B4",
    // Borders (Strong)
    400: "#ABA596",
    900: "#1A1816"
  },
  // Text Color - Espresso
  espresso: {
    500: "#8B736B",
    // Muted text
    700: "#60524D",
    // Secondary text
    900: "#3D302A"
    // Primary text (Mocha 900)
  },
  // Accent - Sage & Earth
  sage: {
    50: "#F2F4F0",
    100: "#E3E8DE",
    200: "#CCD6C5",
    400: "#9FB38E",
    500: "#7D9668",
    // Sage (Success/Growth)
    600: "#647A53",
    700: "#4D5E40"
  },
  // Relationship Colors (Muted Narrative Palette)
  relationship: {
    friendly: "#5B7B4B",
    // Dark Green (신뢰, 협력)
    hostile: "#A33A3A",
    // Red (갈등, 적대)
    romantic: "#D67A8C",
    // Vivid Blossom (Muted)
    family: "#688DB6",
    // Muted Blue
    neutral: "#8C96A0"
    // Blue Grey
  },
  // Status Colors (Softened for better readability)
  status: {
    success: "#5B7B4B",
    // Same as friendly (Sage-ish)
    warning: "#B8860B",
    // Gold (Readable)
    error: "#A33A3A",
    // Engineering Red (Muted)
    info: "#4B7B9F"
    // Muted Blue
  },
  common: {
    white: "#FFFFFF",
    black: "#1A1816",
    transparent: "transparent",
    overlay: "rgba(61, 48, 42, 0.05)"
    // Soft espresso overlay
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Palette,
  Semantic,
  Tokens,
  generateCSSVariables,
  hexToHsl
});
