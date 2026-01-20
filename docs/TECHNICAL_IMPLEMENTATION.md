# StoLink 기술 구현 상세 문서

> **버전**: 1.0
> **최종 수정**: 2026년 1월 20일
> **목적**: 프론트엔드 핵심 기술 구현의 개괄적 정리

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           StoLink Frontend                              │
├─────────────────────────────────────────────────────────────────────────┤
│  React 19.2 + TypeScript 5.7 + Vite 7.2                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│  │   Pages     │   │  Components │   │    Hooks    │   │  Services   │ │
│  │   (14개)    │   │   (100+)    │   │   (36개)    │   │   (20개)    │ │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘ │
│         │                │                 │                 │         │
│         └────────────────┴─────────────────┴─────────────────┘         │
│                                   │                                     │
│  ┌────────────────────────────────┴──────────────────────────────────┐ │
│  │                      State Management                              │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐  │ │
│  │  │    Zustand    │  │ TanStack Query│  │   IndexedDB (idb)     │  │ │
│  │  │  (17 stores)  │  │  (서버 상태)   │  │  (증분 분석 버퍼)      │  │ │
│  │  └───────────────┘  └───────────────┘  └───────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                   │                                     │
│  ┌────────────────────────────────┴──────────────────────────────────┐ │
│  │                        Core Modules                                │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐  │ │
│  │  │    Tiptap     │  │    D3.js      │  │   React Three Fiber   │  │ │
│  │  │   (Editor)    │  │   (Graph)     │  │      (3D Effects)     │  │ │
│  │  └───────────────┘  └───────────────┘  └───────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                   │                                     │
│                                [Axios]                                  │
│                                   ↓                                     │
│                         Backend API (Spring)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 핵심 모듈별 구현

### 2.1 에디터 시스템 (Tiptap)

**위치**: `src/components/editor/`

#### 주요 컴포넌트

| 컴포넌트                 | 크기 | 역할                     |
| ------------------------ | ---- | ------------------------ |
| `TiptapEditor.tsx`       | 38KB | 메인 에디터 (줌 50-200%) |
| `AIAssistantPanel.tsx`   | 31KB | AI 어시스턴트 패널       |
| `ForeshadowingPanel.tsx` | 26KB | 복선 관리 패널           |
| `ExportModal.tsx`        | 24KB | 내보내기 모달            |
| `InsightsPanel.tsx`      | 18KB | AI 인사이트 패널         |

#### 커스텀 익스텐션 (16개)

```
extensions/
├── CharacterMention.ts      # @캐릭터 멘션 자동완성
├── CharacterNodeView.tsx    # 캐릭터 노드 렌더링
├── CharacterHoverCard.tsx   # 호버 카드 UI
├── ForeshadowingSuggest.ts  # #복선 자동완성
├── SlashCommand.tsx         # / 명령어 팔레트
├── TypewriterScroll.ts      # 타자기 모드 (현재 라인 중앙)
├── FocusMode.ts             # 집중 모드
├── LinguisticFocus.ts       # 언어학적 포커스
├── SmartPunctuation.ts      # 스마트 구두점 변환
├── SectionDivider.ts        # 섹션 구분선
└── AutoFormatter.ts         # 자동 포맷팅
```

#### 자동저장 흐름

```typescript
// 디바운스 기반 자동저장
User Input → debounce(500ms) → saveContent() → API PATCH
                                    ↓
                           IndexedDB Buffer (증분 분석용)
```

---

### 2.2 캐릭터 관계도 (D3.js → Canvas)

**위치**: `src/components/CharacterGraph/`

#### 아키텍처 진화

```
v1.0: React Flow (노드 기반)
  ↓
v2.0: D3.js Force Simulation (SVG)
  ↓
v3.0: Canvas Rendering (고성능) ← 현재
```

#### 주요 컴포넌트

| 컴포넌트                   | 역할                      |
| -------------------------- | ------------------------- |
| `index.tsx`                | 메인 컨테이너 (45KB)      |
| `CanvasGraph/`             | Canvas 렌더러 (10개 파일) |
| `NodeRenderer.tsx`         | SVG 노드 렌더링           |
| `LinkRenderer.tsx`         | 관계 링크 렌더링          |
| `AnalysisSummaryModal.tsx` | AI 분석 결과 모달 (54KB)  |

#### 물리 시뮬레이션 훅

```typescript
useCharacterGraphSimulation; // D3 Force 물리 엔진
useCharacterGraphDrag; // 노드 드래그
useCharacterGraphZoom; // SVG 줌/팬
useCharacterGraphResize; // 컨테이너 리사이즈
useRelationshipLinks; // 관계 → 링크 변환
useNetworkSimulation; // 네트워크 레이아웃
```

#### 관계 타입 색상

| 관계     | 색상 | HEX       |
| -------- | ---- | --------- |
| Friendly | 초록 | `#15803D` |
| Hostile  | 빨강 | `#F44336` |
| Romantic | 핑크 | `#FF4081` |

---

### 2.3 상태 관리

#### Zustand 스토어 (17개)

| 스토어                   | 역할               | 미들웨어            |
| ------------------------ | ------------------ | ------------------- |
| `useAuthStore`           | 인증 상태          | persist             |
| `useEditorStore`         | 에디터 UI 상태     | -                   |
| `useEditorSettingStore`  | 에디터 설정        | persist             |
| `useUIStore`             | 전역 UI 상태       | -                   |
| `useForeshadowingStore`  | 복선 상태          | -                   |
| `useChapterStore`        | 챕터 상태          | -                   |
| `useSceneStore`          | 씬 상태            | immer               |
| `useAnalysisBufferStore` | **증분 분석 버퍼** | persist (IndexedDB) |
| `useManuscriptJobStore`  | 원고 작업 상태     | -                   |
| `useNotificationStore`   | 알림 상태          | -                   |
| `useSnapshotStore`       | 스냅샷 상태        | -                   |
| `useWritingStatsStore`   | 집필 통계          | -                   |
| `useDemoStore`           | 데모 모드          | -                   |

#### TanStack Query 패턴

```typescript
// Query Key 팩토리 패턴
const projectKeys = {
  all: ["projects"] as const,
  list: (params?: P) => [...projectKeys.all, "list", params] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

// Optimistic Update with Rollback
useMutation({
  mutationFn: updateProject,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
    const previous = queryClient.getQueryData(projectKeys.detail(id));
    queryClient.setQueryData(projectKeys.detail(id), newData);
    return { previous };
  },
  onError: (_err, _new, context) => {
    queryClient.setQueryData(projectKeys.detail(id), context?.previous);
  },
});
```

---

### 2.4 증분 분석 시스템 (SSE + IndexedDB)

#### 데이터 흐름

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Editor    │ → │  IndexedDB Buffer │ → │  Backend    │
│  (입력)     │    │  (로컬 버퍼링)    │    │  (분석)     │
└─────────────┘    └──────────────────┘    └─────────────┘
                           │                      │
                           │   10,000자 or 30분    │
                           └──────────────────────┘
                                    ↓
                              SSE 스트림
                                    ↓
                           ┌─────────────┐
                           │ 분석 결과   │
                           │ UI 업데이트 │
                           └─────────────┘
```

#### 버퍼 설정

```typescript
const CONFIG = {
  MIN_CHARS_FOR_AUTO_FLUSH: 10_000, // 자동 플러시 글자 수
  MIN_INTERVAL_MS: 30 * 60 * 1000, // 30분 최소 간격
};
```

#### 중복 분석 방지

```typescript
// Content Hash 비교
const currentHash = aiService.calculateContentHash(content);
const lastHash = lastAnalyzedHashes[documentId];

if (currentHash === lastHash) {
  return; // 스킵
}
```

---

### 2.5 내보내기 시스템

**위치**: `src/services/exportService.ts`

#### 지원 형식

| 형식     | 라이브러리         | 상태 |
| -------- | ------------------ | ---- |
| PDF      | jspdf, html2pdf.js | ✅   |
| DOCX     | docx               | ✅   |
| EPUB     | epub-gen-memory    | ✅   |
| Markdown | turndown           | ✅   |
| TXT      | 내장               | ✅   |

#### 비동기 작업 패턴

```typescript
// Job Polling
POST /api/projects/:id/export → { jobId, status: 'processing' }
GET  /api/exports/:jobId      → { status, progress, downloadUrl }
```

---

## 3. 디자인 시스템

### 컬러 팔레트 (Mocha & Cloud)

| Token        | HEX       | 용도       |
| ------------ | --------- | ---------- |
| Mocha 500    | `#A47764` | Primary    |
| Mocha 400    | `#BD9B8D` | Hover      |
| Mocha 700    | `#7D5A4B` | Active     |
| Cloud 50     | `#F1F0EC` | Background |
| Espresso 900 | `#3D302A` | Text       |

### 타이포그래피

| 용도    | 폰트             |
| ------- | ---------------- |
| Heading | DM Serif Display |
| Body    | Spectral         |
| UI      | Pretendard       |

---

## 4. 폴더 구조 요약

```
src/
├── api/            # Axios 클라이언트 (1)
├── components/     # 컴포넌트 (100+)
│   ├── editor/     # 에디터 (28개 + extensions/)
│   ├── CharacterGraph/ # 관계도 (20개 + CanvasGraph/)
│   ├── ui/         # shadcn/ui (31개)
│   ├── common/     # 공통 (11개)
│   ├── library/    # 서재 (10개)
│   └── ...
├── hooks/          # 커스텀 훅 (36개)
├── services/       # API 서비스 (20개)
├── stores/         # Zustand 스토어 (17개)
├── types/          # TypeScript 타입 (21개)
├── pages/          # 페이지 (14개)
├── lib/            # 유틸리티 (12개)
├── data/           # 목/상수 데이터
├── design-system/  # 디자인 토큰
└── repositories/   # 로컬 저장소 (5개)
```

---

## 5. 개발 도구

| 도구              | 용도            |
| ----------------- | --------------- |
| Vite              | 개발 서버, 빌드 |
| Vitest            | 단위 테스트     |
| Playwright        | E2E 테스트      |
| Storybook         | 컴포넌트 문서화 |
| ESLint + Prettier | 코드 품질       |
| Husky             | Git Hooks       |

---

## 관련 문서

| 문서                                              | 설명           |
| ------------------------------------------------- | -------------- |
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 전체 아키텍처  |
| [TECHSTACK.md](./architecture/TECHSTACK.md)       | 기술 스택 상세 |
| [DATA_MODEL.md](./spec/DATA_MODEL.md)             | 데이터 모델    |
| [API_SPEC.md](./spec/API_SPEC.md)                 | API 명세       |
| [SPEC.md](./spec/SPEC.md)                         | 기능 명세      |
