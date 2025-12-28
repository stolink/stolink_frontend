import { z } from "zod";

/**
 * Editor Settings Zod Schema
 * Based on editor-enhance.md specification
 */

// Typography Settings
export const fontFamilySchema = z.enum([
  "system",
  "pretendard",
  "noto-sans-kr",
  "spoqa-han-sans",
  "ridi-batang",
  "nanum-myeongjo",
  "kopub-batang",
  "source-han-serif",
  "d2coding",
  "jetbrains-mono",
]);

export const typographySettingsSchema = z.object({
  fontFamily: fontFamilySchema.default("pretendard"),
  fontSize: z.number().min(14).max(32).default(16),
  lineHeight: z.number().min(1.0).max(3.0).default(1.8),
  letterSpacing: z.number().min(-0.05).max(0.1).default(0),
  paragraphSpacing: z.number().min(0).max(2).default(0.5),
  indent: z.number().min(0).max(3).default(0), // 0~3em
});

// Visual Settings
export const themeSchema = z.enum([
  "light",
  "dark",
  "sepia",
  "eye-care",
  "true-black",
]);

export const editorWidthSchema = z.enum([
  "narrow", // 640px
  "standard", // 720px
  "wide", // 960px
  "full", // 100%
]);

export const caretStyleSchema = z.object({
  width: z.number().min(1).max(4).default(2),
  blink: z.enum(["blink", "phase", "solid"]).default("blink"),
});

export const visualSettingsSchema = z.object({
  theme: themeSchema.default("light"),
  width: editorWidthSchema.default("standard"),
  showLineNumbers: z.boolean().default(false),
  highlightCurrentLine: z.boolean().default(true),
  caretStyle: caretStyleSchema.default({ width: 2, blink: "blink" }),
});

// Behavior Settings
export const typewriterModeSchema = z.enum(["center", "top", "bottom", "off"]);

export const behaviorSettingsSchema = z.object({
  typewriterMode: typewriterModeSchema.default("off"),
  typewriterSmoothScroll: z.boolean().default(true),
  focusMode: z.boolean().default(false),
  zenMode: z.boolean().default(false),
  smartQuotes: z.boolean().default(true),
  smartDashes: z.boolean().default(true),
  smartEllipsis: z.boolean().default(true),
  linguisticMode: z
    .enum(["off", "dialogue", "adverb-adjective", "paragraph-length"])
    .default("off"),
});

// System Settings
export const systemSettingsSchema = z.object({
  autoSaveInterval: z.enum(["realtime", "5s", "1m", "manual"]).default("5s"),
  overscroll: z.boolean().default(true),
});

// Combined Editor Settings Schema
export const editorSettingsSchema = z.object({
  typography: typographySettingsSchema,
  visual: visualSettingsSchema,
  behavior: behaviorSettingsSchema,
  system: systemSettingsSchema,
});

// Type exports
export type FontFamily = z.infer<typeof fontFamilySchema>;
export type TypographySettings = z.infer<typeof typographySettingsSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type EditorWidth = z.infer<typeof editorWidthSchema>;
export type CaretStyle = z.infer<typeof caretStyleSchema>;
export type VisualSettings = z.infer<typeof visualSettingsSchema>;
export type TypewriterMode = z.infer<typeof typewriterModeSchema>;
export type BehaviorSettings = z.infer<typeof behaviorSettingsSchema>;
export type SystemSettings = z.infer<typeof systemSettingsSchema>;
export type EditorSettings = z.infer<typeof editorSettingsSchema>;

// Default values helper
export const getDefaultEditorSettings = (): EditorSettings => ({
  typography: {
    fontFamily: "pretendard",
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0,
    paragraphSpacing: 0.5,
    indent: 0,
  },
  visual: {
    theme: "light",
    width: "standard",
    showLineNumbers: false,
    highlightCurrentLine: true,
    caretStyle: { width: 2, blink: "blink" },
  },
  behavior: {
    typewriterMode: "off",
    typewriterSmoothScroll: true,
    focusMode: false,
    zenMode: false,
    smartQuotes: true,
    smartDashes: true,
    smartEllipsis: true,
    linguisticMode: "off",
  },
  system: {
    autoSaveInterval: "5s",
    overscroll: true,
  },
});
