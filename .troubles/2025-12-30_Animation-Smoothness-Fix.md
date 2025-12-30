# Animation Smoothness Fix

## Issue Description

검색 결과로 이동하거나 줌 버튼을 클릭했을 때 발생하는 애니메이션 전환이 부드럽지 않고 끊기는(Stuttering) 현상.
기존에는 Transition 애니메이션 중 부드러운 갱신을 보장하기 위해 `requestAnimationFrame` 스로틀링을 우회하고 `setZoomState`를 즉시 호출했음. 의도와 달리, 이는 복잡한 그래프 컴포넌트의 과도한 리렌더링을 유발하여 메인 스레드를 점유, 오히려 애니메이션 프레임 드랍을 초래함.

- 파일: `src/hooks/useCharacterGraphZoom.ts`

## Solution Strategy

Transition 중에도 일반 줌/패닝과 동일하게 **RAF 스로틀링을 강제 적용**하도록 변경.
D3는 별도의 Timer 루프에서 DOM(`transform`)을 부드럽게 업데이트하므로, React State(`zoomState`) 업데이트 빈도를 모니터 주사율에 맞춰 제한(Throttle)하는 것이 전체적인 퍼포먼스와 시각적 부드러움을 향상시킴.

### 변경 전

```typescript
// Transition 중이면 즉시 업데이트 (RAF 스킵)
if (isTransitioningRef.current) {
  setZoomState(newState);
  onZoomChange?.(newState);
} else {
  // ... RAF ...
}
```

### 변경 후

```typescript
// 항상 RAF 스로틀링 적용 (성능 최적화)
if (rafIdRef.current === null) {
  rafIdRef.current = requestAnimationFrame(() => {
    setZoomState({ ...latestStateRef.current });
    onZoomChange?.(latestStateRef.current);
    rafIdRef.current = null;
  });
}
```

## Outcome

- **상태**: ✅ 해결됨
- **검증**: 검색 이동 및 줌 버튼 클릭 시 끊김 없는 부드러운 애니메이션 확인.
