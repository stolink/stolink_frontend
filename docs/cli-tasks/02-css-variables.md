# Task 02: CSS Variables for Editor Styling

> **Objective**: Define the CSS variables that drive the editor's appearance, corresponding to the store settings.

## Context

- **Target File**: `src/styles/editor-variables.css` (New File)
- **Integration**: Import this in `src/index.css`.

## Requirements

1. **Define Root Variables**
   Define default values for:
   - `--st-editor-font-family`
   - `--st-editor-font-size`
   - `--st-editor-line-height`
   - `--st-editor-text-indent`
   - `--st-editor-bg-color`
   - `--st-editor-text-color`
   - `--st-editor-caret-color`
   - `--st-editor-selection-color`
   - `--st-editor-width`

2. **Define Theme Classes**
   - `.theme-stolink`: Default variables.
   - `.theme-dark`: Dark mode overrides.
   - `.theme-paper`: Paper texture background and serpy text color.

3. **Utility Function (`src/lib/editor-styles.ts`)**
   - Create a function `getEditorStyles(settings: EditorSettings): CSSProperties`
   - This function maps the Zustand store state to a helper object that can be passed to `<div style={...} />`.

## Execution Steps

1. Create `src/styles/editor-variables.css`.
2. Add `@import "./editor-variables.css";` to `src/index.css`.
3. Create helper `src/lib/editor-styles.ts`.
