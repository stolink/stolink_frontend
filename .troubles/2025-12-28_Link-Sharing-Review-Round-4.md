# AI Code Review Fixes (Round 4) - Link Sharing

## Issue Description

The fourth round of AI review identified persisting and new issues:

1.  🔴 **Explicit Any**: `SharedProjectPage.tsx` uses `(item as any).id` which bypasses type safety.
2.  🔴 **Optional ShareId**: `shareId` usage in `key` prop lacks undefined check.
3.  🔴 **Runtime Safety**: `project.documents` is accessed without array check before traversal.
4.  ⚠️ **Hooks Rule**: `SettingsPage.tsx` has a conditional return before hook calls.
5.  ⚠️ **Async Refetch**: `setTimeout(() => refetch(), 0)` is not the best practice; should use `await refetch()`.

- Files: `src/pages/share/SharedProjectPage.tsx`, `src/pages/settings/SettingsPage.tsx`
- Type: 🔴 Critical / ⚠️ Warning

## Solution Strategy

### 1. Fix Type Casting (SharedProjectPage)

- Use `Record<string, unknown>` casting instead of `any`.

### 2. Fix ShareId & Runtime Safety (SharedProjectPage)

- Add early return if `!shareId`.
- Add `Array.isArray(project.documents)` check in `useMemo`.

### 3. Fix Logic (SharedProjectPage)

- Change `handlePasswordSubmit` to `async` and `await refetch()`.

### 4. Fix Hooks Rule (SettingsPage)

- Move `if (!projectId)` check _after_ all hook calls.

## Outcome

- **Status**: ✅ Resolved
- **Verification**: `npm run type-check` passed. Manual validation of logic.
