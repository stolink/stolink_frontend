# Task 04: Editor Settings UI Panel + Legacy Component Removal

> **Objective**: Build the comprehensive `EditorSettingsPanel` and remove any old, temporary settings modals or buttons.

## Requirements

### 1. Build `EditorSettingsPanel.tsx`

- Implement the comprehensive settings form using `shadcn/ui` and `useEditorSettingStore`.

### 2. Legacy Cleanup

- **Search** for old settings components, for example:
  - `src/components/editor/SettingsModal.tsx`
  - `src/components/editor/ViewOptions.tsx`
  - Any "Typewriter Toggle" button directly in the Toolbar.
- **Action**:
  - If `SettingsModal.tsx` exists and is purely for the old settings, **DELETE** the file.
  - If `ViewOptions.tsx` exists, **DELETE** it if it's redundant.
  - If you delete them, ensure you remove their imports from `EditorPage.tsx` or `Toolbar.tsx` to prevent build errors. (You can comment out the import usage).

## Execution Steps

1. Create `src/components/editor/settings/EditorSettingsPanel.tsx`.
2. Delete/Refactor identified legacy setting components.
3. Fix broken imports caused by deletion (comment them out).
