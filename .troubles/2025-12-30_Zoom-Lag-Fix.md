# Zoom Lag Fix

## Issue Description

드래그 기능 개선(`isDragging` state 추가) 후 줌인/줌아웃 시 심각한 렉 발생.
`CharacterGraph` 컴포넌트가 줌 상태(`zoomState`) 변경으로 인해 리렌더링될 때마다 `useDrag`에 전달되는 `onDragStart`/`onDragEnd` 콜백 함수가 새로 생성됨. 이로 인해 `useDrag` 훅 내부의 `useEffect`가 불필요하게 실행되어 D3 이벤트 리스너가 매 프레임 해제 및 재등록되는 오버헤드 발생.

- 파일: `src/components/CharacterGraph/index.tsx`
- 증상: 줌 제스처 시 화면이 끊기거나 프레임 드랍 발생

## Solution Strategy

`onDragStart`, `onDragEnd` 핸들러를 `useCallback`으로 감싸 메모이제이션(Memoization) 처리. 이를 통해 컴포넌트 리렌더링 시에도 핸들러 참조를 유지하여 `useDrag` 내부의 불필요한 로직 실행을 방지함.

### 변경 전

```typescript
const { dragBehavior } = useDrag({
  simulation,
  onDragStart: () => setIsDragging(true), // 매번 새로운 함수 생성
  onDragEnd: () => setIsDragging(false),
});
```

### 변경 후

```typescript
const onDragStart = useCallback(() => setIsDragging(true), []);
const onDragEnd = useCallback(() => setIsDragging(false), []);

const { dragBehavior } = useDrag({
  simulation,
  onDragStart,
  onDragEnd,
});
```

## Outcome

- **상태**: ✅ 해결됨
- **검증**: 줌 조작 시 CPU 부하 감소 및 부드러운 프레임 유지 확인.
