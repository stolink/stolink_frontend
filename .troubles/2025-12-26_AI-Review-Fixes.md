# AI Code Review Fixes

## Issue Description

The AI Code Review identified several issues ranging from type safety and potential runtime errors to performance bottlenecks.

- **File**: `src/components/editor/SectionStrip.tsx`, `src/components/editor/ScriveningsEditor.tsx`, `src/components/editor/TiptapEditor.tsx`
- **Error Type**: 🔴 Critical (Type Safety, Null Handling), ⚠️ Warning (Hooks, Performance)

### Specific Issues:

1.  **Type Mismatch**: `onDelete` was optional in `SectionCardProps` but treated as mandatory in logic.
2.  **Null Safety**: `selectedFolderId` (nullable) was passed directly to a hook expecting a string or handled implicitly.
3.  **Stale Closure**: `ScriveningsEditor`'s `saveAll` callback was missing `onUpdate` dependency.
4.  **Performance**: `TiptapEditor` was logging heavy objects on every render.

## Solution Strategy

### 1. SectionStrip.tsx

**Change**: Made `onDelete` mandatory and added explicit null checking for `selectedFolderId`.

```tsx
// Before
onDelete?: () => void;
const { children } = useChildDocuments(selectedFolderId, projectId);

// After
onDelete: () => void;
const { children } = useChildDocuments(selectedFolderId ?? undefined, projectId);
if (!selectedFolderId) return <div>Select a folder</div>;
```

### 2. ScriveningsEditor.tsx

**Change**: Added missing dependency to `useCallback`.

```tsx
// Before
}, [editor, bulkSaveContent]);

// After
}, [editor, bulkSaveContent, onUpdate]);
```

### 3. TiptapEditor.tsx

**Change**: Removed verbose console logs.

## Outcome

- **Status**: ✅ Resolved
- **Verification**: Code compiles without type errors. `npm run dev` running.
