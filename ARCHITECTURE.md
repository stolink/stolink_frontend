# StoLink 프로젝트 아키텍처

> **최종 수정**: 2024년 12월 25일
> **기술 스택**: React 19 + TypeScript + Vite 7 + Zustand 5

---

## 개요

**StoLink**는 작가용 AI 기반 스토리 관리 플랫폼입니다.

- 복선 관리, 캐릭터 관계도, 세계관 설정, 일관성 체크
- 대상: 장편 소설 작가 (방대한 세계관 관리 필요)

> 📖 상세 기술 스택 → [TECHSTACK.md](./TECHSTACK.md)
> 📋 기능 명세 → [SPEC.md](./SPEC.md)
> 🗂️ 데이터 모델 → [DATA_MODEL.md](./DATA_MODEL.md)

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
│   │   ├── sidebar/      # 사이드바 컴포넌트 (6개)
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
│   │   └── ImportBookCard.tsx
│   └── ui/               # shadcn/ui (15개)
│
├── data/                 # 목 데이터, 상수
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 (cn, utils)
├── pages/                # 페이지 컴포넌트 (9개)
├── repositories/         # Repository 패턴
│   ├── DocumentRepository.ts
│   └── LocalDocumentRepository.ts
├── services/             # 서비스 레이어
│   └── exportService.ts
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
    ├── /export ── ExportPage
    └── /settings ─ SettingsPage
```

---

## 상태 관리 (Zustand)

| 스토어                  | 역할                         | 미들웨어  |
| ----------------------- | ---------------------------- | --------- |
| `useAuthStore`          | 인증 상태, 토큰 관리         | `persist` |
| `useEditorStore`        | 프로젝트/챕터, 분할화면, 줌  | -         |
| `useUIStore`            | 사이드바, 모달, 테마         | -         |
| `useSceneStore`         | Scene CRUD, 캐릭터/복선 연결 | `immer`   |
| `useDemoStore`          | 데모 모드 데이터             | -         |
| `useForeshadowingStore` | 복선 CRUD, 등장 위치         | -         |
| `useChapterStore`       | 챕터 CRUD                    | -         |

### useEditorStore 상세

```typescript
{
  currentProjectId: string | null;
  currentChapterId: string | null;
  splitView: {
    enabled: boolean;
    direction: "horizontal" | "vertical";
  }
  isFocusMode: boolean;
  zoom: number; // 50-200%
}
```

---

## 컴포넌트 구조

### Editor Sidebar (6개)

| 컴포넌트      | 역할                             |
| ------------- | -------------------------------- |
| `ChapterTree` | 메인 트리 컨테이너               |
| `TreeItem`    | 개별 노드 (클릭/더블클릭/우클릭) |
| `ContextMenu` | 재사용 우클릭 메뉴               |
| `NodeIcon`    | 타입별 아이콘                    |
| `types.ts`    | ChapterNode 타입, 유틸리티       |

### Editor 컴포넌트 (12개)

| 컴포넌트             | 역할                      |
| -------------------- | ------------------------- |
| `TiptapEditor`       | 메인 에디터 (줌 50-200%)  |
| `SectionStrip`       | 하단 섹션 카드 네비게이션 |
| `ScriveningsEditor`  | 통합 편집 모드            |
| `OutlineView`        | 테이블 기반 아웃라인      |
| `EditorLeftSidebar`  | 좌측 챕터 트리 래퍼       |
| `EditorRightSidebar` | 우측 패널                 |
| `ForeshadowingPanel` | 복선 관리                 |
| `AIAssistantPanel`   | AI 어시스턴트             |
| `ConsistencyPanel`   | 일관성 체크               |

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

### Phase 2 (완료)

- [x] 사이드바 컴포넌트 분리 (sidebar/)
- [x] Context-Sensitive Menu 구현
- [x] 에디터 줌 기능 (50-200%)
- [x] 텍스트 가져오기 (TXT/MD) + 스마트 정리
- [x] 내보내기 서비스 (PDF/EPUB/TXT)

### Phase 3 (예정)

- [ ] 스냅샷/버전 관리
- [ ] 통계 대시보드
- [ ] 드래그 앤 드롭 순서 변경
