# StoLink Client

![Build Status](https://img.shields.io/github/actions/workflow/status/ssyy3034/sto-link-front/deploy.yml?branch=release)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB)

---

## 1. Project Overview

> **Core Value:** 장편 소설 작가가 복선, 캐릭터, 세계관을 AI와 함께 체계적으로 관리하여 창작에만 집중할 수 있게 하는 올인원 집필 플랫폼

StoLink는 **'당신의 이야기, 하나도 놓치지 않게'**라는 슬로건 아래, 방대한 세계관을 가진 장편 소설의 복잡성을 기술적으로 해결합니다.

### 주요 링크

| 환경             | URL                                                  |
| ---------------- | ---------------------------------------------------- |
| **Production**   | `https://stolink.com`                                |
| **Staging**      | `https://dev.stolink.com`                            |
| **API Docs**     | [API_SPEC.md](docs/spec/API_SPEC.md)                 |
| **Architecture** | [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) |

---

## 2. Tech Stack & Decision Log

기술 선정 이유를 명시하여, 향후 레거시 파악 시 문맥을 제공합니다.

### 2.1 Core Framework

| Category       | Technology | Version | Decision Rationale                            |
| -------------- | ---------- | ------- | --------------------------------------------- |
| **Runtime**    | React      | 19.2    | 컴포넌트 기반 UI, 거대한 생태계, 팀 경험      |
| **Language**   | TypeScript | 5.7     | 타입 안전성, 자동완성, 리팩토링 용이성        |
| **Build Tool** | Vite       | 7.2     | Webpack 대비 10배 빠른 HMR, esbuild 기반 빌드 |
| **Rendering**  | CSR        | -       | SPA 특성, 에디터 중심 인터랙션, SEO 미필요    |

### 2.2 State Management

| Category          | Technology      | Version | Decision Rationale                                   |
| ----------------- | --------------- | ------- | ---------------------------------------------------- |
| **Client State**  | Zustand         | 5.0     | Redux 대비 80% 보일러플레이트 감소, 간결한 API       |
| **Server State**  | TanStack Query  | 5.90    | 캐싱, 자동 리패칭, 낙관적 업데이트, Query Key 팩토리 |
| **Form State**    | React Hook Form | 7.69    | 비제어 컴포넌트 기반, 리렌더링 최소화                |
| **Validation**    | Zod             | 4.2     | TypeScript 네이티브 통합, 런타임 검증                |
| **Local Persist** | idb-keyval      | 6.2     | IndexedDB 기반 증분 분석 버퍼 저장                   |

### 2.3 UI & Styling

| Category              | Technology    | Version | Decision Rationale                            |
| --------------------- | ------------- | ------- | --------------------------------------------- |
| **CSS Framework**     | Tailwind CSS  | 3.4     | 유틸리티 퍼스트 접근, 스타일링 생산성         |
| **Component Library** | shadcn/ui     | -       | Radix 기반 접근성, 복사-붙여넣기 커스터마이징 |
| **Animation**         | Framer Motion | 11.18   | 선언적 API, 제스처, 레이아웃 애니메이션       |
| **Icons**             | Lucide React  | 0.562   | Tree-shakeable, 일관된 디자인 시스템          |

### 2.4 Core Modules

| Category                | Technology | Version | Decision Rationale                                      |
| ----------------------- | ---------- | ------- | ------------------------------------------------------- |
| **Rich Text Editor**    | Tiptap     | 3.14    | ProseMirror 기반 확장성, 16개 커스텀 익스텐션           |
| **Graph Visualization** | D3.js      | 7.9     | Force Simulation, Canvas 렌더링으로 100+ 노드 성능 확보 |
| **Drag & Drop**         | dnd-kit    | 6.3     | 접근성, 성능, React 최적화                              |
| **HTTP Client**         | Axios      | 1.13    | 인터셉터, 에러 핸들링, 요청 취소                        |

### 2.5 Export & Utilities

| Category          | Technology      | Version | Decision Rationale                  |
| ----------------- | --------------- | ------- | ----------------------------------- |
| **PDF Export**    | jspdf           | 3.0     | 클라이언트 사이드 PDF 생성          |
| **DOCX Export**   | docx            | 9.5     | Word 문서 생성                      |
| **EPUB Export**   | epub-gen-memory | 1.1     | 전자책 포맷 지원                    |
| **Date Handling** | date-fns        | 4.1     | Tree-shakeable, moment.js 대비 경량 |
| **Immutability**  | immer           | 11.1    | Zustand와 함께 불변 상태 업데이트   |

---

## 3. Getting Started (Development)

### 3.1 Prerequisites

본 프로젝트는 **Node.js v20+** 및 **npm v10+**을 요구합니다.
`package.json`의 `engines` 필드에서 버전을 강제합니다.

```bash
# Node.js 버전 확인
node -v  # v20.x.x

# npm 버전 확인
npm -v   # 10.x.x
```

### 3.2 Installation

```bash
# 저장소 클론
git clone https://github.com/your-org/sto-link.git
cd sto-link

# 의존성 설치
npm install

# 워크스페이스 패키지 빌드 (Design Tokens, UI)
npm run build:packages
```

### 3.3 Environment Variables

`.env.example`를 복사하여 `.env.development.local`을 생성하고 필요한 값을 채우십시오.

```bash
cp .env.example .env.development.local
```

| Variable             | Description                          | Required | Default                 |
| -------------------- | ------------------------------------ | -------- | ----------------------- |
| `VITE_API_URL`       | 백엔드 API 진입점 (Vite Proxy 사용)  | Yes      | `/api`                  |
| `VITE_BACKEND_URL`   | 백엔드 서버 URL (OAuth 리다이렉트용) | Yes      | `http://localhost:8080` |
| `VITE_COMMUNITY_URL` | 커뮤니티 서비스 URL                  | No       | `http://localhost:5174` |

> ⚠️ `.env.development.local` 파일은 Git에 커밋되지 않습니다.

### 3.4 Running the App

```bash
# 개발 서버 실행 (localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

### 3.5 Vite Proxy Configuration

개발 환경에서 CORS 이슈 없이 백엔드와 통신하기 위해 Vite Proxy를 사용합니다.

| Path      | Target                  | Description        |
| --------- | ----------------------- | ------------------ |
| `/api`    | `http://localhost:8080` | Spring Boot 백엔드 |
| `/ai-api` | `http://localhost:8000` | FastAPI AI 서비스  |
| `/media`  | `http://localhost:9001` | MinIO 미디어 서버  |

---

## 4. Architecture

### 4.1 Rendering Strategy

본 프로젝트는 **CSR(Client-Side Rendering)**을 채택합니다.

**선택 이유:**

- 에디터 중심의 높은 인터랙션 요구
- SEO 불필요 (작가 전용 도구)
- 실시간 상태 동기화 (SSE, WebSocket)

### 4.2 Directory Structure

비즈니스 로직의 응집도를 높이기 위해 **기능(Feature) 단위**로 폴더를 구성합니다.

```
src/
├── api/              # Axios HTTP 클라이언트 (1개)
│   └── client.ts     # 인스턴스, 인터셉터, 에러 핸들링
│
├── components/       # 컴포넌트 (100개+)
│   ├── ui/           # shadcn/ui 기반 (31개) - 도메인 무관
│   ├── common/       # 공통 (11개) - Footer, Modal, 캐릭터 상세
│   ├── editor/       # 에디터 모듈 (28개) - Tiptap, 사이드바, AI
│   │   ├── extensions/  # 커스텀 Tiptap 익스텐션 (16개)
│   │   ├── sidebar/     # 챕터 트리, 컨텍스트 메뉴
│   │   └── ai-chat/     # AI 채팅 UI
│   ├── CharacterGraph/  # 관계도 모듈 (20개) - D3, Canvas
│   │   └── CanvasGraph/ # Canvas 렌더러
│   ├── library/      # 서재 페이지 컴포넌트
│   ├── layouts/      # 레이아웃
│   └── ...
│
├── hooks/            # 커스텀 훅 (36개) ⭐
│   ├── useDocuments.ts       # 문서 CRUD (TanStack Query)
│   ├── useCharacters.ts      # 캐릭터 관리
│   ├── useForeshadowing.ts   # 복선 관리
│   ├── useProjectAnalysis.ts # AI 분석 트리거
│   ├── useJobSSE.ts          # SSE 작업 스트리밍
│   └── ...
│
├── services/         # API 서비스 레이어 (20개)
│   ├── documentService.ts
│   ├── characterService.ts
│   ├── aiService.ts
│   └── ...
│
├── stores/           # Zustand 스토어 (17개) ⭐
│   ├── useAuthStore.ts          # 인증 (persist)
│   ├── useEditorStore.ts        # 에디터 UI
│   ├── useEditorSettingStore.ts # 에디터 설정 (persist)
│   ├── useAnalysisBufferStore.ts # 증분 분석 버퍼 (IndexedDB)
│   ├── useWritingStatsStore.ts  # 집필 통계
│   └── ...
│
├── types/            # TypeScript 타입 정의 (21개)
│
├── pages/            # 라우트 단위 페이지 (14개)
│   ├── editor/       # 에디터 페이지
│   ├── library/      # 서재 페이지
│   ├── world/        # 세계관 페이지
│   └── ...
│
├── lib/              # 유틸리티 (12개)
│   └── utils.ts      # cn(), 공통 함수
│
├── design-system/    # 디자인 토큰
│
└── repositories/     # 로컬 데이터 저장소 (5개)
    ├── DocumentRepository.ts
    └── LocalDocumentRepository.ts  # 데모 모드용
```

### 4.3 State Management Rules

#### Server State (TanStack Query)

- 모든 API 데이터는 TanStack Query를 사용
- `src/hooks/` 내 커스텀 훅으로 캡슐화
- Query Key 팩토리 패턴 적용

```typescript
// Query Key Factory Pattern
const projectKeys = {
  all: ["projects"] as const,
  list: (params?: P) => [...projectKeys.all, "list", params] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};
```

#### Client State (Zustand)

- 전역 UI 상태 (사이드바, 모달, 테마)
- 에디터 설정 (폰트, 줌, 자동저장)
- **Props Drilling 회피만을 위한 전역 상태는 지양**

#### Persist Strategy

| Store                    | Persist Target | Reason                             |
| ------------------------ | -------------- | ---------------------------------- |
| `useAuthStore`           | localStorage   | 토큰, 사용자 정보                  |
| `useEditorSettingStore`  | localStorage   | 에디터 개인 설정                   |
| `useAnalysisBufferStore` | IndexedDB      | 대용량 증분 분석 버퍼 (idb-keyval) |

### 4.4 Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         Data Flow                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [User Input]                                                   │
│        │                                                         │
│        ▼                                                         │
│   [Component] ──────── useState (local) ◀──── 컴포넌트 상태      │
│        │                                                         │
│        ▼                                                         │
│   [Hook] ──────────── TanStack Query ◀────── API 데이터          │
│        │                     │                                   │
│        │                     └────── Optimistic Update           │
│        ▼                                                         │
│   [Service] ────────── Axios ────────────▶ [Backend API]         │
│        │                                                         │
│        │                                                         │
│   [Zustand Store] ◀─── Global UI State ◀──── 전역 UI 상태        │
│                                                                  │
│   [IndexedDB] ◀──────── Analysis Buffer ◀──── 증분 분석 버퍼     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.5 Bundle Optimization

Vite의 `manualChunks`를 활용하여 번들을 최적화합니다.

| Chunk           | Libraries                     | Reason                     |
| --------------- | ----------------------------- | -------------------------- |
| `vendor-react`  | React, ReactDOM, React Router | Core                       |
| `vendor-editor` | Tiptap 전체                   | 에디터 페이지 진입 시 로드 |
| `vendor-graph`  | D3, ReactFlow                 | 관계도 페이지 진입 시 로드 |
| `vendor-export` | docx, jspdf, epub             | 내보내기 시에만 로드       |
| `vendor-ui`     | Radix UI 전체                 | UI 컴포넌트 공통           |

---

## 5. Testing & Quality Control

### 5.1 Test Strategy

| Level              | Tool                  | Coverage                                |
| ------------------ | --------------------- | --------------------------------------- |
| **Unit Test**      | Vitest                | 유틸리티 함수, 비즈니스 로직            |
| **Component Test** | React Testing Library | 핵심 컴포넌트 렌더링/인터랙션           |
| **E2E Test**       | Playwright            | 주요 유저 플로우 (로그인, 에디터, 저장) |

### 5.2 Test Commands

```bash
# Unit & Component Tests
npm test           # 전체 테스트 실행
npm run test:watch # 워치 모드
npm run test:coverage # 커버리지 리포트
npm run test:ui    # Vitest UI

# E2E Tests
npx playwright test      # 전체 E2E
npx playwright test --ui # UI 모드
```

### 5.3 Test Directory Structure

```
src/__tests__/
└── qa/
    ├── api/        # API 연동 테스트
    └── scenarios/  # 시나리오 기반 기능 테스트

e2e/
├── fixtures/       # 테스트 데이터
└── tests/          # E2E 테스트 파일
```

### 5.4 Linting & Formatting

**Commit 시** Husky와 lint-staged가 자동으로 실행됩니다.

```bash
npm run lint        # ESLint 검사
npm run lint:fix    # ESLint 자동 수정
npm run format      # Prettier 포맷팅
npm run type-check  # TypeScript 타입 검사
```

### 5.5 Git Hooks

| Hook         | Action                                 |
| ------------ | -------------------------------------- |
| `pre-commit` | lint-staged (ESLint + Prettier)        |
| `commit-msg` | commitlint (Conventional Commits 검증) |

### 5.6 Commit Convention

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅 (동작 변화 X)
refactor: 리팩토링 (동작 변화 X)
test: 테스트 추가
chore: 빌드, 설정, 의존성 변경
```

---

## 6. Deployment

### 6.1 CI/CD Pipeline

GitHub Actions를 통해 CI/CD가 구성되어 있습니다.

| Workflow        | Trigger          | Action                            |
| --------------- | ---------------- | --------------------------------- |
| `deploy.yml`    | `release` push   | Production 배포 (S3 + CloudFront) |
| `deploy.yml`    | `dev` push       | Staging 배포                      |
| `ai-review.yml` | PR 생성/업데이트 | AI 코드 리뷰 (Claude API)         |
| `chromatic.yml` | PR 생성          | Storybook 시각적 회귀 테스트      |

### 6.2 Branch Strategy

```
main ─────── Archive (직접 push 금지)
release ──── Production 배포 트리거
dev ──────── Staging 배포 트리거, 개발 통합
feature/* ── 기능 개발 → dev PR
fix/* ────── 버그 수정 → dev PR
hotfix/* ─── 긴급 수정 → release PR (자동 backport to dev)
```

### 6.3 Deployment Target

| Environment | Hosting | CDN        | URL                       |
| ----------- | ------- | ---------- | ------------------------- |
| Production  | AWS S3  | CloudFront | `https://stolink.com`     |
| Staging     | AWS S3  | CloudFront | `https://dev.stolink.com` |

### 6.4 Build & Deploy Process

```
1. GitHub Actions Trigger (release/dev push)
       │
       ▼
2. npm ci && npm run build
       │
       ▼
3. S3 Sync
   ├── /assets/* → max-age=31536000 (영구 캐시, 해시된 파일)
   └── /index.html → no-cache (항상 최신)
       │
       ▼
4. CloudFront Invalidation (/index.html only)
       │
       ▼
5. Health Check (5회 재시도)
```

---

## 7. Additional Documentation

| Document                                                        | Description          |
| --------------------------------------------------------------- | -------------------- |
| [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)            | 전체 시스템 아키텍처 |
| [TECHSTACK.md](docs/architecture/TECHSTACK.md)                  | 기술 스택 상세       |
| [CHARACTER_GRAPH.md](docs/architecture/CHARACTER_GRAPH.md)      | 관계도 모듈 아키텍처 |
| [TECHNICAL_IMPLEMENTATION.md](docs/TECHNICAL_IMPLEMENTATION.md) | 기술 구현 상세       |
| [DATA_MODEL.md](docs/spec/DATA_MODEL.md)                        | 데이터 모델 정의     |
| [API_SPEC.md](docs/spec/API_SPEC.md)                            | API 명세             |
| [SPEC.md](docs/spec/SPEC.md)                                    | 기능 명세            |
| [GIT_STRATEGY.md](docs/workflow/GIT_STRATEGY.md)                | Git 브랜치 전략      |

---

## 8. Contributing

### 8.1 Quick Start for Contributors

```bash
# 1. 저장소 포크 및 클론
git clone https://github.com/your-username/sto-link.git

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.development.local

# 4. 개발 서버 실행
npm run dev

# 5. 새 브랜치 생성
git checkout -b feature/your-feature-name

# 6. 변경 사항 커밋 (Conventional Commits)
git commit -m "feat: add new feature"

# 7. PR 생성
```

### 8.2 Code Style

- ESLint + Prettier 자동 적용
- Husky pre-commit 훅으로 강제
- TypeScript Strict Mode 필수

---

**Last updated:** 2026-01-20 by Lead Engineer
