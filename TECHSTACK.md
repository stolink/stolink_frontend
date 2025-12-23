# StoLink 프론트엔드 기술 스택

> 작가용 웹 에디터 플랫폼을 위한 기술 스택 정의

---

## 1. 핵심 프레임워크

| 기술           | 버전 | 선정 이유                                                  |
| -------------- | ---- | ---------------------------------------------------------- |
| **React**      | 18.x | 컴포넌트 기반 UI, 거대한 생태계, 팀 경험                   |
| **TypeScript** | 5.x  | 타입 안정성, 자동완성, 리팩토링 용이, 대규모 프로젝트 필수 |
| **Vite**       | 5.x  | 빠른 HMR, 빌드 속도, CRA 대비 10배 이상 빠름               |

---

## 2. 스타일링

| 기술                    | 버전   | 선정 이유                                                           |
| ----------------------- | ------ | ------------------------------------------------------------------- |
| **Tailwind CSS**        | 3.x    | 유틸리티 퍼스트, 빠른 개발, 일관된 디자인 시스템                    |
| **shadcn/ui**           | latest | 커스터마이징 가능한 컴포넌트, Radix 기반 접근성, 복사-붙여넣기 방식 |
| **tailwind-merge**      | 2.x    | Tailwind 클래스 충돌 해결                                           |
| **clsx**                | 2.x    | 조건부 클래스 결합                                                  |
| **tailwindcss-animate** | 1.x    | shadcn/ui 애니메이션 의존성                                         |

### shadcn/ui 사용 컴포넌트 (예상)

```
Button, Input, Textarea, Select, Checkbox, Radio
Dialog, Sheet, Dropdown, Popover, Tooltip
Tabs, Accordion, Card, Badge, Avatar
Toast, Alert, Progress, Skeleton
Command (검색/자동완성), ContextMenu (우클릭 메뉴)
```

---

## 3. 상태 관리

| 기술                | 버전 | 용도        | 선정 이유                                                 |
| ------------------- | ---- | ----------- | --------------------------------------------------------- |
| **Zustand**         | 4.x  | 전역 상태   | 간결한 API, 보일러플레이트 최소, Redux 대비 80% 코드 감소 |
| **TanStack Query**  | 5.x  | 서버 상태   | 캐싱, 자동 리패칭, 낙관적 업데이트, 무한 스크롤           |
| **React Hook Form** | 7.x  | 폼 상태     | 비제어 컴포넌트 기반, 리렌더링 최소화, 검증 통합          |
| **Zod**             | 3.x  | 스키마 검증 | TypeScript 통합, React Hook Form 연동                     |

### 상태 분리 전략

```
┌─────────────────────────────────────────────────────────┐
│                     상태 유형별 도구                      │
├─────────────────────────────────────────────────────────┤
│  서버 상태 (API 데이터)     →  TanStack Query           │
│  전역 UI 상태 (사이드바 등)  →  Zustand                  │
│  폼 상태 (입력값, 검증)     →  React Hook Form + Zod    │
│  로컬 컴포넌트 상태         →  useState                  │
│  에디터 상태 (문서 내용)    →  Tiptap 내장 상태          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 에디터 ⭐ (핵심)

| 기술                                  | 버전 | 선정 이유                                           |
| ------------------------------------- | ---- | --------------------------------------------------- |
| **Tiptap**                            | 2.x  | ProseMirror 기반, 확장성, React 통합, 마크다운 지원 |
| **@tiptap/starter-kit**               | 2.x  | 기본 익스텐션 번들                                  |
| **@tiptap/extension-placeholder**     | 2.x  | 플레이스홀더 텍스트                                 |
| **@tiptap/extension-highlight**       | 2.x  | 복선 태그 하이라이트                                |
| **@tiptap/extension-mention**         | 2.x  | `#복선:` 자동완성                                   |
| **@tiptap/extension-character-count** | 2.x  | 글자수 카운터                                       |
| **@tiptap/extension-collaboration**   | 2.x  | 실시간 협업 (향후)                                  |

### 에디터 라이브러리 비교

| 라이브러리     | 장점                               | 단점                     | 적합성       |
| -------------- | ---------------------------------- | ------------------------ | ------------ |
| **Tiptap**     | 확장성 최고, 커스텀 용이, 마크다운 | 학습 곡선                | ✅ 최적      |
| Slate.js       | 유연함, React 친화적               | 설정 복잡, 플러그인 부족 | ⚠️ 차선      |
| Lexical (Meta) | 성능 좋음, 최신                    | 생태계 작음, 문서 부족   | ❌ 아직 이름 |
| Draft.js       | 검증됨                             | 구식, 유지보수 중단 예정 | ❌ 비추천    |
| Quill          | 쉬움                               | 커스터마이징 한계        | ❌ 부적합    |

### Tiptap 선정 이유 상세

1. **커스텀 노드/마크 생성 용이**

   - `#복선:태그명` 같은 커스텀 문법 구현 가능
   - 복선 하이라이트, 클릭 이벤트 처리

2. **마크다운 양방향 변환**

   - 마크다운으로 저장, 렌더링 시 리치 텍스트

3. **협업 확장 (Y.js 통합)**

   - 향후 실시간 협업 기능 추가 용이

4. **헤드리스 아키텍처**
   - UI 완전 커스터마이징 가능
   - shadcn/ui와 자연스럽게 통합

---

## 5. 라우팅

| 기술             | 버전 | 선정 이유                           |
| ---------------- | ---- | ----------------------------------- |
| **React Router** | 6.x  | 표준 라우팅, 중첩 라우트, 로더/액션 |

### 라우트 구조

```typescript
const routes = [
  { path: '/', element: <LandingPage /> },
  { path: '/auth', element: <AuthPage /> },
  {
    path: '/',
    element: <ProtectedLayout />,  // 인증 필요
    children: [
      { path: 'library', element: <LibraryPage /> },
      {
        path: 'projects/:id',
        element: <ProjectLayout />,  // 공통 헤더, 탭
        children: [
          { path: 'editor', element: <EditorPage /> },
          { path: 'world', element: <WorldPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ]
      }
    ]
  },
  { path: '/share/:shareId', element: <SharedViewPage /> },
  { path: '*', element: <NotFoundPage /> },
];
```

---

## 6. 데이터 시각화 (캐릭터 관계도)

| 기술           | 버전 | 선정 이유                                   |
| -------------- | ---- | ------------------------------------------- |
| **React Flow** | 11.x | React 네이티브, 인터랙티브, 커스텀 노드     |
| **또는 D3.js** | 7.x  | 세밀한 제어, 복잡한 시각화 (학습 곡선 높음) |

### 라이브러리 비교

| 라이브러리     | 장점                                         | 단점                         | 적합성     |
| -------------- | -------------------------------------------- | ---------------------------- | ---------- |
| **React Flow** | React 통합, 커스텀 노드 쉬움, 드래그/줌 내장 | 복잡한 레이아웃 한계         | ✅ 권장    |
| vis.js         | 강력한 네트워크 시각화                       | React 통합 번거로움          | ⚠️ 차선    |
| D3.js          | 완전한 제어                                  | 학습 곡선, React 통합 어려움 | ⚠️ 고급 용 |
| Cytoscape.js   | 그래프 분석 기능                             | 무거움                       | ❌ 과함    |

### React Flow 선정 이유

```typescript
// 커스텀 캐릭터 노드 예시
const CharacterNode = ({ data }) => (
  <div className="p-4 rounded-lg bg-white border-2 border-sage">
    <img src={data.avatar} className="w-12 h-12 rounded-full" />
    <div className="font-medium">{data.name}</div>
    <div className="text-sm text-gray-500">{data.role}</div>
  </div>
);

// 관계선 스타일링
const edgeTypes = {
  friendly: { style: { stroke: '#6B8E6B' } },  // 친밀
  hostile: { style: { stroke: '#DC7C7C' } },   // 적대
  neutral: { style: { stroke: '#9CA3AF' } },   // 중립
};
```

---

## 7. HTTP 클라이언트

| 기술      | 버전 | 선정 이유                                   |
| --------- | ---- | ------------------------------------------- |
| **Axios** | 1.x  | 인터셉터, 에러 핸들링, 요청 취소, 타입 지원 |

### API 클라이언트 구조

```typescript
// api/client.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// 인터셉터: 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 인터셉터: 401 시 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 갱신 로직
    }
    return Promise.reject(error);
  }
);
```

---

## 8. 유틸리티

| 기술          | 버전 | 용도               | 선정 이유                        |
| ------------- | ---- | ------------------ | -------------------------------- |
| **date-fns**  | 3.x  | 날짜 처리          | 트리쉐이킹, moment 대비 경량     |
| **lodash-es** | 4.x  | 유틸 함수          | debounce, throttle, cloneDeep 등 |
| **uuid**      | 9.x  | 고유 ID 생성       | 클라이언트 측 임시 ID            |
| **diff**      | 5.x  | 텍스트 차이 계산   | 델타 저장용                      |
| **immer**     | 10.x | 불변 상태 업데이트 | Zustand와 함께 사용              |

### diff 라이브러리 사용 예시

```typescript
import { diffChars } from "diff";

// 자동저장 시 델타 계산
const calculateDelta = (oldText: string, newText: string) => {
  const changes = diffChars(oldText, newText);
  return changes.filter((c) => c.added || c.removed);
};
```

---

## 9. 파일 처리

| 기술                          | 버전 | 용도           | 선정 이유                 |
| ----------------------------- | ---- | -------------- | ------------------------- |
| **react-dropzone**            | 14.x | 파일 업로드 UI | 드래그 앤 드롭, 파일 검증 |
| **browser-image-compression** | 2.x  | 이미지 압축    | 업로드 전 용량 최적화     |

---

## 10. 드래그 앤 드롭

| 기술                  | 버전 | 용도                | 선정 이유                  |
| --------------------- | ---- | ------------------- | -------------------------- |
| **@dnd-kit/core**     | 6.x  | 챕터 트리 순서 변경 | 접근성, 성능, React 최적화 |
| **@dnd-kit/sortable** | 8.x  | 정렬 기능           | 리스트/트리 정렬           |

### 대안 비교

| 라이브러리          | 장점                 | 단점          |
| ------------------- | -------------------- | ------------- |
| **dnd-kit**         | 모던, 접근성, 모듈화 | -             |
| react-beautiful-dnd | 검증됨               | 유지보수 중단 |
| react-dnd           | 유연함               | 설정 복잡     |

---

## 11. 애니메이션

| 기술              | 버전 | 용도          | 선정 이유                               |
| ----------------- | ---- | ------------- | --------------------------------------- |
| **Framer Motion** | 11.x | UI 애니메이션 | 선언적 API, 제스처, 레이아웃 애니메이션 |

### 사용 예시

```typescript
// 페이지 전환 애니메이션
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
  {children}
</motion.div>

// 챕터 트리 접기/펼치기
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 'auto' }}
      exit={{ height: 0 }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 12. 개발 도구

| 기술                  | 버전 | 용도                 |
| --------------------- | ---- | -------------------- |
| **ESLint**            | 8.x  | 코드 린팅            |
| **Prettier**          | 3.x  | 코드 포맷팅          |
| **Husky**             | 9.x  | Git 훅 (pre-commit)  |
| **lint-staged**       | 15.x | 스테이지 파일만 린트 |
| **TypeScript ESLint** | 7.x  | TS 린트 규칙         |

### ESLint 설정 (권장)

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
    "react-hooks/exhaustive-deps": "warn",
  },
};
```

---

## 13. 테스트 (선택적)

| 기술                | 버전 | 용도                        |
| ------------------- | ---- | --------------------------- |
| **Vitest**          | 1.x  | 단위 테스트 (Vite 네이티브) |
| **Testing Library** | 14.x | 컴포넌트 테스트             |
| **Playwright**      | 1.x  | E2E 테스트                  |
| **MSW**             | 2.x  | API 모킹                    |

---

## 14. 번들 최적화

| 기술                         | 용도                        |
| ---------------------------- | --------------------------- |
| **@vitejs/plugin-react-swc** | 빌드 속도 향상 (Babel 대체) |
| **rollup-plugin-visualizer** | 번들 크기 분석              |
| **vite-plugin-compression**  | gzip/brotli 압축            |

---

## 15. 전체 의존성 목록

### dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",

  "@tanstack/react-query": "^5.24.0",
  "zustand": "^4.5.0",
  "react-hook-form": "^7.50.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.4",

  "@tiptap/react": "^2.2.0",
  "@tiptap/starter-kit": "^2.2.0",
  "@tiptap/extension-placeholder": "^2.2.0",
  "@tiptap/extension-highlight": "^2.2.0",
  "@tiptap/extension-mention": "^2.2.0",
  "@tiptap/extension-character-count": "^2.2.0",

  "reactflow": "^11.10.0",

  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",

  "axios": "^1.6.0",
  "date-fns": "^3.3.0",
  "lodash-es": "^4.17.21",
  "uuid": "^9.0.0",
  "diff": "^5.2.0",
  "immer": "^10.0.0",

  "framer-motion": "^11.0.0",
  "react-dropzone": "^14.2.0",
  "browser-image-compression": "^2.0.0",

  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0",
  "lucide-react": "^0.330.0",

  "@radix-ui/react-dialog": "^1.0.0",
  "@radix-ui/react-dropdown-menu": "^2.0.0",
  "@radix-ui/react-tabs": "^1.0.0",
  "@radix-ui/react-tooltip": "^1.0.0",
  "@radix-ui/react-context-menu": "^2.0.0"
}
```

### devDependencies

```json
{
  "typescript": "^5.3.0",
  "vite": "^5.1.0",
  "@vitejs/plugin-react-swc": "^3.6.0",

  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "tailwindcss-animate": "^1.0.0",

  "eslint": "^8.57.0",
  "@typescript-eslint/eslint-plugin": "^7.0.0",
  "@typescript-eslint/parser": "^7.0.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-config-prettier": "^9.1.0",

  "prettier": "^3.2.0",
  "prettier-plugin-tailwindcss": "^0.5.0",

  "husky": "^9.0.0",
  "lint-staged": "^15.2.0",

  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@types/lodash-es": "^4.17.0",
  "@types/uuid": "^9.0.0",
  "@types/diff": "^5.0.0"
}
```

---

## 16. 프로젝트 구조 (권장)

```
src/
├── components/           # 재사용 컴포넌트
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── editor/          # 에디터 관련 컴포넌트
│   ├── graph/           # 관계도 컴포넌트
│   └── common/          # 공통 컴포넌트
│
├── pages/               # 페이지 컴포넌트
│   ├── landing/
│   ├── auth/
│   ├── library/
│   ├── editor/
│   ├── world/
│   └── settings/
│
├── stores/              # Zustand 스토어
│   ├── useAuthStore.ts
│   ├── useEditorStore.ts
│   └── useUIStore.ts
│
├── hooks/               # 커스텀 훅
│   ├── useAutoSave.ts
│   ├── useForeshadowing.ts
│   └── useDebounce.ts
│
├── api/                 # API 클라이언트
│   ├── client.ts
│   ├── auth.ts
│   ├── projects.ts
│   └── chapters.ts
│
├── lib/                 # 유틸리티
│   ├── utils.ts         # cn() 등
│   ├── validations.ts   # Zod 스키마
│   └── constants.ts
│
├── types/               # TypeScript 타입
│   ├── project.ts
│   ├── chapter.ts
│   └── character.ts
│
├── styles/              # 글로벌 스타일
│   └── globals.css
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## 17. 환경 변수

```bash
# .env.development
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws

# .env.production
VITE_API_URL=https://api.stolink.com/api
VITE_WS_URL=wss://api.stolink.com/ws
```

---

## 18. 초기 설정 스크립트

```bash
# 프로젝트 생성
npm create vite@latest stolink-frontend -- --template react-ts
cd stolink-frontend

# 핵심 의존성
npm install react-router-dom @tanstack/react-query zustand axios

# 폼 & 검증
npm install react-hook-form zod @hookform/resolvers

# 에디터
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder \
  @tiptap/extension-highlight @tiptap/extension-mention @tiptap/extension-character-count

# UI
npm install tailwindcss postcss autoprefixer tailwindcss-animate clsx tailwind-merge
npm install framer-motion lucide-react

# 그래프
npm install reactflow

# DnD
npm install @dnd-kit/core @dnd-kit/sortable

# 유틸
npm install date-fns lodash-es uuid diff immer
npm install -D @types/lodash-es @types/uuid @types/diff

# shadcn/ui 초기화
npx shadcn-ui@latest init

# 개발 도구
npm install -D eslint prettier husky lint-staged \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-react-hooks eslint-config-prettier \
  prettier-plugin-tailwindcss
```

---

## 버전 이력

| 버전 | 날짜    | 변경 내용 |
| ---- | ------- | --------- |
| 1.0  | 2024.12 | 최초 작성 |
