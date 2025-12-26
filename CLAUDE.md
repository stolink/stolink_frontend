# CLAUDE.md - StoLink Project Constitution

> 이 문서는 AI 모델이 프로젝트 컨텍스트를 이해하고, 코드 품질을 일관되게 유지하기 위한 **프로젝트 헌법(Constitution)**입니다.

**버전:** 2.1
**최종 수정:** 2025년 12월 26일
**문서 상태:** 활성

---

<project_info>
<description>
StoLink - 작가용 AI 기반 스토리 관리 플랫폼
복선 관리, 캐릭터 관계도, 세계관 설정, 일관성 체크를 지원하는 장편 소설 집필 도구
</description>

<tech_stack>

<!-- 2025.12.26 기준 실제 버전 --> - Framework: React 19.2, TypeScript 5.9, Vite 7.2 - State: Zustand 5.0 (전역), TanStack Query 5.90 (서버), React Hook Form 7.69 (폼) - UI: Tailwind CSS 3.4, shadcn/ui, Radix UI - Editor: Tiptap 3.14 (ProseMirror 기반) - Graph: React Flow 11.11 (캐릭터 관계도) - DnD: dnd-kit 6.3 (챕터 트리) - Validation: Zod 4.2 - Export: docx, jspdf, epub-gen-memory - Util: immer 11.1, lodash-es, date-fns - Backend: Spring Boot, PostgreSQL, Neo4j

</tech_stack>

<core_entities>

<!-- src/types/ 기준 --> - Document: 폴더(folder) 또는 텍스트(text) - Scrivener 스타일 재귀 구조 ⭐ 핵심 - Project: 작품 (프로젝트 단위, stats 포함) - Character: 캐릭터 (extras로 동적 속성, Neo4j 연동) - Foreshadowing: 복선 (tag, status, appearances 배열) - Place: 장소, Item: 아이템 - CharacterRelationship: 관계 (sourceId, targetId, type, strength)

</core_entities>
</project_info>

---

<coding_rules>
<typescript> - MUST: TypeScript Strict Mode 준수 - MUST: 명시적 타입 정의 (export 함수/컴포넌트는 반드시 명시) - MUST: 유틸리티 타입 적극 활용 (Pick, Omit, Partial, Record) - SHOULD: API 응답은 Zod 4.x 스키마로 런타임 검증 - MUST NOT: `any` 타입 사용 금지 - `unknown` 또는 제네릭 사용 - MUST NOT: Non-null assertion (`!`) 남용 금지 - 방어적 프로그래밍 - MUST NOT: `as any` 타입 단언 금지
</typescript>

  <zustand>
    <!-- Zustand 5.x 특성 반영 -->
    - MUST: 도메인별 분리 (useAuthStore, useEditorStore, useUIStore, useForeshadowingStore 등)
    - MUST: 서버 상태는 TanStack Query, 클라이언트 UI 상태만 Zustand
    - MUST: 직렬화 가능한 타입만 사용 (Set, Map 대신 배열/객체)
    - SHOULD: immer 11.x 미들웨어로 불변성 관리
    - MUST NOT: Set, Map 등 직렬화 불가 타입 저장
    - MUST NOT: 전역 상태에 서버 데이터 직접 저장 (TanStack Query 캐시 사용)
  </zustand>

<tanstack_query>

<!-- TanStack Query 5.x 특성 --> - MUST: queryKey는 배열 형태로 구조화 (예: ['documents', projectId]) - MUST: useQuery의 enabled 옵션으로 조건부 fetch - MUST: useMutation으로 서버 상태 변경, onSuccess에서 invalidateQueries - SHOULD: staleTime, gcTime 설정으로 캐시 전략 명시 - MUST NOT: useQuery 내부에서 직접 Zustand 업데이트 - MUST NOT: queryFn에서 예외 처리 없이 에러 throw (에러 바운더리 활용)

</tanstack_query>

  <react>
    <!-- React 19.x 특성 -->
    - MUST: 비즈니스 로직은 커스텀 훅으로 분리 (src/hooks/)
    - MUST: Props는 인터페이스로 명시적 정의
    - MUST: useEffect 의존성 배열 정확히 관리
    - SHOULD: useCallback/useMemo는 필요한 곳에만 (과도 사용 지양)
    - MUST NOT: 컴포넌트 내부에서 비즈니스 로직 직접 구현
    - MUST NOT: 3항 연산자 2중 이상 중첩
    - MUST NOT: useEffect에서 async 함수 직접 정의 (별도 함수 분리)
  </react>

  <tiptap>
    <!-- Tiptap 3.x 에디터 -->
    - MUST: Extension 패턴 준수 (configure, addCommands, addNodeView 등)
    - MUST: 중복 extension 등록 금지 (Underline 등 주의)
    - SHOULD: 커스텀 노드뷰는 ReactNodeViewRenderer 사용
    - SHOULD: Mention, CharacterMention 등은 suggestion 패턴 활용
  </tiptap>

  <style>
    - MUST: Tailwind CSS 사용, 인라인 스타일 금지
    - MUST: shadcn/ui 컴포넌트 우선 사용
    - MUST: 클래스 조합 시 `cn()` 유틸 사용 (src/lib/utils.ts)
    - SHOULD: 매직 스트링 지양, 상수 파일로 분리
  </style>

  <naming>
    - 변수명은 구체적으로: `data` → `userDataWithAuth`
    - 컴포넌트: PascalCase (예: `ChapterTree.tsx`)
    - 훅: use 접두사 + camelCase (예: `useDocuments.ts`)
    - 서비스: xxxService (예: `documentService.ts`)
    - 타입: PascalCase, I 접두사 지양 (예: `Document`, not `IDocument`)
    - 상수: UPPER_SNAKE_CASE (예: `DEFAULT_PAGE_SIZE`)
  </naming>
</coding_rules>

---

<restrictions>
  <!-- 이것만은 절대 하지 마 (Negative Constraints) -->

🔴 **MUST NOT (절대 금지)**:

- `any`, `as any` 타입 사용
- 인라인 스타일 (Tailwind 사용)
- console.log 커밋 (개발용 제외)
- Set, Map을 Zustand에 저장
- 중복 로직 작성 (기존 hooks/services 확인 필수)
- main/develop 브랜치에 직접 push
- PR 없이 main에 머지
- useEffect 의존성 배열 빈 배열로 회피 (린트 에러 무시)
- useQuery 내부에서 Zustand 직접 업데이트
- Tiptap extension 중복 등록
- wordCount 직접 업데이트 (백엔드가 계산)

⚠️ **SHOULD NOT (지양)**:

- 500줄 이상의 단일 파일
- 5개 이상의 props drilling (Context 또는 Zustand 사용)
- useEffect 내 async 함수 직접 정의
- 불필요한 리렌더링 유발 코드
- TanStack Query enabled 조건 없이 조건부 fetch
  </restrictions>

---

<workflow_protocol>

  <!-- AI 모델이 따라야 할 단계별 프로토콜 -->

1. **Analyze (분석)**
   - 사용자 요청을 파악하고 관련 파일 경로 확인
   - 기존 코드베이스에서 유사한 패턴 검색
   - src/hooks/, src/services/ 에서 기존 로직 확인

2. **Plan (계획 수립)**
   - 변경 계획을 단계별로 수립
   - 영향 받는 파일과 컴포넌트 나열
   - 기존 데이터 구조(Document, Project 등)와의 호환성 확인
   - TanStack Query vs Zustand 선택 판단

3. **Implement (구현)**
   - 계획에 따라 코드 작성
   - 기존 코드 파괴하지 않는지 확인
   - shadcn/ui, Tailwind 패턴 준수
   - hooks/services 레이어 분리 유지

4. **Verify (검증)** - 타입 에러 발생 여부 확인 (`npm run type-check`) - 의존성 배열 정확성 확인 - 린트 에러 해결 (`npm run lint`)
   </workflow_protocol>

---

<branch_strategy>

  <!-- 3-Layer 브랜치 전략 -->

| 브랜치      | 용도      | 직접 Push | PR 대상          |
| ----------- | --------- | --------- | ---------------- |
| `main`      | 프로덕션  | ❌ 금지   | hotfix/\*        |
| `develop`   | 개발 통합 | ❌ 금지   | feature/_, fix/_ |
| `feature/*` | 기능 개발 | ✅ 허용   | → develop        |
| `fix/*`     | 버그 수정 | ✅ 허용   | → develop        |
| `hotfix/*`  | 긴급 수정 | ✅ 허용   | → main           |

**상세 가이드**: [GIT_STRATEGY.md](GIT_STRATEGY.md)
</branch_strategy>

---

<commit_convention>

  <!-- Conventional Commits -->

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅 (동작 변화 X)
refactor: 리팩토링 (동작 변화 X)
perf: 성능 개선
test: 테스트 추가
chore: 빌드, 설정, 의존성 변경
ci: CI/CD 설정 변경
hotfix: 긴급 수정
```

**예시**:

- `feat: 복선 태그 자동완성 기능 추가`
- `fix(editor): 챕터 트리 드래그 오류 수정`
- `chore(deps): eslint 규칙 변경`
  </commit_convention>

---

<ai_code_review>

  <!--
    이 섹션은 GitHub Actions의 ai-review.yml 워크플로우에서 사용됩니다.
    수정 시 워크플로우에도 영향을 미칩니다.
  -->

## AI 코드 리뷰어 페르소나

당신은 **StoLink 프로젝트의 시니어 개발자이자 UI/UX 전문가**입니다.

### 프로젝트 컨텍스트

- 스토리, 복선, 캐릭터 관계를 관리하는 작가용 웹앱
- 기술 스택: React 19.2, TypeScript 5.9, Zustand 5.0, TanStack Query 5.90, Tiptap 3.14
- 핵심 타입: Document, Project, Character, Foreshadowing
- 폴더 구조: 12 hooks (src/hooks/), 12 services (src/services/), 8 stores (src/stores/)

### 리뷰 우선순위

1. **치명적** (🔴): 런타임 에러, 타입 오류, 보안 취약점
2. **경고** (⚠️): 성능 이슈, 안티패턴, 상태 관리 문제
3. **제안** (💡): 코드 스타일, 리팩토링 (선택사항)

## 🔴 치명적 (즉시 수정)

- 런타임 에러 가능성
- 타입 오류 (`any`, `as any`, Non-null assertion 남용)
- 보안 취약점 (XSS, 인젝션)
- Zustand 직렬화 이슈 (Set, Map 저장)
- React Hook 규칙 위반 (조건부 호출, 루프 내 호출)
- TanStack Query queryKey 불일치 (캐시 무효화 실패)
- Tiptap extension 중복 등록
- useEffect 의존성 배열 오류

## ⚠️ 경고 (권장 수정)

- 성능 이슈 (불필요한 리렌더링, 메모이제이션 누락)
- 안티패턴 (props drilling 5개 이상, 비즈니스 로직 컴포넌트 내 구현)
- 중복 로직 (기존 hooks/services 미사용)
- TanStack Query enabled 조건 누락
- 잘못된 캐시 전략 (staleTime 미설정)
- 500줄 이상의 단일 파일

## 💡 제안 (선택)

- 코드 스타일 개선
- 리팩토링 기회
- 더 나은 패턴 제안

## 출력 규칙

1. 🔴 치명적, ⚠️ 경고가 하나라도 있으면 해당 섹션 출력
2. 🔴, ⚠️가 없으면 '✅ 코드 리뷰 통과 - 수정 필요 사항 없음' 출력
3. 💡 제안은 선택사항이므로 '수정 필요'로 취급하지 않음

## 출력 형식

```
### 🔴 치명적 (N건)
**파일:라인** - 이슈 제목
- 문제: 설명
- 개선: 코드 예시

### ⚠️ 경고 (N건)
**파일:라인** - 이슈 제목
> 설명

---
💡 **참고 제안** (선택사항)
- 제안 내용
```

</ai_code_review>

---

<file_structure>

  <!-- 2025.12.26 기준 실제 구조 -->

```
src/
├── api/                 # API 클라이언트 (client.ts)
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트 (23개)
│   ├── editor/          # 에디터 관련 (27개: Tiptap, Toolbar, Sidebar, extensions/)
│   ├── graph/           # 관계도 (React Flow)
│   ├── common/          # 공통 (Footer, Modal 등 4개)
│   ├── library/         # 라이브러리 페이지 컴포넌트 (3개)
│   └── layouts/         # 레이아웃 (3개)
├── hooks/               # 커스텀 훅 (12개)
│   ├── useDocuments.ts  # ⭐ 문서 CRUD (TanStack Query)
│   ├── useProjects.ts   # 프로젝트 관리
│   ├── useCharacters.ts # 캐릭터 관리
│   ├── useForeshadowing.ts # 복선 관리
│   ├── useAuth.ts       # 인증
│   ├── useAI.ts         # AI 기능
│   ├── useExport.ts     # 내보내기
│   ├── useJobPolling.ts # 비동기 작업 폴링
│   └── ...
├── services/            # API 서비스 레이어 (12개)
│   ├── documentService.ts # 문서 API
│   ├── projectService.ts
│   ├── characterService.ts
│   ├── foreshadowingService.ts
│   ├── aiService.ts
│   ├── exportService.ts
│   └── ...
├── stores/              # Zustand 스토어 (8개)
│   ├── useAuthStore.ts
│   ├── useEditorStore.ts
│   ├── useUIStore.ts
│   ├── useForeshadowingStore.ts
│   ├── useChapterStore.ts
│   ├── useSceneStore.ts
│   └── useDemoStore.ts
├── types/               # 타입 정의 (9개)
│   ├── document.ts      # ⭐ Document, DocumentMetadata
│   ├── project.ts       # Project, ProjectStats
│   ├── character.ts     # Character, CharacterRelationship, Place, Item
│   ├── foreshadowing.ts
│   ├── auth.ts
│   └── api.ts           # ApiResponse, JobResponse
├── pages/               # 페이지 컴포넌트 (9개)
├── repositories/        # 로컬 데이터 저장소 (2개)
├── lib/                 # 유틸리티 (utils.ts - cn 함수)
├── data/                # 목 데이터, 상수, 데모 데이터 (3개)
└── styles/              # 추가 스타일
```

</file_structure>

---

<commands>
  <!-- 자주 사용하는 명령어 -->

| 명령어               | 설명                             |
| -------------------- | -------------------------------- |
| `npm run dev`        | 개발 서버 시작 (localhost:5173)  |
| `npm run build`      | 프로덕션 빌드 (tsc + vite build) |
| `npm run lint`       | ESLint 검사                      |
| `npm run lint:fix`   | ESLint 자동 수정                 |
| `npm run type-check` | TypeScript 타입 검사             |
| `npm run format`     | Prettier 포맷팅                  |

</commands>

---

<workflow_integration>

  <!-- 연동된 워크플로우 -->

| 워크플로우      | 파일                                    | 트리거                             | 설명                   |
| --------------- | --------------------------------------- | ---------------------------------- | ---------------------- |
| AI 코드 리뷰    | `.github/workflows/ai-review.yml`       | PR 생성/업데이트, `/review` 코멘트 | Claude API로 코드 리뷰 |
| 스마트 커밋     | `.agent/workflows/smart-commit.md`      | `/smart-commit` 명령               | 커밋, 푸시, PR 관리    |
| 프로덕션 배포   | `.github/workflows/deploy.yml`          | main push                          | S3 + CloudFront        |
| 개발 배포       | `.github/workflows/deploy_dev.yml`      | develop push                       | 개발 환경 배포         |
| Hotfix Backport | `.github/workflows/hotfix-backport.yml` | hotfix/\* → main 머지              | develop에 자동 체리픽  |

</workflow_integration>

---

<request_guidelines>

  <!-- 요청 시 주의사항 -->

1. 새 기능은 기존 데이터 구조(Document, Project 등)와 호환성 확인
2. 상태 추가 시 TanStack Query (서버) vs Zustand (클라이언트) 판단 필수
3. API 호출은 services/ 레이어 통해서, 훅은 hooks/ 에서 TanStack Query 사용
4. 복잡한 타입은 단계적으로 분리 (base → extended)
5. 에디터 관련은 Tiptap Extension 패턴 준수 (extensions/ 폴더)
6. UI 컴포넌트는 shadcn/ui 스타일 가이드 준수
7. 기존 hooks/services 확인 후 중복 방지
8. 응답은 한국어로 작성
   </request_guidelines>

---

<reference_docs>

  <!-- 참고 문서 (SSOT) -->

| 문서              | 내용                          |
| ----------------- | ----------------------------- |
| `DATA_MODEL.md`   | 타입 정의, 데이터 구조 (v1.3) |
| `API_SPEC.md`     | 백엔드 API 명세               |
| `SPEC.md`         | 기능 명세서                   |
| `ARCHITECTURE.md` | 아키텍처 개요                 |
| `GIT_STRATEGY.md` | 브랜치 전략 상세              |

</reference_docs>

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                                                                                                                   |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0  | 2024.12    | 최초 작성                                                                                                                                   |
| 1.1  | 2024.12    | 워크플로우 연동 섹션 추가                                                                                                                   |
| 2.0  | 2025.12.26 | XML 태그 구조화, MUST/MUST NOT 규칙 강화                                                                                                    |
| 2.1  | 2025.12.26 | 실제 버전 반영 (React 19, TS 5.9, Vite 7.2), TanStack Query 규칙 추가, 파일 구조 업데이트 (12 hooks, 8 stores, 12 services), 리뷰 기준 보강 |
