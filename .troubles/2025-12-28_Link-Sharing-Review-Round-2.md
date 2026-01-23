# AI Code Review Fixes (Round 2) - Link Sharing

## Issue Description

The second round of AI review identified further issues:

1.  🔴 **Type Safety**: `SharedProjectPage.tsx` uses `as any` in `traverse`.
2.  🔴 **Query Logic**: `useSharedProject` enabled condition `!!shareId && (password !== "" || !error)` prevents initial fetch.
3.  ⚠️ **Type Definition**: `ApiError` should be global (or duplicate def).
4.  ⚠️ **Type Narrowing**: `SettingsPage.tsx` redundant `projectId` checks.

- Files: `src/pages/share/SharedProjectPage.tsx`, `src/pages/settings/SettingsPage.tsx`
- Type: 🔴 Critical / ⚠️ Warning

## Solution Strategy

### 1. Fix Type Safety in Traverse

Define `DocumentNode` interface matching the API response structure and use it for type assertion instead of `any`.

### 2. Fix Query Enabled Logic

Revert `enabled` to `!!shareId` to allow the initial "public" fetch. The query key change (password) will handle the re-fetch for authentication.

### 3. Simplify ProjectId Check

Use non-null assertion `projectId!` in handlers since we have an early return guard.

## Outcome

- **Status**: ✅ Resolved
- **Verification**: `npm run type-check` passed. Manual code review confirms logical fixes.
