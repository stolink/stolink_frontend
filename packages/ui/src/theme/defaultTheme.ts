import { Palette } from "@stolink/tokens";

export const defaultTheme = {
  light: {
    background: Palette.cloud[50], // #F1F0EC
    foreground: Palette.espresso[900], // #3D302A

    card: Palette.cloud[50],
    "card-foreground": Palette.espresso[900],

    popover: Palette.cloud[50],
    "popover-foreground": Palette.espresso[900],

    primary: Palette.mocha[500], // #A47764
    "primary-foreground": Palette.cloud[50],

    secondary: Palette.cloud[100], // #E8E6E1
    "secondary-foreground": Palette.espresso[900],

    muted: Palette.cloud[100],
    "muted-foreground": Palette.mocha[700],

    accent: Palette.cloud[100],
    "accent-foreground": Palette.espresso[900],

    destructive: Palette.status.error,
    "destructive-foreground": Palette.cloud[50],
    success: Palette.status.success,
    "success-foreground": Palette.cloud[50],
    warning: Palette.status.warning,
    "warning-foreground": Palette.cloud[50],

    border: Palette.cloud[200],
    input: Palette.cloud[200],
    ring: Palette.mocha[500],
    overlay: "rgba(0, 0, 0, 0.4)",
    radius: "0.5rem",
  },
  dark: {
    // Mapping for Dark Mode (using Mocha 900 / Cloud 900 logic)
    background: Palette.espresso[900], // #3D302A (Base)
    foreground: Palette.cloud[50],

    card: "#2A2420", // Slightly lighter than background
    "card-foreground": Palette.cloud[50],

    popover: "#2A2420",
    "popover-foreground": Palette.cloud[50],

    primary: Palette.mocha[500],
    "primary-foreground": Palette.cloud[50],

    secondary: Palette.mocha[900], // Darker
    "secondary-foreground": Palette.cloud[50],

    muted: "#4A3B35",
    "muted-foreground": Palette.mocha[400],

    accent: "#4A3B35",
    "accent-foreground": Palette.cloud[50],

    destructive: Palette.status.error,
    "destructive-foreground": Palette.cloud[50],
    success: Palette.status.success,
    "success-foreground": Palette.cloud[50],
    warning: Palette.status.warning,
    "warning-foreground": Palette.cloud[50],

    border: Palette.mocha[700],
    input: Palette.mocha[700],
    ring: Palette.mocha[500],
    overlay: "rgba(0, 0, 0, 0.7)",
    radius: "0.5rem",
  },
};
