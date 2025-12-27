# AI 코드 리뷰 수정 - 챕터 트리 DnD 개선

## Issue Description

PR #48에서 AI 코드 리뷰에서 지적된 여러 이슈 수정

### 🔴 치명적 이슈

1. **TreeItem.tsx:77-94** - 중복된 DnD Sensors 정의
   - 파일: `src/components/editor/sidebar/TreeItem.tsx`
   - 에러 유형: 🔴 치명적
   - 문제: KeyboardSensor와 중복 정의가 부모 ChapterTree와 충돌 가능

2. **TreeItem.tsx:113-120** - handleChildDragEnd에서 에러 핸들링 부재
   - 문제: 잘못된 인덱스 발생 시 silent fail

### ⚠️ 경고 이슈

1. **useTreeItemMenu.ts:9** - 미사용 `hasChildren` 파라미터
   - 문제: 복제/변환 기능 삭제 후 미사용 파라미터 잔존

2. **TreeItem.tsx:75-76** - childIds useMemo 의존성 불완전
   - 문제: 깊은 비교 부재로 불필요한 re-render 가능

## Solution Strategy

### 1. Sensors 단순화

KeyboardSensor 제거, PointerSensor만 사용 (중첩 컨텍스트에서 불필요)

#### 변경 전

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

#### 변경 후

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }),
);
```

### 2. 에러 로깅 추가

#### 변경 전

```tsx
if (oldIndex !== -1 && newIndex !== -1) {
  // ... reorder logic
}
```

#### 변경 후

```tsx
if (oldIndex === -1 || newIndex === -1) {
  console.error("Invalid drag indices:", {
    oldIndex,
    newIndex,
    activeId: active.id,
    overId: over.id,
  });
  return;
}
// ... reorder logic
```

### 3. 미사용 파라미터 제거

#### 변경 전

```tsx
interface UseTreeItemMenuProps {
  node: ChapterNode;
  hasChildren: boolean; // ❌ 미사용
  // ...
}
```

#### 변경 후

```tsx
interface UseTreeItemMenuProps {
  node: ChapterNode;
  // hasChildren 제거
  // ...
}
```

### 4. childIds 의존성 안정화

#### 변경 전

```tsx
const childIds = useMemo(
  () => node.children?.map((c) => c.id) || [],
  [node.children],
);
```

#### 변경 후

```tsx
const childIds = useMemo(() => {
  return node.children?.map((c) => c.id) ?? [];
}, [node.children?.length, node.children?.map((c) => c.id).join(",")]);
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run type-check` 성공
- **검증 방법**: 타입 체크 통과, 드래그 앤 드롭 기능 동작 확인
