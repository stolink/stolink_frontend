# SlashCommand any 타입 개선

## Issue Description

`tippy` 플러그인에서 `any` 타입 사용으로 인해 타입 안정성이 떨어지는 문제

- 파일: `src/components/editor/extensions/SlashCommand.tsx`
- 라인: 143
- 에러 유형: 🔴 치명적

## Solution Strategy

`any` 타입을 `Record<string, unknown>`으로 변경하여 타입 안전성 개선

### 변경 전

```tsx
let component: ReactRenderer<CommandListRef, any>;
```

### 변경 후

```tsx
let component: ReactRenderer<CommandListRef, Record<string, unknown>>;
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run dev` 정상 구동
- **검증 방법**: TypeScript 컴파일 에러 없음 확인
