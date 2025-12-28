# AI Code Review Fixes (Round 5) - Link Sharing

## Issue Description

The fifth round of AI review identified persisting and new issues:

1.  🔴 **Query Logic**: `useSharedProject` enabled condition supposedly incomplete (though debatable for public links). Suggests better state management.
2.  🔴 **useParams Safety**: `useParams` uses optional type but default value `""` is passed to API, potentially causing 404s/400s instead of client-side error.
3.  ⚠️ **State Duplication**: `password` vs `passwordInput` state management could be cleaner.
4.  ⚠️ **Confirm Dialog**: Native `confirm()` is discouraged.
5.  ⚠️ **Navigation**: `history.back()` is unpredictable.

- Files: `src/pages/share/SharedProjectPage.tsx`, `src/pages/settings/SettingsPage.tsx`
- Type: 🔴 Critical / ⚠️ Warning

## Solution Strategy

### 1. Fix Query Logic & State (SharedProjectPage)

- Consolidate password state management using `isPasswordSubmitted`.
- Ensure `enabled` logic is sound.
- Use explicit navigation (`location.href = '/'`) for close.

### 2. Fix useParams (SettingsPage)

- Use strict `useParams<{ id: string }>()`.
- Ensure `projectId` is checked before passing to hooks (or use skipToken pattern if feasible, but simply checking existence before render or passing `null` to disable hook is standard).
- _Correction_: To verify `projectId` before hooks, we might need a wrapper or just rely on `enabled: !!projectId` inside the hooks if they support it. The previous fix moved the check _after_ hooks (which complied with rules of hooks) but then passed `projectId || ""` to query. We should pass `projectId` and ensure the query is disabled if undefined.
- Actually, `useShareSettings` likely accepts `string`.
- Better: `const shareSettings = useShareSettings(projectId!, { enabled: !!projectId })`.

### 3. Replace Confirm (SettingsPage)

- Use `AlertDialog` component if available, or just ignore if it's too much boilerplate for a "warning". (Workflow: "Warnings are mandatory to fix").
- I will implement `AlertDialog`.

## Outcome

- **Status**: ✅ Resolved
- **Verification**: `npm run type-check` passed. Logic verified.
