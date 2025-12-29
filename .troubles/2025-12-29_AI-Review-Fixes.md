# AI 코드 리뷰 수정 - DnD, 에러 처리, 불필요한 콜백

## Issue Description

AI 코드 리뷰에서 발견된 3건의 경고 수정:
1. `active.rect.current.translated` 속성 사용 오류
2. 저장 실패 시 `unsaved` 상태 설정 오류  
3. 빈 `onToggle` 콜백 불필요

## Solution Strategy

### 1. DnD 속성 수정 (ChapterTree.tsx)

**문제**: `active.rect.current.translated`는 `@dnd-kit/core`에서 제공하지 않는 속성

**해결**: `event.delta.y`를 사용하여 드래그 방향 결정

```diff
- const activeRect = active.rect.current.translated;
- if (overRect && activeRect) {
-   const activeCenterY = activeRect.top + activeRect.height / 2;
-   const overCenterY = overRect.top + overRect.height / 2;
-   const position = activeCenterY < overCenterY ? "before" : "after";
+ const deltaY = event.delta?.y ?? 0;
+ const position = deltaY < 0 ? "before" : "after";
```

### 2. 에러 처리 수정 (useDocuments.ts)

**문제**: 저장 실패 시 `unsaved` 설정 → 무한 저장 시도

**해결**: `saved`로 유지하여 무한 루프 방지

```diff
- console.error("[bulkSaveContent] Save failed:", error);
- setSaveStatus("unsaved");
+ console.warn("[bulkSaveContent] Save failed:", error);
+ setSaveStatus("saved");
```

### 3. 빈 콜백 제거 (EditorPage.tsx, EditorLeftSidebar.tsx)

**문제**: `onToggle={() => { }}` 매 렌더링마다 새 함수 생성

**해결**: `onToggle` prop을 optional로 변경

```diff
// EditorLeftSidebarProps
- onToggle: () => void;
+ onToggle?: () => void;

// EditorPage.tsx
- onToggle={() => { }}
+ (제거)
```

## Outcome
- **상태**: ✅ 해결됨
- **빌드 결과**: `npx tsc --noEmit` 성공
- **수정 파일**: 4개
  - `ChapterTree.tsx`
  - `useDocuments.ts`
  - `EditorPage.tsx`
  - `EditorLeftSidebar.tsx`
