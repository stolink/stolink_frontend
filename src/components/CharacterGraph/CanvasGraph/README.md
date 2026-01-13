# CharacterGraph Canvas 버전

Canvas 기반 고성능 캐릭터 관계도 컴포넌트 (1000+ 노드 지원)

## 📦 설치 완료

```bash
npm install react-force-graph  # ✅ 설치됨
```

## ✅ 구현 상태

- ✅ **Phase 1-2 완료** (2026-01-09)
  - TypeScript type check 통과
  - 모든 타입 정의 완료
  - react-force-graph-2d 타입 선언 추가
  - Canvas 노드/링크 렌더러 구현
  - UI 통합 (NetworkControls, TimelineSlider, SearchOverlay)

## 🗂️ 파일 구조

```
src/components/CharacterGraph/CanvasGraph/
├── index.tsx                # 메인 컴포넌트 (ForceGraph2D 래퍼)
├── CanvasNodeRenderer.ts    # 노드 Canvas 드로잉 함수
├── CanvasLinkRenderer.ts    # 링크 Canvas 드로잉 함수
├── useImageCache.ts         # 이미지 프리로딩 훅
├── types.ts                 # Canvas 전용 타입
└── README.md                # 이 파일
```

## 🚀 사용 방법

### 기본 사용

```typescript
import { CharacterGraphCanvas } from "@/components/CharacterGraph/CanvasGraph";

function WorldPage() {
  const { data: characters } = useCharacters(projectId);
  const links = extractRelationshipLinks(characters);

  return (
    <CharacterGraphCanvas
      characters={characters}
      links={links}
      onNodeClick={(character) => console.log(character)}
      selectedNodeId={selectedCharacterId}
    />
  );
}
```

### Feature Flag로 SVG ↔ Canvas 전환

```typescript
// .env.local
VITE_USE_CANVAS_GRAPH=true

// WorldPage.tsx
const useCanvasGraph = import.meta.env.VITE_USE_CANVAS_GRAPH === "true";

{useCanvasGraph ? (
  <CharacterGraphCanvas {...props} />
) : (
  <CharacterGraph {...props} />  {/* 기존 SVG 버전 */}
)}
```

## ✨ 구현된 기능

### Phase 1-2 완료 ✅

#### 노드 렌더링
- [x] 동적 크기 계산 (protagonist: 100px, default: 50px, +relationCount 보너스)
- [x] 글로우/펄스 효과 (선택/하이라이트)
- [x] 선택 링 (2.5px stroke)
- [x] Faction 테두리 링 (점선, 해시 기반 색상)
- [x] 이미지 아바타 (원형 클리핑)
- [x] 이니셜 아바타 (역할별 그라데이션 + 이니셜)
- [x] 상태 배지 (사망☠, 부상⚡, 실종👁)
- [x] 변경 배지 (new: +, updated: ✓)
- [x] 줌 반응형 라벨 (globalScale > 0.35)

#### 링크 렌더링
- [x] Layer 2: 그림자 (입체감)
- [x] Layer 3: 외부 글로우
- [x] Layer 4: 기본 선 (관계 타입별 색상, 강도별 굵기)
- [x] Layer 5: 흐름 애니메이션 (requestAnimationFrame)
- [x] Layer 6: 상단 반사 하이라이트
- [x] Bezier 곡선 (curvature 지원)
- [x] AI Insights (Tension, Logic Check)

#### UI 통합
- [x] NetworkControls (필터, 주요 캐릭터만, AI Insights)
- [x] TimelineSlider (4D 타임라인)
- [x] CharacterSearchOverlay (검색 하이라이트)
- [x] 이미지 프리로딩 및 캐싱

## 🎨 시각적 품질

기존 SVG 버전과 동일:
- Mocha/Cloud 디자인 시스템 준수
- 역할별 색상 (protagonist: Sage Green, antagonist: Russet Red)
- 관계 타입별 색상 (friendly: Green, hostile: Red, romantic: Emerald)
- 상태별 배지 색상

## 📊 성능 목표

| 노드 수 | 목표 FPS | 초기 로드 |
|--------|---------|----------|
| 100    | 60 fps  | < 500ms  |
| 500    | 60 fps  | < 1s     |
| 1000   | 50+ fps | < 2s     |

**최적화 설정**:
- `warmupTicks: 50` - 초기 레이아웃 사전 계산
- `cooldownTicks: 200` - 시뮬레이션 조기 종료
- 이미지 캐싱으로 매 프레임 로드 방지
- 단일 `animationPhase` 상태로 RAF 호출 최소화

## 🔧 다음 단계 (Phase 3+)

### Phase 3: 고급 링크 렌더링
- [ ] Layer 7: 충돌 아이콘 (DOM 오버레이)
- [ ] 복합 관계 (Super-edge segments)
- [ ] 네트워크 붕괴 시각화 (rippleDelay)

### Phase 4: 상호작용 개선
- [ ] 링크 클릭 → Deep Analysis 모달
- [ ] 링크 호버 → 툴팁
- [ ] 더 정확한 히트 테스팅 (Bezier 곡선)

### Phase 5: 검증 & 배포
- [ ] A/B 테스트 (SVG vs Canvas)
- [ ] 성능 벤치마크
- [ ] 시각적 회귀 테스트
- [ ] 기존 SVG 버전 deprecation

## 📝 타입 정의

```typescript
interface CharacterGraphCanvasProps {
  characters: Character[];
  links: RelationshipLink[];
  onNodeClick?: (character: Character | null) => void;
  onLinkClick?: (link: RelationshipLink | null) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: UIRelationType | "all";
  onFilterChange?: (filter: UIRelationType | "all") => void;
  highlightedNodeIds?: string[] | null;
  onSearchChange?: (matchingIds: string[] | null) => void;
  className?: string;
  showSearch?: boolean;
  onNodeDragEnd?: (node: CharacterNode) => void;
}
```

## 🐛 알려진 이슈

1. **React 19 호환성**: react-force-graph의 peer dependency 확인 필요
2. **CORS 이미지**: `crossOrigin: "anonymous"` 설정으로 해결
3. **애니메이션 성능**: 대규모 그래프에서 흐름 애니메이션 비활성화 옵션 필요

## 📚 참조

- **기존 SVG 구현**: `src/components/CharacterGraph/index.tsx`
- **NodeRenderer 로직**: `src/components/CharacterGraph/NodeRenderer.tsx`
- **LinkRenderer 로직**: `src/components/CharacterGraph/LinkRenderer.tsx`
- **디자인 시스템**: `src/components/CharacterGraph/constants.ts`
