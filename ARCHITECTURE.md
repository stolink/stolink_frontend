# StoLink 프로젝트 아키텍처

> **최종 수정**: 2024년 12월
> **기술 스택**: React 19 + TypeScript + Vite + Zustand

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
│   ├── editor/           # 에디터 관련 (8개)
│   ├── graph/            # 관계도 (React Flow)
│   ├── layouts/          # 레이아웃 (3개)
│   ├── library/          # 서재 관련 (2개)
│   └── ui/               # shadcn/ui (15개)
│
├── data/                 # 목 데이터, 상수
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 (cn, utils)
├── pages/                # 페이지 컴포넌트 (9개)
├── stores/               # Zustand 스토어 (5개)
├── styles/               # 추가 스타일
└── types/                # TypeScript 타입 (7개)
```

---

## 라우팅 구조

```
/ ─────────────── LandingPage (공개)
/auth ─────────── AuthPage (공개)
/demo ─────────── EditorPage (데모, 인증 불필요)

/library ──────── LibraryPage ─── ProtectedLayout
/projects/:id ─── ProjectLayout
    ├── /editor ── EditorPage
    ├── /studio ── StudioPage
    ├── /world ─── WorldPage
    ├── /stats ─── StatsPage
    ├── /export ── ExportPage
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

### useAuthStore

```typescript
{
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser(user, token);
  logout();
  setLoading(loading);
}
// persist: localStorage에 인증 정보 저장
```

### useEditorStore

```typescript
{
  currentProjectId: string | null;
  currentChapterId: string | null;
  chapters: Chapter[];
  content: string;
  saveStatus: "saved" | "saving" | "unsaved";
  chapterTree: ChapterTreeNode[];
  expandedNodes: string[];
  // Actions
  setCurrentProject(id);
  setCurrentChapter(id);
  setChapters(chapters);
  setContent(content);
  buildChapterTree(chapters);
}
```

### useUIStore

```typescript
{
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: "foreshadowing" | "ai" | "consistency";
  createProjectModalOpen: boolean;
  theme: "light" | "dark";
  // Actions
  toggleLeftSidebar();
  toggleRightSidebar();
  setTheme(theme);
}
```

### useSceneStore (신규)

```typescript
{
  scenes: Record<string, Scene>;
  // CRUD
  createScene(input);
  updateScene(id, updates);
  deleteScene(id);
  // 조회
  getScenesByChapter(chapterId);
  getScenesWithCharacter(charId);
  // 연결
  addCharacterToScene(sceneId, charId);
  addForeshadowingToScene(sceneId, fsId);
}
```

---

## 데이터 타입

### 핵심 엔티티 관계

```
Project (작품)
    ├── Chapter[] (챕터, 계층 구조)
    │       └── Scene[] (씬, 실제 집필 단위)
    │               ├── characterIds[] ──────┐
    │               └── foreshadowingIds[] ──┤
    │                                        │
    ├── Character[] (캐릭터) ◀───────────────┘
    │       └── Relationship[]
    │
    ├── Foreshadowing[] (복선)
    │
    ├── Place[] (장소)
    │
    └── Item[] (아이템)
            └── currentOwnerId → Character
```

### 주요 타입

| 파일               | 타입                                                        |
| ------------------ | ----------------------------------------------------------- |
| `project.ts`       | Project, Genre, ProjectStatus, ProjectStats                 |
| `chapter.ts`       | Chapter, ChapterType, ChapterTreeNode                       |
| `scene.ts`         | Scene, SceneMetadata, SceneStatus                           |
| `character.ts`     | Character, CharacterRole, Relationship, Place, Item         |
| `foreshadowing.ts` | Foreshadowing, ForeshadowingStatus, ForeshadowingAppearance |
| `auth.ts`          | User, LoginInput, RegisterInput                             |

---

## 주요 의존성

### Core

| 패키지         | 버전 | 용도           |
| -------------- | ---- | -------------- |
| React          | 19.2 | UI 라이브러리  |
| TypeScript     | 5.9  | 타입 시스템    |
| Vite           | 7.2  | 빌드 도구      |
| Zustand        | 5.0  | 상태 관리      |
| TanStack Query | 5.90 | 서버 상태 관리 |

### UI

| 패키지        | 용도                                  |
| ------------- | ------------------------------------- |
| Tailwind CSS  | 스타일링                              |
| Radix UI      | Headless 컴포넌트 (Dialog, Select 등) |
| Lucide React  | 아이콘                                |
| Framer Motion | 애니메이션                            |

### Editor

| 패키지     | 용도                                  |
| ---------- | ------------------------------------- |
| Tiptap     | 리치 텍스트 에디터 (ProseMirror 기반) |
| dnd-kit    | 드래그앤드롭 (챕터 트리)              |
| React Flow | 캐릭터 관계도 그래프                  |

### Form & Validation

| 패키지          | 용도        |
| --------------- | ----------- |
| React Hook Form | 폼 관리     |
| Zod             | 스키마 검증 |

---

## 컴포넌트 구조

### Layouts (3개)

- `ProtectedLayout`: 인증 필요 라우트 래퍼
- `ProjectLayout`: 프로젝트 내비게이션 (에디터, 설정집, 통계...)
- `MainLayout`: 기본 레이아웃

### Editor 컴포넌트 (8개)

- `TiptapEditor`: 메인 리치 텍스트 에디터
- `ChapterTree`: 좌측 폴더/문서 트리
- `SceneInspector`: 우측 씬 메타데이터 패널
- `ForeshadowingPanel`: 복선 관리 패널
- `AIAssistantPanel`: AI 어시스턴트

### UI 컴포넌트 (15개)

- shadcn/ui 기반 (Button, Dialog, Input, Select...)
- Radix UI primitives 래핑

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

### Phase 2 (예정)

- [ ] 복선 추적 시스템 개선
- [ ] 분할 화면
- [ ] Corkboard 뷰

### Phase 3 (예정)

- [ ] 스냅샷/버전 관리
- [ ] 통계 대시보드
