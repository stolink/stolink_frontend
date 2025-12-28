import type { CSSProperties } from "react";
import type { EditorSettings, FontFamily, Theme, EditorWidth } from "@/stores/types/editorSettings";

/**
 * Font family CSS value mapping
 */
const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  pretendard: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  "noto-sans-kr": "'Noto Sans KR', sans-serif",
  "spoqa-han-sans": "'Spoqa Han Sans Neo', sans-serif",
  "ridi-batang": "'RIDIBatang', serif",
  "nanum-myeongjo": "'Nanum Myeongjo', serif",
  "kopub-batang": "'KoPub Batang', serif",
  "source-han-serif": "'Source Han Serif K', serif",
  d2coding: "'D2Coding', monospace",
  "jetbrains-mono": "'JetBrains Mono', monospace",
};

/**
 * Editor width CSS value mapping
 */
const EDITOR_WIDTH_MAP: Record<EditorWidth, string> = {
  narrow: "640px",
  standard: "720px",
  wide: "960px",
  full: "100%",
};

/**
 * Theme class name mapping
 */
const THEME_CLASS_MAP: Record<Theme, string> = {
  light: "theme-light",
  dark: "theme-dark",
  sepia: "theme-sepia",
  "eye-care": "theme-eye-care",
  "true-black": "theme-true-black",
};

/**
 * Theme color mapping
 */
const THEME_COLORS: Record<Theme, { bg: string; text: string; selection: string }> = {
  light: { bg: "#F8F8F7", text: "#2D2A28", selection: "rgba(95, 125, 95, 0.2)" },
  dark: { bg: "#2D2D2D", text: "#E5E5E5", selection: "rgba(130, 161, 130, 0.3)" },
  sepia: { bg: "#F4ECD8", text: "#5C4033", selection: "rgba(139, 115, 85, 0.25)" },
  "eye-care": { bg: "#FAF9F6", text: "#3D3D3D", selection: "rgba(95, 125, 95, 0.2)" },
  "true-black": { bg: "#000000", text: "#CCCCCC", selection: "rgba(130, 161, 130, 0.35)" },
};

/**
 * Convert indent number to CSS value
 */
function getIndentValue(indent: number): string {
  return indent === 0 ? "0" : `${indent}em`;
}

/**
 * Get CSS custom properties from editor settings
 * Use this to apply styles via CSS variables for performance
 */
export function getEditorCSSVariables(settings: EditorSettings): Record<string, string> {
  const theme = settings.visual?.theme ?? "light";
  const themeColors = THEME_COLORS[theme] ?? THEME_COLORS.light;
  const fontFamily = settings.typography?.fontFamily ?? "pretendard";
  const width = settings.visual?.width ?? "standard";

  return {
    // Typography
    "--st-editor-font-family": FONT_FAMILY_MAP[fontFamily] ?? FONT_FAMILY_MAP.pretendard,
    "--st-editor-font-size": `${settings.typography?.fontSize ?? 16}px`,
    "--st-editor-line-height": String(settings.typography?.lineHeight ?? 1.8),
    "--st-editor-letter-spacing": `${settings.typography?.letterSpacing ?? 0}em`,
    "--st-editor-text-indent": getIndentValue(settings.typography?.indent ?? 0),
    "--st-editor-paragraph-spacing": `${settings.typography?.paragraphSpacing ?? 0.5}em`,
    // Visual
    "--st-editor-width": EDITOR_WIDTH_MAP[width] ?? EDITOR_WIDTH_MAP.standard,
    "--st-editor-bg-color": themeColors.bg,
    "--st-editor-text-color": themeColors.text,
    "--st-editor-selection-color": themeColors.selection,
  };
}

/**
 * Get inline styles from editor settings
 * Use for React style prop when CSS variables aren't suitable
 */
export function getEditorStyles(settings: EditorSettings): CSSProperties {
  return {
    fontFamily: FONT_FAMILY_MAP[settings.typography.fontFamily],
    fontSize: `${settings.typography.fontSize}px`,
    lineHeight: settings.typography.lineHeight,
    letterSpacing: `${settings.typography.letterSpacing}em`,
    maxWidth: EDITOR_WIDTH_MAP[settings.visual.width],
    margin: "0 auto",
  };
}

/**
 * Get theme class name from settings
 */
export function getThemeClass(theme: Theme): string {
  return THEME_CLASS_MAP[theme];
}

/**
 * Get editor container class names based on settings
 */
export function getEditorClassNames(settings: EditorSettings): string {
  const classes: string[] = ["stolink-editor"];

  // Theme
  classes.push(THEME_CLASS_MAP[settings.visual.theme]);

  // Width
  classes.push(`editor-width-${settings.visual.width}`);

  // Font
  classes.push(`editor-font-${settings.typography.fontFamily}`);

  // Focus mode
  if (settings.behavior.focusMode) {
    classes.push("focus-mode-active");
  }

  // Typewriter mode
  if (settings.behavior.typewriterMode !== "off") {
    classes.push(`typewriter-mode-${settings.behavior.typewriterMode}`);
  }

  // Zen mode
  if (settings.behavior.zenMode) {
    classes.push("zen-mode-active");
  }

  return classes.join(" ");
}

/**
 * Get paragraph styles (for first-line indent)
 */
export function getParagraphStyles(settings: EditorSettings): CSSProperties {
  return {
    textIndent: getIndentValue(settings.typography.indent),
    marginBottom: `${settings.typography.paragraphSpacing}em`,
  };
}
