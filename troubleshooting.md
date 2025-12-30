# Troubleshooting Log

| Date       | Issue                         | Status      | Note                                                                                              |
| ---------- | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------- |
| 2025-12-27 | AI Review Fixes (Hooks & UI)  | ✅ Resolved | Fixed `useDuplicateProject` return value and `renameTarget` safety in LibraryPage                 |
| 2025-12-28 | PR #52 AI Review Fixes        | ✅ Resolved | Added API response validation and optimized ESC key handler in WorldPage                          |
| 2025-12-28 | PR #53 AI Review Fixes        | ✅ Resolved | Fixed projectId guard, extracted useRelationshipLinks, removed logs                               |
| 2025-12-28 | PR #56 AI Review Fixes        | ✅ Resolved | Extracted `UseForceSimulationOptionsWithGrouping` interface; 3 critical issues already resolved   |
| 2025-12-28 | PR #67 AI Review Fixes        | ✅ Resolved | Fixed critical type safety and runtime error issues in SharedProjectPage, and improved UX         |
| 2025-12-28 | PR #67 AI Review Round 2      | ✅ Resolved | Addresses rigorous type safety in recursive traverse and fixes query enabled logic                |
| 2025-12-28 | PR #67 AI Review Round 3      | ✅ Resolved | Addresses subtle query refetch issues, enhanced type guards, and clipboard error handling         |
| 2025-12-28 | PR #67 AI Review Round 4      | ✅ Resolved | Fixed strict type safety (any), runtime array checks, and hooks rule violation in SettingsPage    |
| 2025-12-28 | PR #67 AI Review Round 5      | ✅ Resolved | Implemented `isPasswordSubmitted` state pattern, strict `useParams`, and `AlertDialog` for delete |
| 2025-12-28 | Build Fix (SharedProjectPage) | ✅ Resolved | Updated `useSharedProject` hook signature to support `retry` option, fixing build failure         |
| 2025-12-28 | PR #69 AI Review Fixes        | ✅ Resolved | Used `axios.isAxiosError` for type-safe 404 handling, added `onError` handler for cache strategy  |
| 2025-12-28 | PR #69 AI Review Round 2      | ✅ Resolved | Moved 404 error handling to `shareService` layer, removed axios import from hook                  |
| 2025-12-29 | PR #73 AI Review Fixes        | ✅ Resolved | Fixed critical missing `onToggle` prop in `EditorLeftSidebar` and added DnD UX improvement TODO   |
| 2025-12-30 | PR #78 AI Review Fixes        | ✅ Resolved | Fixed key prop `                                                                                  |     | `→`??`, added try-catch for `forceSave()`in`handleAddSection` |
