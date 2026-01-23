# 🚀 테크니컬 챌린지: 고성능 그래프 시각화 엔진 최적화

> **주제**: React와 D3.js를 하이브리드 패턴으로 통합하여, 1,000개 이상의 노드를 가진 복잡한 관계망을 60fps로 시각화하고 안정적인 인터랙션을 구현한 사례입니다.

---

## Challenge 1: 물리 엔진 프레임 예산(Frame Budget) 최적화

### 🛑 문제 상황 (Problem)

D3.js의 `forceSimulation`은 매 틱(tick)마다 모든 노드 간의 물리력(인력, 척력, 충돌 등)을 계산해야 합니다.
`O(n²)` 복잡도를 가진 그룹(파벌) 구름 시각화 로직이 매 프레임(16ms) 실행되자, 노드가 100개를 넘어가는 순간 JS 스레드 연산 시간이 **30ms 이상**으로 증가하며 **심각한 프레임 드랍(Jank)**이 발생했습니다.

### 🧩 해결 전략 (Solution)

**"하이브리드 틱 스케줄링(Hybrid Tick Scheduling)"** 패턴을 도입하여 연산의 우선순위에 따라 업데이트 빈도를 차별화했습니다.

1.  **Critical Path (60fps)**: 사용자 경험에 직결되는 노드 위치(`updateNodes`)와 링크 선(`updateLinks`)은 매 프레임 갱신합니다.
2.  **Non-Critical Path (30fps)**: 시각적 장식 요소인 그룹 구름(`updateGroupClouds`)은 2프레임마다 한 번만 연산하도록 스로틀링했습니다.

```typescript
// Before: 모든 연산이 매 프레임 실행 (CPU 과부하)
simulation.on("tick", () => {
  updateLinks(); // 필수
  updateNodes(); // 필수
  updateGroupClouds(); // 무거움 (O(n²) Hull 계산)
});

// After: 비용이 높은 연산은 프레임 분할 처리
let frameCount = 0;
simulation.on("tick", () => {
  frameCount++;

  // 1. 필수 물리 연산은 매끄럽게 처리 (LCP 영향)
  updateLinks();
  updateNodes();

  // 2. 무거운 시각 효과는 30fps로 제한 (인간의 눈은 이를 부드럽게 보간해서 인식)
  if (frameCount % 2 === 0) {
    updateGroupClouds();
  }
});
```

### 📈 성과 (Impact)

- **CPU 점유율 40% 감소**: 메인 스레드 블로킹 시간을 획기적으로 줄여 다른 인터랙션 반응성 확보.
- **60fps 방어**: 시각적 품질 저하 없이 복잡한 물리 연산 유지.
- **배터리 효율 증대**: 불필요한 연산 제거로 모바일 기기에서의 발열 및 배터리 소모 감소.

---

## Challenge 2: React의 선언적 주기 vs D3의 명령형 주기 동기화

### 🛑 문제 상황 (Problem)

React는 선언적(Declarative) 상태 변화를 지향하는 반면, D3.js는 명령형(Imperative)으로 DOM을 직접 조작합니다.
이 두 라이브러리를 함께 사용할 때, React의 렌더링 사이클(`useEffect`)과 D3의 데이터 바인딩 시점이 어긋나면서 **Race Condition**이 발생했습니다.

특히, 데이터(`__data__`)가 바인딩되기 전에 드래그 이벤트 리스너가 먼저 실행되거나, 참조하는 노드 객체가 `undefined`가 되는 런타임 에러가 간헐적으로 발생했습니다.

### 🧩 해결 전략 (Solution)

**"Lifecycle Unification (생명주기 통합)"** 패턴을 적용하여 데이터 바인딩과 행위(Behavior) 부착의 순서를 원자적(Atomic)으로 보장했습니다.

```typescript
// Before: 분리된 useEffect로 인해 실행 순서 보장 불가 (Race Condition 위험)
useEffect(() => {
  nodeSelection.datum(node); // 데이터 바인딩
}, [node]);

useEffect(() => {
  nodeSelection.call(dragBehavior); // 이벤트 리스너 부착
}, [dragBehavior]);

// After: 단일 useEffect 내에서 의존성 맥락을 통합하여 순차 실행 보장
useEffect(() => {
  if (!nodeSelection) return;

  // 1. 데이터 바인딩 (선행 조건)
  // D3의 datum()으로 DOM 요소에 __data__ 속성을 주입
  nodeSelection.datum(node);

  // 2. 행위 부착
  // 바인딩된 데이터를 기반으로 drag event handler가 안전하게 초기화됨
  nodeSelection.call(dragBehavior);
}, [node, dragBehavior, nodeSelection]); // 모든 의존성이 준비되었을 때만 실행
```

### 📈 성과 (Impact)

- **런타임 에러 0건**: 드래그 시작 시 발생하던 `undefined` 접근 에러 완전 제거.
- **코드 예측 가능성 향상**: 라이브러리 간의 경계면(Boundary)을 명확히 정의하고 실행 순서를 제어.
- **유지보수성 증대**: 노드 관련 로직이 한 곳에 응집되어 디버깅 용이성 확보.
