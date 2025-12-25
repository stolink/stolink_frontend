# StoLink 프로젝트 아키텍처

> **최종 수정**: 2024년 12월 25일
> **기술 스택**: React 19 + TypeScript + Vite 7 + Zustand 5

---

## 개요

**StoLink**는 작가용 AI 기반 스토리 관리 플랫폼입니다.

- 복선 관리, 캐릭터 관계도, 세계관 설정, 일관성 체크
- 대상: 장편 소설 작가 (방대한 세계관 관리 필요)

---

## 디렉토리 구조

```
src/
├── App.tsx               # 라우팅 설정
├── main.tsx              # 엔트리포인트
├── index.css             # 전역 스타일
│
├── api/                  # API 클라이언트
├── assets/               # 정적 리소스
├── components/           # 컴포넌트
│   ├── common/           # 공통 (Footer, Modal 등)
│   ├── editor/           # 에디터 관련
│   │   ├── sidebar/      # 🆕 사이드바 컴포넌트 (6개)
│   │   │   ├── ChapterTree.tsx
│   │   │   ├── TreeItem.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── NodeIcon.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── TiptapEditor.tsx
│   │   ├── SectionStrip.tsx
│   │   ├── ScriveningsEditor.tsx
│   │   ├── OutlineView.tsx
│   │   └── ...
│   ├── graph/            # 관계도 (React Flow)
│   ├── layouts/          # 레이아웃 (3개)
│   ├── library/          # 서재 관련
│   │   ├── BookCard.tsx
│   │   └── ImportBookCard.tsx  # 🆕 책 가져오기
│   └── ui/               # shadcn/ui (15개)
│
├── data/                 # 목 데이터, 상수
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 (cn, utils)
├── pages/                # 페이지 컴포넌트 (9개)
├── repositories/         # 🆕 Repository 패턴
│   ├── DocumentRepository.ts
│   └── LocalDocumentRepository.ts
├── services/             # 🆕 서비스 레이어
│   └── exportService.ts  # EPUB/PDF/TXT 내보내기
├── stores/               # Zustand 스토어 (5개)
├── styles/               # 추가 스타일
└── types/                # TypeScript 타입 (7개)
```

---

## 라우팅 구조

```
/ ─────────────── LandingPage (공개)
/auth ─────────── AuthPage (공개)
/editor/demo ──── EditorPage (데모, 인증 불필요)

/library ──────── LibraryPage ─── ProtectedLayout
/projects/:id ─── ProjectLayout
    ├── /editor ── EditorPage
    ├── /studio ── StudioPage
    ├── /world ─── WorldPage
    ├── /stats ─── StatsPage
    ├── /export ── ExportPage  # 🆕 내보내기 페이지
    └── /settings ─ SettingsPage
```

---

## 상태 관리 (Zustand)

### 스토어 개요

| 스토어           | 역할                            | 미들웨어  |
| ---------------- | ------------------------------- | --------- |
| `useAuthStore`   | 인증 상태, 토큰 관리            | `persist` |
| `useEditorStore` | 현재 프로젝트/챕터, 에디터 상태 | -         |
| `useUIStore`     | 사이드바, 모달, 테마            | -         |
| `useSceneStore`  | Scene CRUD, 캐릭터/복선 연결    | `immer`   |
| `useDemoStore`   | 데모 모드 데이터                | -         |

### useEditorStore (업데이트)

```typescript
{
  currentProjectId: string | null;
  currentChapterId: string | null;
  // 🆕 분할 화면
  splitView: {
    enabled: boolean;
    direction: "horizontal" | "vertical";
  };
  // 🆕 집중 모드
  isFocusMode: boolean;
  // 🆕 줌 레벨
  zoom: number;  // 50-200%
  // Actions
  toggleSplitView();
  toggleFocusMode();
  setZoom(level: number);
}
```

---

## 데이터 타입

### 핵심 엔티티 관계

```
Project (작품)
    ├── Document[] (문서, 계층 구조)
    │       ├── type: "folder" | "text"
    │       ├── characterIds[] ──────┐
    │       └── foreshadowingIds[] ──┤
    │                                │
    ├── Character[] (캐릭터) ◀───────┘
    │       └── Relationship[]
    │
    ├── Foreshadowing[] (복선)
    │
    ├── Place[] (장소)
    │
    └── Item[] (아이템)
            └── currentOwnerId → Character
```

---

## 주요 의존성

### Core

| 패키지         | 버전 | 용도           |
| -------------- | ---- | -------------- |
| React          | 19.2 | UI 라이브러리  |
| TypeScript     | 5.9  | 타입 시스템    |
| Vite           | 7.3  | 빌드 도구      |
| Zustand        | 5.0  | 상태 관리      |
| TanStack Query | 5.90 | 서버 상태 관리 |

### Editor

| 패키지     | 용도                                  |
| ---------- | ------------------------------------- |
| Tiptap     | 리치 텍스트 에디터 (ProseMirror 기반) |
| dnd-kit    | 드래그앤드롭 (챕터 트리)              |
| React Flow | 캐릭터 관계도 그래프                  |

### 🆕 Export

| 패키지     | 용도             |
| ---------- | ---------------- |
| jspdf      | PDF 생성         |
| epub-gen   | EPUB 생성 (예정) |
| file-saver | 파일 다운로드    |

---

## 컴포넌트 구조

### 🆕 Editor Sidebar 컴포넌트 (6개)

```
src/components/editor/sidebar/
├── index.ts          # Export 모음
├── types.ts          # ChapterNode, 유틸리티
├── NodeIcon.tsx      # 타입별 아이콘 (Folder, BookOpen, FileText, Lightbulb)
├── ContextMenu.tsx   # 재사용 가능한 우클릭 메뉴
├── TreeItem.tsx      # 트리 아이템 (hover F2, 상태 점)
└── ChapterTree.tsx   # 메인 컴포넌트
```

**TreeItem 기능:**

- 싱글 클릭 = 선택
- 더블 클릭 = 인라인 이름 변경
- 우클릭 = 객체 컨텍스트 메뉴
- 빈 공간 우클릭 = 컨테이너 컨텍스트 메뉴
- F2 키 = hover 상태에서 이름 변경
- 상태 표시 점 (todo/inProgress/done/revised)

### Editor 컴포넌트 (12개)

- `TiptapEditor`: 메인 리치 텍스트 에디터 (줌 50-200%)
- `SectionStrip`: 하단 섹션 카드 네비게이션
- `ScriveningsEditor`: 통합 편집 모드
- `OutlineView`: 테이블 기반 아웃라인
- `EditorLeftSidebar`: 좌측 챕터 트리 래퍼
- `EditorRightSidebar`: 우측 패널 (복선, AI, 일관성)
- `ForeshadowingPanel`: 복선 관리 패널
- `AIAssistantPanel`: AI 어시스턴트
- `ConsistencyPanel`: 일관성 체크

---

## 개발 워크플로우

### 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run type-check   # TypeScript 검사
npm run format       # Prettier
```

### Git Hooks (Husky)

- `pre-commit`: lint-staged (ESLint + Prettier)
- `pre-push`: type-check
- `commit-msg`: commitlint (컨벤셔널 커밋)

### 브랜치 전략

```
release ──── 프로덕션
main ─────── 개발 통합, QA
feature/* ── 기능 개발
fix/* ────── 버그 수정
```

---

## 현재 진행 상태

### Phase 1 (완료)

- [x] Scene 타입 정의
- [x] useSceneStore 생성
- [x] SceneInspector 패널
- [x] Section Strip 구현
- [x] Scrivenings 뷰

### Phase 2 (완료) 🆕

- [x] 사이드바 컴포넌트 분리 (sidebar/)
- [x] Context-Sensitive Menu 구현
- [x] 에디터 줌 기능 (50-200%)
- [x] 텍스트 가져오기 (TXT/MD) + 스마트 정리
- [x] 내보내기 서비스 (PDF/EPUB/TXT)

### Phase 3 (예정)

- [ ] 스냅샷/버전 관리
- [ ] 통계 대시보드
- [ ] 드래그 앤 드롭 순서 변경
