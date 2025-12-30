# AI 코드 리뷰: key prop 및 forceSave 에러 처리 수정

## Issue Description

AI 코드 리뷰에서 지적된 2가지 이슈를 수정했습니다.

### 🔴 치명적 - key prop 연산자 문제

- 파일: `src/pages/editor/components/EditorContent.tsx`
- 라인: 152, 184
- 에러 유형: 🔴 치명적

`key={selectedSectionId || "default"}`는 `selectedSectionId`가 빈 문자열("")일 때도 "default"로 폴백되어 컴포넌트가 의도치 않게 재생성되지 않을 수 있습니다.

### ⚠️ 경고 - forceSave 에러 처리 부재

- 파일: `src/pages/editor/hooks/useEditorHandlers.ts`
- 라인: 268-291
- 에러 유형: ⚠️ 경고

`forceSave()` 호출 시 에러가 발생하면 예외가 전파되어 섹션 생성이 중단될 수 있습니다.

## Solution Strategy

### key prop 수정

`||` 연산자 대신 `??` (nullish coalescing) 연산자를 사용하여 `null` 또는 `undefined`일 때만 폴백합니다.

### 변경 전

```tsx
key={selectedSectionId || "default"}
```

### 변경 후

```tsx
key={selectedSectionId ?? "empty"}
```

### forceSave 에러 처리 추가

try-catch로 감싸서 저장 실패 시에도 섹션 생성이 계속 진행되도록 했습니다.

### 변경 전

```typescript
await forceSave();
```

### 변경 후

```typescript
try {
  await forceSave();
} catch (error) {
  console.error(
    "[handleAddSection] Failed to save before creating section:",
    error,
  );
  // 저장 실패해도 섹션 생성은 계속 진행 (사용자 경험 우선)
}
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공 (33.23s)
- **검증 방법**: TypeScript 컴파일 및 Vite 프로덕션 빌드 통과
