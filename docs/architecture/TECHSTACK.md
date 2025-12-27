# StoLink 프론트엔드 기술 스택

> **최종 수정**: 2025년 12월 28일
> 작가용 웹 에디터 플랫폼을 위한 기술 스택 정의

---

## 1. 핵심 프레임워크

| 기술           | 버전 | 선정 이유                                                  |
| -------------- | ---- | ---------------------------------------------------------- |
| **React**      | 19.2 | 컴포넌트 기반 UI, 거대한 생태계, 팀 경험                   |
| **TypeScript** | 5.9  | 타입 안정성, 자동완성, 리팩토링 용이, 대규모 프로젝트 필수 |
| **Vite**       | 7.2  | 빠른 HMR, 빌드 속도, CRA 대비 10배 이상 빠름               |

---

## 2. 스타일링

| 기술                    | 버전 | 선정 이유                                                           |
| ----------------------- | ---- | ------------------------------------------------------------------- |
| **Tailwind CSS**        | 3.4  | 유틸리티 퍼스트, 빠른 개발, 일관된 디자인 시스템                    |
| **shadcn/ui**           | -    | 커스터마이징 가능한 컴포넌트, Radix 기반 접근성, 복사-붙여넣기 방식 |
| **tailwind-merge**      | 3.4  | Tailwind 클래스 충돌 해결                                           |
| **clsx**                | 2.1  | 조건부 클래스 결합                                                  |
| **tailwindcss-animate** | 1.0  | shadcn/ui 애니메이션 의존성                                         |

### shadcn/ui 사용 컴포넌트 (23개)

```
Button, Input, Textarea, Select, Checkbox, Label
Dialog, Sheet, Dropdown, Popover, Tooltip
Tabs, Card, Badge, Progress, Separator
ScrollArea, Slot
Command (검색/자동완성), ContextMenu (우클릭 메뉴)
```

---

## 3. 상태 관리

| 기술                | 버전 | 용도        | 선정 이유                                                 |
| ------------------- | ---- | ----------- | --------------------------------------------------------- |
| **Zustand**         | 5.0  | 전역 상태   | 간결한 API, 보일러플레이트 최소, Redux 대비 80% 코드 감소 |
| **TanStack Query**  | 5.90 | 서버 상태   | 캐싱, 자동 리패칭, 낙관적 업데이트, Query Key 팩토리      |
| **React Hook Form** | 7.69 | 폼 상태     | 비제어 컴포넌트 기반, 리렌더링 최소화, 검증 통합          |
| **Zod**             | 4.2  | 스키마 검증 | TypeScript 통합, React Hook Form 연동                     |

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

### TanStack Query 패턴

```typescript
// Query Key 팩토리 패턴
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: Params) => [...projectKeys.lists(), params] as const,
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

## 4. 에디터 ⭐ (핵심)

| 기술                                  | 버전 | 선정 이유                                           |
| ------------------------------------- | ---- | --------------------------------------------------- |
| **Tiptap**                            | 3.14 | ProseMirror 기반, 확장성, React 통합, 마크다운 지원 |
| **@tiptap/starter-kit**               | 3.14 | 기본 익스텐션 번들                                  |
| **@tiptap/extension-placeholder**     | 3.14 | 플레이스홀더 텍스트                                 |
| **@tiptap/extension-highlight**       | 3.14 | 복선 태그 하이라이트                                |
| **@tiptap/extension-mention**         | 3.14 | `@캐릭터` 자동완성                                  |
| **@tiptap/extension-character-count** | 3.14 | 글자수 카운터                                       |
| **@tiptap/extension-underline**       | 3.14 | 밑줄                                                |
| **@tiptap/extension-text-align**      | 3.14 | 텍스트 정렬                                         |
| **@tiptap/extension-bubble-menu**     | 3.14 | 버블 메뉴                                           |
| **@tiptap/suggestion**                | 3.14 | 자동완성 제안                                       |
| **@tippyjs/react**                    | 4.2  | 팝오버 UI                                           |

### Tiptap 선정 이유 상세

1. **커스텀 노드/마크 생성 용이** - `#복선:태그명`, `@캐릭터명` 같은 커스텀 문법 구현 가능
2. **마크다운 양방향 변환** - 마크다운으로 저장, 렌더링 시 리치 텍스트
3. **협업 확장 (Y.js 통합)** - 향후 실시간 협업 기능 추가 용이
4. **헤드리스 아키텍처** - UI 완전 커스터마이징, shadcn/ui 통합

### 커스텀 익스텐션

| 익스텐션             | 역할                     |
| -------------------- | ------------------------ |
| `CharacterMention`   | @캐릭터 멘션 자동완성    |
| `CharacterNodeView`  | 캐릭터 노드 렌더링       |
| `CharacterHoverCard` | 호버 시 캐릭터 정보 표시 |
| `CommandList`        | / 명령어 팔레트          |

---

## 5. 라우팅

| 기술             | 버전 | 선정 이유                           |
| ---------------- | ---- | ----------------------------------- |
| **React Router** | 7.11 | 표준 라우팅, 중첩 라우트, 로더/액션 |

---

## 6. 데이터 시각화 (캐릭터 관계도)

| 기술      | 버전 | 선정 이유                            |
| --------- | ---- | ------------------------------------ |
| **D3.js** | 7.x  | Force Simulation, 완전한 시각화 제어 |

### D3.js Force Simulation 선정 이유

- **물리 기반 레이아웃**: Force-Directed 그래프로 캐릭터 관계를 자연스럽게 시각화
- **Obsidian 스타일**: 얇은 간선, 부드러운 애니메이션, 직관적인 노드 디자인
- **커스텀 훅 아키텍처**: React와의 원활한 통합을 위한 5개 전용 훅
- **성능 최적화**: `useSyncExternalStore`로 불필요한 리렌더링 방지

### D3 그래프 훅 아키텍처

```typescript
// 훅 분리 구조
useCharacterGraphSimulation; // Force 시뮬레이션 코어
useCharacterGraphDrag; // 노드 드래그 인터랙션
useCharacterGraphZoom; // SVG 줌/팬 제어
useCharacterGraphResize; // 컨테이너 리사이즈 감지
useRelationshipLinks; // 관계→링크 데이터 변환
```

---

## 7. HTTP 클라이언트

| 기술      | 버전 | 선정 이유                                   |
| --------- | ---- | ------------------------------------------- |
| **Axios** | 1.13 | 인터셉터, 에러 핸들링, 요청 취소, 타입 지원 |

---

## 8. 유틸리티

| 기술          | 버전 | 용도               | 선정 이유                        |
| ------------- | ---- | ------------------ | -------------------------------- |
| **date-fns**  | 4.1  | 날짜 처리          | 트리쉐이킹, moment 대비 경량     |
| **lodash-es** | 4.17 | 유틸 함수          | debounce, throttle, cloneDeep 등 |
| **uuid**      | 13.0 | 고유 ID 생성       | 클라이언트 측 임시 ID            |
| **diff**      | 8.0  | 텍스트 차이 계산   | 델타 저장용                      |
| **immer**     | 11.1 | 불변 상태 업데이트 | Zustand와 함께 사용              |

---

## 9. 파일 처리

| 기술                          | 버전 | 용도           | 선정 이유                 |
| ----------------------------- | ---- | -------------- | ------------------------- |
| **react-dropzone**            | 14.3 | 파일 업로드 UI | 드래그 앤 드롭, 파일 검증 |
| **browser-image-compression** | 2.0  | 이미지 압축    | 업로드 전 용량 최적화     |

---

## 10. 드래그 앤 드롭

| 기술                  | 버전 | 용도                | 선정 이유                  |
| --------------------- | ---- | ------------------- | -------------------------- |
| **@dnd-kit/core**     | 6.3  | 챕터 트리 순서 변경 | 접근성, 성능, React 최적화 |
| **@dnd-kit/sortable** | 10.0 | 정렬 기능           | 리스트/트리 정렬           |

---

## 11. 내보내기

| 기술                | 버전 | 용도          |
| ------------------- | ---- | ------------- |
| **file-saver**      | 2.0  | 파일 다운로드 |
| **turndown**        | 7.2  | HTML→마크다운 |
| **docx**            | 9.5  | DOCX 생성     |
| **epub-gen-memory** | 1.1  | EPUB 생성     |
| **html2pdf.js**     | 0.12 | PDF 생성      |
| **jspdf**           | 3.0  | PDF 생성      |

---

## 12. 애니메이션

| 기술              | 버전  | 용도          | 선정 이유                               |
| ----------------- | ----- | ------------- | --------------------------------------- |
| **Framer Motion** | 12.23 | UI 애니메이션 | 선언적 API, 제스처, 레이아웃 애니메이션 |

---

## 13. 개발 도구

| 기술                  | 버전 | 용도                 |
| --------------------- | ---- | -------------------- |
| **ESLint**            | 9.39 | 코드 린팅            |
| **Prettier**          | 3.7  | 코드 포맷팅          |
| **Husky**             | 9.1  | Git 훅 (pre-commit)  |
| **lint-staged**       | 16.2 | 스테이지 파일만 린트 |
| **TypeScript ESLint** | 8.46 | TS 린트 규칙         |
| **commitlint**        | 20.2 | 커밋 메시지 검증     |

---

## 14. 번들 최적화

| 기술                     | 용도                          |
| ------------------------ | ----------------------------- |
| **@vitejs/plugin-react** | React 플러그인                |
| **Manual Chunks**        | 코드 분할 (tiptap, ui, react) |
| **Terser**               | 코드 압축                     |

### Vite 번들 분할 설정

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'tiptap': ['@tiptap/react', '@tiptap/starter-kit', ...],
        'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...],
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
      }
    }
  }
}
```

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                                            |
| ---- | ---------- | -------------------------------------------------------------------- |
| 1.0  | 2024.12    | 최초 작성                                                            |
| 1.1  | 2024.12    | 공통 컴포넌트(Footer) 추가, 버튼 디자인 rounded-full 적용            |
| 1.2  | 2024.12    | React 19, Vite 7 업데이트, Repository 패턴 추가, Export 서비스 추가  |
| 1.3  | 2024.12    | 문서 정리 - 디렉토리/라우팅 섹션은 ARCHITECTURE.md로 이동            |
| 1.4  | 2025.12.26 | 실제 버전 반영 (TS 5.9, Vite 7.2, TanStack Query 5.90 등), 패턴 추가 |
| 1.5  | 2025.12.28 | React Flow → D3.js Force Simulation 전환, 그래프 훅 아키텍처 문서화  |

---

## 관련 문서

| 문서              | 내용                                   |
| ----------------- | -------------------------------------- |
| `ARCHITECTURE.md` | 프로젝트 구조, 라우팅, 상태관리        |
| `SPEC.md`         | 페이지 구성 및 기능 명세서             |
| `DATA_MODEL.md`   | 엔티티, DTO, 타입 정의                 |
| `API_SPEC.md`     | API 엔드포인트 명세                    |
| `CLAUDE.md`       | AI 인스트럭션 (코드 원칙, 커밋 컨벤션) |
