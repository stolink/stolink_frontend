import { Palette } from "./palette";

export const Semantic = {
  // Brand & Identity
  brand: {
    primary: Palette.mocha[500],
    secondary: Palette.cloud[100],
    accent: Palette.sage[500],
  },

  // Backgrounds & Surfaces
  bg: {
    canvas: Palette.cloud[50], // Main page background
    card: Palette.common.white, // Card background
    overlay: "rgba(0, 0, 0, 0.4)", // Modal overlay
  },

  // Text & Content
  text: {
    base: Palette.espresso[900], // Default text
    muted: Palette.mocha[700], // Muted / Secondary text
    inverted: Palette.cloud[50], // Text on dark background
  },

  // UI Elements
  border: {
    default: Palette.cloud[200],
    focused: Palette.mocha[500],
    error: Palette.status.error,
  },

  // Feedback
  status: {
    success: Palette.status.success,
    warning: Palette.status.warning,
    error: Palette.status.error,
    info: Palette.status.info,
  },

  // Domain Specific
  param: {
    foreshadowing: Palette.sage[500],
    relationship: Palette.relationship,
  },
} as const;

export const Tokens = {
  palette: Palette,
  semantic: Semantic,
};
