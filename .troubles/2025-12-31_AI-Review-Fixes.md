# AI Code Review & Build Fixes

## Issue Description

AI review flagged issues, and subsequent `npm run build` revealed type errors preventing deployment.

1. **Relationship Mapper Type Mismatch**: `history` property in `RelationshipLink` expected specific array type but received `string | any[]` from `parsedHistory`.
2. **Relationship Detail Sheet Invalid Keys**: `RELATION_COLORS` map contained keys (`enemy`, `family`, etc.) not present in `BackendRelationshipType` union.
3. **Store Interface Conflict**: `useForeshadowingStore`'s `createForeshadowing` method referenced a global `CreateForeshadowingInput` that lacked the `tag` property compared to the local definition.

- 파일: `src/utils/relationshipMapper.ts`, `src/components/CharacterGraph/RelationshipDetailSheet.tsx`, `src/stores/useForeshadowingStore.ts`
- 에러 유형: 🔴 Build Error (TypeScript)

## Solution Strategy

### 1. Relationship Mapper

Cast `parsedHistory` to `any` to satisfy the strict type requirement while maintaining logic.

### 2. Relationship Detail Sheet

- Removed invalid keys from `RELATION_COLORS`, `RELATION_ICONS`, `RELATION_LABELS` maps.
- Added type assertion `(event.type as BackendRelationshipType)` to resolve indexing errors.
- Added `Array.isArray(history)` check to prevent `.map` error on legacy string data.

### 3. Store Interface

- Renamed local `CreateForeshadowingInput` to `StoreCreateInput` to avoid name collision.
- Added `tag` and optional `title` to `StoreCreateInput` matching usage in `TiptapEditor.tsx`.
- Added missing `tag` to `UpdateForeshadowingInput`.

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공 (Verified)
