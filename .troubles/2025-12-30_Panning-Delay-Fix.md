# Panning Delay Fix (Background Drift)

## Issue Description

그래프 화면 이동(Panning) 시 배경(`TiledBackground`)이 그래프 요소보다 미세하게 늦게 따라오거나 흔들리는 현상(Drift/Jittering) 발생.
원인은 **Double RAF(RequestAnimationFrame)** 구조:

1. `useZoom` 훅에서 `zoomState` 업데이트를 RAF로 스로틀링 (1차 지연)
2. `TiledBackground` 컴포넌트가 `zoomState` 변경을 감지하고 다시 RAF를 호출하여 렌더링 (2차 지연)

이로 인해 배경 렌더링이 D3의 즉각적인 DOM 변형보다 약 2~3프레임(30~50ms) 뒤쳐지게 됨.

- 파일: `src/components/CharacterGraph/TiledBackground.tsx`

## Solution Strategy

`TiledBackground` 내부의 중복된 `requestAnimationFrame`을 제거. 이미 상위(`useZoom`)에서 적절한 주기로(약 60fps) Props를 업데이트해주고 있으므로, 하위 컴포넌트는 Props 변경 즉시 동기적으로 렌더링하는 것이 올바름.

### 변경 전

```typescript
useEffect(() => {
  // ...
  pendingRafRef.current = requestAnimationFrame(() => {
    renderRef.current?.(zoomStateRef.current);
  });
}, [zoomState]);
```

### 변경 후

```typescript
useEffect(() => {
  // ...
  // 즉시 호출 (지연 제거)
  if (renderRef.current) {
    renderRef.current(zoomState);
  }
}, [zoomState]);
```

## Outcome

- **상태**: ✅ 해결됨
- **검증**: Panning 시 배경과 그래프 노드 간의 이격 사라짐 확인.
