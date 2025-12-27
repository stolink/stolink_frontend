# SectionStrip Drag Interaction & Accessibility Fixes

## Issue Description

### 1. 드래그 핸들 클릭 불가 (🔴 치명적)

- **증상**: 사용자가 섹션 카드 내의 드래그 핸들(grip icon)을 클릭하거나 드래그하려고 해도 동작하지 않음.
- **원인**: 카드 Header 영역에 `pointer-events-none` 클래스가 적용되어 있어, 자식 요소인 드래그 핸들의 이벤트까지 차단됨. 또한 클릭 오버레이(`z-0`)와 헤더(`z-10`)의 레이어 중첩 문제로 인해 이벤트 타겟팅이 모호함.
- **파일**: `src/components/editor/SectionStrip.tsx`

### 2. 접근성 미흡 (⚠️ 경고)

- **증상**: 키보드 사용자가 카드를 선택했을 때(`Tab` 포커스), 현재 선택 여부를 스크린 리더가 알 수 없고, `onClick`만 있어 키보드 조작(`Enter`/`Space`)이 불가능함.
- **원인**: `aria-pressed` 속성 누락 및 키보드 이벤트 핸들러 부재.

### 3. 데이터 동기화 안정성 부족 (⚠️ 경고)

- **증상**: 드래그 앤 드롭으로 순서를 바꾼 후, 간헐적으로 서버 데이터와 프론트엔드 데이터가 불일치할 가능성 존재.
- **원인**: `reorderDocuments` 실행 후 `queryClient.invalidateQueries`를 호출하지 않아 React Query 캐시가 갱신되지 않음.
- **파일**: `src/hooks/useDocuments.ts`

## Solution Strategy

### 1. 드래그 핸들 상호작용 개선

- 드래그 핸들 `div`에 `pointer-events-auto` 클래스를 추가하여 부모의 `pointer-events-none`을 오버라이드.
- 이를 통해 헤더 영역은 클릭을 통과시키지만(아래의 카드 선택 영역으로), 드래그 핸들은 직접 이벤트를 받아 드래그 동작이 가능해짐.

### 2. 접근성 강화

- 클릭 오버레이 `div`에 `aria-pressed={isSelected}` 속성 추가.
- `onKeyDown` 핸들러를 추가하여 `Enter` 또는 `Space` 키 입력 시 `onClick`과 동일한 동작 수행.
- 클릭 영역에 `cursor-pointer` 및 `role="button"` 명시.

### 3. 데이터 동기화 로직 보완

- `reorderDocuments` 함수 내에서 API 호출 성공 시 `queryClient.invalidateQueries({ queryKey: ["documents", projectId] })`를 호출하도록 수정.
- 낙관적 업데이트 실패 시 롤백 로직 유지.

### 변경 코드 (SectionStrip.tsx)

```tsx
// 변경 전 (드래그 핸들)
<div
  {...listeners}
  className="p-1 -mr-2 cursor-grab active:cursor-grabbing hover:bg-stone-100 rounded-md transition-colors"
>

// 변경 후
<div
  {...listeners}
  className="p-1 -mr-2 cursor-grab active:cursor-grabbing hover:bg-stone-100 rounded-md transition-colors pointer-events-auto"
>
```

## Outcome

- **상태**: ✅ 해결됨
- **검증 방법**:
  - **UI 테스트**: 드래그 핸들을 잡고 카드를 이동시켰을 때 정상적으로 드래그 시작 및 완료 확인. 카드 클릭 시 선택 동작 확인.
  - **접근성 테스트**: 키보드 `Tab`으로 이동 후 `Enter` 키로 섹션 선택되는지 확인.
  - **데이터 테스트**: 네트워크 탭에서 `reorder` API 호출 성공 후 즉시 `documents` 쿼리가 refetch 되는지 확인.
