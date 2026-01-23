# CharacterGraph 아키텍처

> **최종 수정**: 2026년 1월 20일
> 캐릭터 관계도 시각화 모듈 기술 문서

---

## 1. 개요

CharacterGraph는 D3.js Force Simulation과 Canvas 렌더링을 사용하는 **고성능 캐릭터 관계도 시각화 모듈**입니다.

### 기술 진화

```
v1.0: React Flow (노드 기반)
  ↓ 성능 이슈 (100+ 노드)
v2.0: D3.js Force Simulation (SVG)
  ↓ 렌더링 최적화 필요
v3.0: Canvas Rendering ← 현재
```

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                      CharacterGraph                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────┐ │
│  │  Data Layer     │    │  Physics Layer   │    │ Render     │ │
│  │  (TanStack Q)   │ → │  (D3 Force)      │ → │ (Canvas)   │ │
│  └─────────────────┘    └──────────────────┘    └────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Hooks (6개)                          │   │
│  │  useCharacterGraphSimulation   # Force 물리 엔진         │   │
│  │  useCharacterGraphDrag         # 노드 드래그              │   │
│  │  useCharacterGraphZoom         # 줌/팬 제어               │   │
│  │  useCharacterGraphResize       # 리사이즈 감지            │   │
│  │  useRelationshipLinks          # 관계→링크 변환           │   │
│  │  useNetworkSimulation          # 네트워크 레이아웃        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 디렉토리 구조

```
src/components/CharacterGraph/
├── index.tsx                    # 메인 컨테이너 (45KB)
├── constants.ts                 # 상수 정의
├── utils.ts                     # 유틸 함수
│
├── CanvasGraph/                 # 🆕 Canvas 렌더러 (10개)
│   ├── index.tsx                # Canvas 메인
│   ├── CanvasNodeRenderer.tsx   # 노드 렌더링
│   ├── CanvasLinkRenderer.tsx   # 링크 렌더링
│   └── ...
│
├── NodeRenderer.tsx             # SVG 노드 (폴백)
├── LinkRenderer.tsx             # SVG 링크 (폴백)
│
├── NetworkControls.tsx          # 컨트롤 패널 (18KB)
├── CharacterSearchOverlay.tsx   # 검색 오버레이 (16KB)
├── NodePreviewCard.tsx          # 노드 미리보기
│
├── AnalysisSummaryModal.tsx     # AI 분석 모달 (54KB)
├── AnalysisMiniCard.tsx         # 분석 미니 카드
├── AnalyticalInsights.tsx       # 분석 인사이트
│
├── CreateRelationshipDialog.tsx # 관계 생성 다이얼로그
├── ConflictAlertOverlay.tsx     # 충돌 알림
│
├── RelationshipDeepAnalysis/    # 관계 심층 분석 (6개)
│   ├── index.tsx
│   └── ...
│
├── RelationshipEventTooltip.tsx # 관계 이벤트 툴팁
├── RelationshipSummaryPanel.tsx # 관계 요약 패널
│
├── TiledBackground.tsx          # 타일 배경
├── TimelineSlider.tsx           # 타임라인 슬라이더
└── GraphEmptyState.tsx          # 빈 상태
```

---

## 4. D3 Force Simulation

### 물리 파라미터

```typescript
const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3
      .forceLink(links)
      .id((d) => d.id)
      .distance(150),
  )
  .force("charge", d3.forceManyBody().strength(-500))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(50));
```

### 훅 분리 패턴

| 훅                            | 역할                  | 상태                   |
| ----------------------------- | --------------------- | ---------------------- |
| `useCharacterGraphSimulation` | Force 시뮬레이션 코어 | `useSyncExternalStore` |
| `useCharacterGraphDrag`       | 드래그 인터랙션       | 이벤트 핸들러          |
| `useCharacterGraphZoom`       | 줌/팬 제어            | `d3.zoom()`            |
| `useCharacterGraphResize`     | 리사이즈 감지         | `ResizeObserver`       |

---

## 5. 관계 타입 색상

| 관계     | 색상 | HEX       | CSS 변수           |
| -------- | ---- | --------- | ------------------ |
| Friendly | 초록 | `#15803D` | `--color-friendly` |
| Hostile  | 빨강 | `#F44336` | `--color-hostile`  |
| Romantic | 핑크 | `#FF4081` | `--color-romantic` |

---

## 6. Canvas 렌더링 (v3.0)

### 선정 이유

- **성능**: 100+ 노드에서 SVG 대비 3-5배 빠름
- **GPU 가속**: 하드웨어 가속 렌더링
- **메모리 효율**: DOM 노드 수 최소화

### 구현 패턴

```typescript
// Canvas 렌더 루프
const render = () => {
  ctx.clearRect(0, 0, width, height);

  // 1. 링크 렌더링
  links.forEach((link) => drawLink(ctx, link));

  // 2. 노드 렌더링
  nodes.forEach((node) => drawNode(ctx, node));

  requestAnimationFrame(render);
};
```

---

## 7. AI 분석 연동

### 분석 결과 데이터 흐름

```
SSE Event (분석 완료) → useProjectSSE → AnalysisSummaryModal
                                              ↓
                                     CharacterGraph 업데이트
```

### 표시 데이터

- 캐릭터 등장 빈도
- 관계 강도 변화
- 충돌/모순 감지
- 인사이트 제안

---

## 관련 문서

| 문서                                                                                    | 설명                |
| --------------------------------------------------------------------------------------- | ------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                                                    | 전체 아키텍처       |
| [TECHSTACK.md](./TECHSTACK.md)                                                          | 기술 스택 (D3.js)   |
| [technical_case_study_canvas_migration.md](../technical_case_study_canvas_migration.md) | Canvas 마이그레이션 |
