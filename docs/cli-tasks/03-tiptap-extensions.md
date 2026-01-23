# Task 03: Advanced Tiptap Extensions + Legacy Logic Removal

> **Objective**: Implement sophisticated Tiptap extensions and **remove** any manual, hard-coded logic in the main editor component that previously handled these features.

## Requirements

### 1. Implement Extensions (extensions/)

- `TypewriterScroll.ts`: Logic for centered scrolling.
- `FocusMode.ts`: Logic for blurring non-active nodes.
- `LinguisticFocus.ts`: Logic for formatting dialogue vs narrative.
- `SmartPunctuation.ts`: Input rules for quotes and dashes.

### 2. Legacy Logic Cleanup (Target: `src/components/editor/TiptapEditor.tsx`)

- **Scan** `TiptapEditor.tsx` for manual implementations of Typewriter Scroll.
  - Look for `useEffect` hooks monitoring `selection` or `scroll` events that manually calculate `scrollTo`.
  - **DELETE** or Comment Out this manual logic. We are replacing it with `TypewriterScroll` extension.
- **Scan** for existing "Focus Mode" styling logic (e.g., dynamic classes applied to the editor wrapper based on state).
  - If found, remove it. The `FocusMode` extension will handle it via ProseMirror decorations.

## Execution Steps

1. Create the extension files in `src/components/editor/extensions/`.
2. **Modify** `src/components/editor/TiptapEditor.tsx`:
   - Remove the hardcoded scroll logic.
   - Remove conflicting `useEffect`s.
   - **Do NOT** register the new extensions yet (I will do that in integration). Just clean up the old code so it doesn't conflict.
