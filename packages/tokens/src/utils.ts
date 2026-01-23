export function hexToHsl(hex: string): string {
  // Remove hash if present
  hex = hex.replace(/^#/, "");

  // Parse r, g, b
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Convert to HSL
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

  // Round to decent precision
  // H is degrees (0-360), S/L are percentages (0-100)
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  // Shadcn uses space-separated HSL values for usage with hsl(var(...))
  return `${hDeg} ${sPct}% ${lPct}%`;
}

type PaletteNode = string | { [key: string]: PaletteNode };

export function generateCSSVariables(
  palette: Record<string, PaletteNode>,
  prefix = "",
): Record<string, string> {
  let vars: Record<string, string> = {};

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
