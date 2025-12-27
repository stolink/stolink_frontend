# AI Code Review Fixes: Hooks & UI Stability

## Issue Description

Critical issues flagged by AI code review:

1. **`useDuplicateProject` (Hooks)**: Missing promise return in `onSuccess`. This could lead to race conditions where the UI doesn't wait for the list reload to complete.
2. **`LibraryPage.tsx` (UI)**: Potential safety issue with `renameTarget` when the rename modal is open. If `renameTarget` is null while open, it could crash or behave unexpectedly.

- 파일: `src/hooks/useProjects.ts`, `src/pages/library/LibraryPage.tsx`
- 에러 유형: 🔴 치명적 (Potential Runtime Error / Race Condition)

## Solution Strategy

1. **Hooks**: Ensure `invalidateQueries` promise is returned to chain correctly with `mutateAsync`.
2. **UI**: Force the Rename Modal to close (or not render) if `renameTarget` is null.

### 변경 전

```typescript
// src/hooks/useProjects.ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
},

// src/pages/library/LibraryPage.tsx
<AlertDialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
```

### 변경 후

```typescript
// src/hooks/useProjects.ts
onSuccess: () => {
  return queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
},

// src/pages/library/LibraryPage.tsx
<AlertDialog
  open={renameModalOpen && !!renameTarget}
  onOpenChange={setRenameModalOpen}
>
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공
- **검증 방법**:
  - `npm run build` passed (Type safety confirmed).
  - Code review points addressed.
