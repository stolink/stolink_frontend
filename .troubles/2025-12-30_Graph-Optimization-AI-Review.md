# AI Review Fixes: Graph Optimization

## Issue Description

AI 코드 리뷰(PR #77)에서 발견된 성능 최적화 및 안정성 이슈 해결.

1. **D3 Select Overhead**: `tick` 핸들러 내에서 `d3.select(this)`를 반복 호출하여 불필요한 객체 생성 오버헤드 발생.
2. **Memory Leak**: `groupSelectionCache`가 언마운트 시 cleanup되지 않아 메모리 누수 위험.
3. **Hardcoded Constants**: `alphaTarget` 값이 하드코딩되어 일관성 저하.

## Solution Strategy

### 1. D3 Selection 최적화 (`index.tsx`)

`d3.select(this).attr(...)` 대신 Native DOM method `this.setAttribute(...)`를 직접 사용하여 오버헤드 제거.

**변경 전:**

```typescript
linkSel.each(function (d) {
  d3.select(this).attr("x1", source.x);
  // ...
});
```

**변경 후:**

```typescript
linkSel.each(function (d) {
  this.setAttribute("x1", String(source.x ?? 0));
  // ...
});
```

### 2. Cache Cleanup (`index.tsx`)

`useEffect`의 cleanup 함수에서 캐시를 명시적으로 초기화.

```typescript
useEffect(() => {
  return () => {
    groupSelectionCache.current.clear();
  };
}, []);
```

### 3. 상수 관리 (`constants.ts`, `useCharacterGraphDrag.ts`)

`ANIMATION.reheatStrength` 상수 추가 및 적용.

## Outcome

- **상태**: ✅ 해결됨
- **검증**: `npm run build` 성공, 로컬 테스트 시 그래프 드래그 및 애니메이션 정상 동작 확인.
