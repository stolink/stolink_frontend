# ProjectLayout.tsx AI 코드 리뷰 수정

## Issue Description

AI 코드 리뷰에서 3건의 이슈가 발견되었습니다.

### 🔴 치명적 (1건)
- 파일: `src/components/layouts/ProjectLayout.tsx`
- 라인: 123
- 에러 유형: 번들링 후 이미지 로드 실패
- 문제: `/src/assets/main_logo.png`는 번들링 후 존재하지 않는 경로

### ⚠️ 경고 (2건)
1. **useShallow 불필요** (라인 45-47): 단일 값 선택에 불필요한 복잡성
2. **useMemo null 안전 처리** (라인 56-68): 참조 변경 시 불필요한 재생성 방지 필요

## Solution Strategy

### 변경 전

```tsx
// 이미지 경로 (번들링 후 깨짐)
src="/src/assets/main_logo.png"

// useShallow 불필요한 사용
const localDocuments = useDocumentStore(
  useShallow((state) =>
    Object.values(state.documents).filter((doc) => doc.projectId === id)
  )
);

// null 안전 처리 미흡
if (!localDocuments || localDocuments.length === 0) {
  return [];
}
return localDocuments
  .filter((doc: Document) => doc.type === "text")
```

### 변경 후

```tsx
// import 방식으로 변경 (번들링 호환)
import mainLogo from "@/assets/main_logo.png";
src={mainLogo}

// useShallow 제거, useMemo로 필터링
const allDocuments = useDocumentStore((state) => state.documents);
const localDocuments = useMemo(
  () => Object.values(allDocuments).filter((doc) => doc.projectId === id),
  [allDocuments, id]
);

// null 안전 처리 및 타입 가드 추가
return (localDocuments ?? [])
  .filter((doc): doc is Document => doc?.type === "text")
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
```

## Outcome
- **상태**: ✅ 해결됨
- **빌드 결과**: `npx tsc --noEmit` 성공
- **검증 방법**: TypeScript 컴파일 에러 없음 확인
