# Tech Stack Reference

> **AI 참조용**: 세션 중 기술 스택, 파일 구조, 명령어가 필요할 때 참조하세요.

## 실제 버전 정보

### Core Framework

- **React**: 19.2
- **TypeScript**: 5.9
- **Vite**: 7.2
- **Node**: v18+

### State Management

- **Zustand**: 5.0 (클라이언트 UI 상태)
- **TanStack Query**: 5.90 (서버 상태)
- **React Hook Form**: 7.69 (폼 상태)
- **immer**: 11.1 (불변성 미들웨어)

### UI & Styling

- **Tailwind CSS**: 3.4
- **shadcn/ui**: Latest (Radix UI 기반)
- **Radix UI**: Primitives
- **Framer Motion**: Latest (애니메이션)

### Editor

- **Tiptap**: 3.14 (ProseMirror 기반)
- **ProseMirror**: Core dependency
- **React Flow**: 11.11 (관계도 그래프)

### DnD & Interaction

- **dnd-kit**: 6.3 (챕터 트리 드래그앤드롭)

### Validation & Schema

- **Zod**: 4.2 (런타임 스키마 검증)

### Export

- **docx**: 문서 내보내기
- **jspdf**: PDF 내보내기
- **epub-gen-memory**: EPUB 내보내기

### Utilities

- **lodash-es**: ESM 버전
- **date-fns**: 날짜 처리
- **axios**: HTTP 클라이언트

### Backend

- **Spring Boot**: REST API 서버
- **PostgreSQL**: 관계형 DB (문서, 프로젝트, 사용자)
- **Neo4j**: 그래프 DB (캐릭터 관계도)
- **FastAPI**: AI 엔진 (LangGraph)
- **LLM**: GPT-4o, Claude 3.5

---

## 파일 구조 (src/)

```
src/
├── api/                 # API 클라이언트 (client.ts)
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트 (23개)
│   ├── editor/          # 에디터 관련 (27개)
│   │   ├── extensions/  # Tiptap Extensions
│   │   ├── Toolbar.tsx
│   │   └── Sidebar.tsx
│   ├── CharacterGraph/  # 관계도 (React Flow)
│   ├── common/          # 공통 (Footer, Modal 등 4개)
│   ├── library/         # 라이브러리 페이지 (3개)
│   └── layouts/         # 레이아웃 (3개)
├── hooks/               # ⭐ 커스텀 훅 (12개)
│   ├── useDocuments.ts  # 문서 CRUD (TanStack Query)
│   ├── useProjects.ts   # 프로젝트 관리
│   ├── useCharacters.ts # 캐릭터 관리
│   ├── useForeshadowing.ts # 복선 관리
│   ├── useAuth.ts       # 인증
│   ├── useAI.ts         # AI 기능
│   ├── useExport.ts     # 내보내기
│   ├── useJobPolling.ts # 비동기 작업 폴링
│   └── ...
├── services/            # ⭐ API 서비스 레이어 (12개)
│   ├── documentService.ts
│   ├── projectService.ts
│   ├── characterService.ts
│   ├── foreshadowingService.ts
│   ├── aiService.ts
│   ├── exportService.ts
│   └── ...
├── stores/              # ⭐ Zustand 스토어 (8개)
│   ├── useAuthStore.ts
│   ├── useEditorStore.ts
│   ├── useUIStore.ts
│   ├── useForeshadowingStore.ts
│   ├── useChapterStore.ts
│   ├── useSceneStore.ts
│   └── useDemoStore.ts
├── types/               # ⭐ 타입 정의 (9개)
│   ├── document.ts      # Document, DocumentMetadata
│   ├── project.ts       # Project, ProjectStats
│   ├── character.ts     # Character, CharacterRelationship, Place, Item
│   ├── foreshadowing.ts
│   ├── auth.ts
│   └── api.ts           # ApiResponse, JobResponse
├── pages/               # 페이지 컴포넌트 (9개)
├── repositories/        # 로컬 데이터 저장소 (2개)
├── lib/                 # 유틸리티 (utils.ts - cn 함수)
├── data/                # 목 데이터, 상수 (3개)
└── styles/              # 추가 스타일
```

---

## 자주 사용하는 명령어

| 명령어               | 설명                             |
| -------------------- | -------------------------------- |
| `npm run dev`        | 개발 서버 시작 (localhost:5173)  |
| `npm run build`      | 프로덕션 빌드 (tsc + vite build) |
| `npm run lint`       | ESLint 검사                      |
| `npm run lint:fix`   | ESLint 자동 수정                 |
| `npm run type-check` | TypeScript 타입 검사             |
| `npm run format`     | Prettier 포맷팅                  |

---

## Zustand 5.x 특성

- **도메인별 분리**: useAuthStore, useEditorStore, useUIStore 등
- **서버 상태 분리**: TanStack Query 사용, Zustand는 UI 상태만
- **직렬화 가능 타입만**: Set, Map 대신 배열/객체 사용
- **immer 미들웨어**: 불변성 관리

## TanStack Query 5.x 특성

- **queryKey 구조화**: `['documents', projectId]` 형태
- **enabled 옵션**: 조건부 fetch 제어
- **useMutation**: 서버 상태 변경, onSuccess에서 invalidateQueries
- **staleTime/gcTime**: 캐시 전략 명시

## React 19.x 특성

- **커스텀 훅 분리**: 비즈니스 로직은 src/hooks/
- **Props 인터페이스**: 명시적 타입 정의
- **useEffect 의존성**: 정확한 배열 관리
- **useCallback/useMemo**: 필요한 곳에만 (과도 사용 지양)
