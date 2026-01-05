import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  EditorSettings,
  TypographySettings,
  VisualSettings,
  BehaviorSettings,
  SystemSettings,
  FontFamily,
  Theme,
  EditorWidth,
  TypewriterMode,
  CaretStyle,
} from "@/types/editorSettings";
import { getDefaultEditorSettings } from "@/types/editorSettings";

interface EditorSettingActions {
  // Typography actions
  setFontFamily: (fontFamily: FontFamily) => void;
  setFontSize: (fontSize: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setLetterSpacing: (letterSpacing: number) => void;
  setParagraphSpacing: (spacing: number) => void;
  setIndent: (indent: number) => void;

  // Visual actions
  setTheme: (theme: Theme) => void;
  setEditorWidth: (width: EditorWidth) => void;
  setShowLineNumbers: (show: boolean) => void;
  setHighlightCurrentLine: (highlight: boolean) => void;
  setCaretStyle: (style: Partial<CaretStyle>) => void;

  // Behavior actions
  setTypewriterMode: (mode: TypewriterMode) => void;
  toggleTypewriterMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;
  setZenMode: (enabled: boolean) => void;
  toggleZenMode: () => void;
  setSmartQuotes: (enabled: boolean) => void;
  setSmartDashes: (enabled: boolean) => void;
  setSmartEllipsis: (enabled: boolean) => void;
  setLinguisticMode: (mode: BehaviorSettings["linguisticMode"]) => void;

  // System actions
  setAutoSaveInterval: (interval: SystemSettings["autoSaveInterval"]) => void;
  setOverscroll: (enabled: boolean) => void;

  // Bulk update actions
  updateTypography: (settings: Partial<TypographySettings>) => void;
  updateVisual: (settings: Partial<VisualSettings>) => void;
  updateBehavior: (settings: Partial<BehaviorSettings>) => void;
  updateSystem: (settings: Partial<SystemSettings>) => void;

  // Reset
  resetToDefaults: () => void;
}

type EditorSettingState = EditorSettings & EditorSettingActions;

export const useEditorSettingStore = create<EditorSettingState>()(
  persist(
    immer((set) => ({
      // Default settings
      ...getDefaultEditorSettings(),

      // Typography actions
      setFontFamily: (fontFamily) =>
        set((state) => {
          state.typography.fontFamily = fontFamily;
        }),
      setFontSize: (fontSize) =>
        set((state) => {
          state.typography.fontSize = Math.min(32, Math.max(14, fontSize));
        }),
      setLineHeight: (lineHeight) =>
        set((state) => {
          state.typography.lineHeight = Math.min(
            3.0,
            Math.max(1.0, lineHeight)
          );
        }),
      setLetterSpacing: (letterSpacing) =>
        set((state) => {
          state.typography.letterSpacing = Math.min(
            0.1,
            Math.max(-0.05, letterSpacing)
          );
        }),
      setParagraphSpacing: (spacing) =>
        set((state) => {
          state.typography.paragraphSpacing = Math.min(2, Math.max(0, spacing));
        }),
      setIndent: (indent) =>
        set((state) => {
          state.typography.indent = Math.min(3, Math.max(0, indent));
        }),

      // Visual actions
      setTheme: (theme) =>
        set((state) => {
          state.visual.theme = theme;
        }),
      setEditorWidth: (width) =>
        set((state) => {
          state.visual.width = width;
        }),
      setShowLineNumbers: (show) =>
        set((state) => {
          state.visual.showLineNumbers = show;
        }),
      setHighlightCurrentLine: (highlight) =>
        set((state) => {
          state.visual.highlightCurrentLine = highlight;
        }),
      setCaretStyle: (style) =>
        set((state) => {
          state.visual.caretStyle = { ...state.visual.caretStyle, ...style };
        }),

      // Behavior actions
      setTypewriterMode: (mode) =>
        set((state) => {
          state.behavior.typewriterMode = mode;
        }),
      toggleTypewriterMode: () =>
        set((state) => {
          const modes: TypewriterMode[] = ["off", "top", "center", "bottom"];
          const currentIndex = modes.indexOf(state.behavior.typewriterMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          state.behavior.typewriterMode = modes[nextIndex];
        }),
      setFocusMode: (enabled) =>
        set((state) => {
          state.behavior.focusMode = enabled;
        }),
      toggleFocusMode: () =>
        set((state) => {
          state.behavior.focusMode = !state.behavior.focusMode;
        }),
      setZenMode: (enabled) =>
        set((state) => {
          state.behavior.zenMode = enabled;
        }),
      toggleZenMode: () =>
        set((state) => {
          state.behavior.zenMode = !state.behavior.zenMode;
        }),
      setSmartQuotes: (enabled) =>
        set((state) => {
          state.behavior.smartQuotes = enabled;
        }),
      setSmartDashes: (enabled) =>
        set((state) => {
          state.behavior.smartDashes = enabled;
        }),
      setSmartEllipsis: (enabled) =>
        set((state) => {
          state.behavior.smartEllipsis = enabled;
        }),
      setLinguisticMode: (mode) =>
        set((state) => {
          state.behavior.linguisticMode = mode;
        }),

      // System actions
      setAutoSaveInterval: (interval) =>
        set((state) => {
          state.system.autoSaveInterval = interval;
        }),
      setOverscroll: (enabled) =>
        set((state) => {
          state.system.overscroll = enabled;
        }),

      // Bulk update actions
      updateTypography: (settings) =>
        set((state) => {
          Object.assign(state.typography, settings);
        }),
      updateVisual: (settings) =>
        set((state) => {
          Object.assign(state.visual, settings);
        }),
      updateBehavior: (settings) =>
        set((state) => {
          Object.assign(state.behavior, settings);
        }),
      updateSystem: (settings) =>
        set((state) => {
          Object.assign(state.system, settings);
        }),

      // Reset
      resetToDefaults: () =>
        set(() => ({
          ...getDefaultEditorSettings(),
        })),
    })),
    {
      name: "stolink-editor-settings",
      version: 2,
      partialize: (state) => ({
        typography: state.typography,
        visual: state.visual,
        behavior: state.behavior,
        system: state.system,
      }),
      migrate: (persistedState, version) => {
        // Reset to defaults if version mismatch or corrupted state
        if (version < 2 || !persistedState) {
          return getDefaultEditorSettings();
        }
        // Merge with defaults to fill any missing properties
        const defaults = getDefaultEditorSettings();
        const state = persistedState as Partial<EditorSettings>;
        return {
          typography: { ...defaults.typography, ...state.typography },
          visual: { ...defaults.visual, ...state.visual },
          behavior: { ...defaults.behavior, ...state.behavior },
          system: { ...defaults.system, ...state.system },
        };
      },
    }
  )
);
