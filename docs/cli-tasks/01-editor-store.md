# Task 01: Editor Settings Store (Zustand + Zod) + Cleanup

> **Objective**: Create a centralized Zustand store for editor settings (`useEditorSettingStore`) and **migrate/cleanup** any legacy setting states scattered in other stores.

## Context

- **Spec**: `editor-enhance.md`
- **Target**: `src/stores/useEditorSettingStore.ts`
- **Legacy Target**: `src/stores/useEditorStore.ts` (Check for duplicates)

## Requirements

1.  **Create Store (`src/stores/useEditorSettingStore.ts`)**
    - Implement `EditorSettings` interface and store with `zustand/middleware/persist`.
    - **Settings to cover**:
      - Typography: `fontFamily`, `fontSize`, `lineHeight`, `indent`, `spacing`.
      - Visual: `theme`, `width`, `showLineNumbers`.
      - Behavior: `typewriterMode` ('center'/'top'/'off'), `focusMode`, `smartQuotes`, `linguisticMode`.

2.  **Legacy Cleanup (CRITICAL)**
    - **Scan** `src/stores/useEditorStore.ts`.
    - If it contains state like `isTypewriterMode`, `zoomLevel`, or `fontSize`, **REMOVE** those properties from `useEditorStore`.
    - Ensure we don't have two sources of truth for the same setting.
    - If you break any components by doing this, that's fine for now (we will fix them in the UI integration step), but try to keep the code compilable if possible.

## Execution Steps

1.  Create `src/stores/types/editorSettings.ts` (Zod Schema).
2.  Create `src/stores/useEditorSettingStore.ts`.
3.  **Refactor** `src/stores/useEditorStore.ts` to remove overlapping states.
