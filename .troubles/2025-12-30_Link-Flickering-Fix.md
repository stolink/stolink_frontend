# Link Flickering Fix during Drag

## Issue Description

사용자가 그래프 노드를 드래그할 때 연결된 간선이 깜빡거리는(flickering) 현상 발생.
D3 시뮬레이션 중 간헐적으로 좌표가 `NaN`이나 `undefined`가 될 때, `setAttribute`에 잘못된 값이 들어가거나 `0`으로 강제 변환되어 시각적 결함 유발.

- 파일: `src/components/CharacterGraph/index.tsx`
- 증상: 드래그 시 링크가 순간적으로 사라지거나 좌상단(0,0)으로 튀는 현상

## Solution Strategy

`d3.force`의 `tick` 핸들러 내에서 좌표 유효성(`isNaN`, `undefined`)을 체크하는 방어 로직 추가. 유효하지 않은 좌표일 경우 해당 프레임의 업데이트를 건너뛰어 이전 위치를 유지함으로써 깜빡임 방지.

### 변경 후

```typescript
// 좌표가 유효하지 않으면 업데이트 건너뜀 (깜빡임 방지)
if (
  x1 === undefined ||
  y1 === undefined ||
  x2 === undefined ||
  y2 === undefined ||
  Number.isNaN(x1) ||
  Number.isNaN(y1) ||
  Number.isNaN(x2) ||
  Number.isNaN(y2)
) {
  return;
}

this.setAttribute("x1", String(x1));
// ...
```

## Outcome

- **상태**: ✅ 해결됨
- **검증**: 드래그 시 좌표가 튀는 현상 없이 부드럽게 연결 유지됨.

### 추가 수정 (Visibility Flickering)

- **증상**: 드래그 시 1단계 관계 필터링이 풀리며 링크 깜빡임.
- **원인**: 드래그 중 다른 노드 호버 이벤트 발생 -> `hoveredNodeId` 변경 -> 가시성 재계산.
- **해결**: `isDragging` 상태 추가, 드래그 중 `handleNodeHover` 차단.
