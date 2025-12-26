# BookCard ProjectStatus 타입 및 핸들러 개선

## Issue Description

AI 코드 리뷰에서 두 가지 치명적 이슈 발견:

1. **ProjectStatus 타입 불일치**
   - 파일: `src/components/library/BookCard.tsx`
   - 라인: 12-20
   - 에러 유형: 🔴 치명적
   - 문제: 대문자(`DRAFTING`, `COMPLETED`)와 소문자(`writing`, `completed`) 혼재

2. **편집 모드에서 onSelect 핸들러 누락 가능성**
   - 파일: `src/components/library/BookCard.tsx`
   - 라인: 99-116
   - 에러 유형: 🔴 치명적
   - 문제: `isEditMode=true`일 때 `onSelect`가 undefined일 수 있음

## Solution Strategy

### 1. ProjectStatus 타입 통일

대문자만 사용하고, 변환은 `normalizeStatus` 함수에서만 수행

#### 변경 전

```tsx
export type ProjectStatus =
  | "DRAFTING" | "OUTLINE" | "EDITING" | "COMPLETED" | "IDEA"
  | "writing" | "completed";
```

#### 변경 후

```tsx
export type ProjectStatus =
  | "DRAFTING" | "OUTLINE" | "EDITING" | "COMPLETED" | "IDEA";
```

### 2. normalizeStatus 함수 개선

문자열을 대문자로 변환 후 비교

#### 변경 전

```tsx
function normalizeStatus(status: ProjectStatus): ProjectStatusType {
  switch (status) {
    case "COMPLETED":
    case "completed":
      return "completed";
    // ...
  }
}
```

#### 변경 후

```tsx
function normalizeStatus(status: ProjectStatus | string): ProjectStatusType {
  const upperStatus = typeof status === "string" ? status.toUpperCase() : status;
  switch (upperStatus) {
    case "COMPLETED":
      return "completed";
    // ...
  }
}
```

### 3. onSelect 경고 추가

```tsx
if (isEditMode && !onSelect) {
  console.warn("BookCard: onSelect is required when isEditMode=true");
}
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run dev` 정상 구동
- **검증 방법**: 컴파일 에러 없음, 편집 모드 동작 정상
