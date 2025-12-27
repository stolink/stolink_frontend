# PR #52 AI Code Review Fixes

## Issue Description

AI code review flagged several issues in the recent graph and World Page updates:

1. **API Response Unwrapping**: `getCharacters` was unwrapping `response.data.data` without validating the structure.
2. **ESC Key Hook Inefficiency**: The `useEffect` for the ESC key listener was re-registering on every `selectedCharacter` change due to suboptimal logic.
3. **Missing Ref (Historical)**: A `groupRef` was flagged as missing (though confirmed present in the latest code).

- Files: `src/services/graphApi.ts`, `src/pages/world/WorldPage.tsx`
- Error 유형: 🔴 치명적 / ⚠️ 경고

## Solution Strategy

1. **API Validation**: Added checks for `response.data` and `Array.isArray(response.data.data)` in `graphApi.ts`.
2. **Hook Optimization**: Added a guard `if (!selectedCharacter) return;` at the top of the ESC key `useEffect` to avoid unnecessary work and simplified the logic.

### 변경 전 (graphApi.ts)

```typescript
  getCharacters: async (): Promise<unknown[]> => {
    try {
      const response = await client.get<{ data: unknown[] }>("/api/characters");
      return response.data.data;
    } catch (error) { ... }
  },
```

### 변경 후 (graphApi.ts)

```typescript
  getCharacters: async (): Promise<unknown[]> => {
    try {
      const response = await client.get<{ data: unknown[] }>("/api/characters");
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error("Invalid API response format");
      }
      return response.data.data;
    } catch (error) { ... }
  },
```

### 변경 전 (WorldPage.tsx)

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && selectedCharacter) {
      setSelectedCharacter(null);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedCharacter]);
```

### 변경 후 (WorldPage.tsx)

```typescript
useEffect(() => {
  if (!selectedCharacter) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setSelectedCharacter(null);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedCharacter]);
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run type-check` 성공 (린트 에러는 외부 파일 건임)
- **검증 방법**: 브라우저에서 ESC 키 동작 확인 및 API 응답 처리 확인
