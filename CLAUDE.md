# CLAUDE.md - StoLink Project Constitution

> 이 문서는 AI 모델이 프로젝트 컨텍스트를 이해하고, 코드 품질을 일관되게 유지하기 위한 **프로젝트 헌법(Constitution)**입니다.

**버전:** 2.0
**최종 수정:** 2025년 12월 26일
**문서 상태:** 활성

---

<project_info>
<description>
StoLink - 작가용 AI 기반 스토리 관리 플랫폼
복선 관리, 캐릭터 관계도, 세계관 설정, 일관성 체크를 지원하는 장편 소설 집필 도구
</description>

<tech_stack> - Framework: React 18.2, TypeScript 5.0, Vite 5.x - State: Zustand (전역), TanStack Query v5 (서버), React Hook Form (폼) - UI: Tailwind CSS 3.4, shadcn/ui, Radix UI - Editor: Tiptap 2.x (ProseMirror 기반) - Graph: React Flow (캐릭터 관계도) - DnD: dnd-kit (챕터 트리) - Backend: Spring Boot, PostgreSQL, Neo4j
</tech_stack>

<core_entities> - Project: 작품 (여러 Document 포함) - Document: 폴더(folder) 또는 텍스트(text) - Scrivener 스타일 재귀 구조 - Character: 캐릭터 (Neo4j 노드, extras로 동적 속성) - Foreshadowing: 복선 (#복선:태그명 형식, 등장/회수 추적) - Place: 장소, Item: 아이템
</core_entities>
</project_info>

---

<coding_rules>
<typescript> - MUST: 모든 코드는 TypeScript Strict Mode 준수 - MUST: 명시적 타입 정의 (추론 가능해도 export 함수/컴포넌트는 명시) - MUST: 유틸리티 타입 적극 활용 (Pick, Omit, Partial, Record) - SHOULD: API 응답은 Zod 스키마로 런타임 검증 - MUST NOT: `any` 타입 사용 금지 - `unknown` 또는 제네릭 사용 - MUST NOT: Non-null assertion (`!`) 남용 금지 - 방어적 프로그래밍 - MUST NOT: `as any` 타입 단언 금지
</typescript>

  <zustand>
    - MUST: 도메인별 분리 (useAuthStore, useEditorStore, useUIStore)
    - MUST: 서버 상태는 TanStack Query, 클라이언트 상태만 Zustand
    - MUST: 직렬화 가능한 타입만 사용 (Set, Map 대신 배열/객체)
    - SHOULD: immer 미들웨어로 불변성 관리
    - MUST NOT: Set, Map 등 직렬화 불가 타입 저장
    - MUST NOT: 전역 상태에 서버 데이터 직접 저장 (캐시 목적 제외)
  </zustand>

  <react>
    - MUST: 비즈니스 로직은 커스텀 훅으로 분리
    - MUST: Props는 인터페이스로 명시적 정의
    - MUST: useEffect 의존성 배열 정확히 관리
    - SHOULD: useCallback/useMemo는 필요한 곳에만 (과도 사용 지양)
    - MUST NOT: 컴포넌트 내부에서 비즈니스 로직 직접 구현
    - MUST NOT: 3항 연산자 2중 이상 중첩
  </react>

  <style>
    - MUST: Tailwind CSS 사용, 인라인 스타일 금지
    - MUST: shadcn/ui 컴포넌트 우선 사용
    - MUST: 클래스 조합 시 `cn()` 유틸 사용
    - SHOULD: 매직 스트링 지양, 상수 파일로 분리
  </style>

  <naming>
    - 변수명은 구체적으로: `data` → `userDataWithAuth`
    - 컴포넌트: PascalCase (예: `ChapterTree.tsx`)
    - 훅: use 접두사 + camelCase (예: `useDocuments.ts`)
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
- 중복 로직 작성 (기존 유틸/훅 확인 필수)
- main/develop 브랜치에 직접 push
- PR 없이 main에 머지
- 의존성 배열 빈 배열로 회피 (린트 에러 무시)

⚠️ **SHOULD NOT (지양)**:

- 500줄 이상의 단일 파일
- 5개 이상의 props drilling
- useEffect 내 async 함수 직접 정의
- 불필요한 리렌더링 유발 코드
  </restrictions>

---

<workflow_protocol>

  <!-- AI 모델이 따라야 할 단계별 프로토콜 -->

1. **Analyze (분석)**
   - 사용자 요청을 파악하고 관련 파일 경로 확인
   - 기존 코드베이스에서 유사한 패턴 검색

2. **Plan (계획 수립)**
   - 변경 계획을 단계별로 수립
   - 영향 받는 파일과 컴포넌트 나열
   - 기존 데이터 구조와의 호환성 확인

3. **Implement (구현)**
   - 계획에 따라 코드 작성
   - 기존 코드 파괴하지 않는지 확인
   - shadcn/ui, Tailwind 패턴 준수

4. **Verify (검증)** - 타입 에러 발생 여부 확인 - 의존성 배열 정확성 확인 - 린트 에러 해결
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

<code_review_criteria>

  <!-- AI 코드 리뷰 기준 -->

### 🔴 치명적 (즉시 수정)

- 런타임 에러 가능성
- 타입 오류
- 보안 취약점
- Zustand 직렬화 이슈
- React Hook 규칙 위반

### ⚠️ 경고 (권장 수정)

- 성능 이슈 (불필요한 리렌더링)
- 안티패턴
- 의존성 배열 오류
- 중복 로직

### 💡 제안 (선택)

- 코드 스타일 개선
- 리팩토링 기회
- 더 나은 패턴 제안
  </code_review_criteria>

---

<file_structure>

```
src/
├── api/                 # API 클라이언트 (client.ts)
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── editor/          # 에디터 관련 (Tiptap, Toolbar, Sidebar)
│   ├── graph/           # 관계도 (React Flow)
│   ├── common/          # 공통 (Footer, Modal)
│   ├── library/         # 라이브러리 페이지 컴포넌트
│   └── layouts/         # 레이아웃
├── hooks/               # 커스텀 훅 (useDocuments, useAuth 등)
├── pages/               # 페이지 컴포넌트
├── services/            # API 서비스 레이어
├── stores/              # Zustand 스토어
├── types/               # 타입 정의
├── lib/                 # 유틸리티 (utils.ts, cn 함수)
├── data/                # 목 데이터, 상수, 데모 데이터
└── repositories/        # 로컬 데이터 저장소
```

</file_structure>

---

<commands>
  <!-- 자주 사용하는 명령어 -->

| 명령어               | 설명                            |
| -------------------- | ------------------------------- |
| `npm run dev`        | 개발 서버 시작 (localhost:5173) |
| `npm run build`      | 프로덕션 빌드                   |
| `npm run lint`       | ESLint 검사                     |
| `npm run type-check` | TypeScript 타입 검사            |

</commands>

---

<workflow_integration>

  <!-- 연동된 워크플로우 -->

| 워크플로우    | 파일                               | 트리거               |
| ------------- | ---------------------------------- | -------------------- |
| AI 코드 리뷰  | `.github/workflows/ai-review.yml`  | PR 생성/업데이트 시  |
| 스마트 커밋   | `.agent/workflows/smart-commit.md` | `/smart-commit` 명령 |
| 프로덕션 배포 | `.github/workflows/deploy.yml`     | main push 시         |
| 개발 배포     | `.github/workflows/deploy_dev.yml` | develop push 시      |

</workflow_integration>

---

<reference_docs>

  <!-- 참고 문서 (SSOT) -->

| 문서              | 내용                   |
| ----------------- | ---------------------- |
| `DATA_MODEL.md`   | 타입 정의, 데이터 구조 |
| `API_SPEC.md`     | 백엔드 API 명세        |
| `SPEC.md`         | 기능 명세서            |
| `ARCHITECTURE.md` | 아키텍처 개요          |
| `GIT_STRATEGY.md` | 브랜치 전략 상세       |

</reference_docs>

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                                          |
| ---- | ---------- | ------------------------------------------------------------------ |
| 1.0  | 2024.12    | 최초 작성                                                          |
| 1.1  | 2024.12    | 워크플로우 연동 섹션 추가                                          |
| 2.0  | 2025.12.26 | XML 태그 구조화, MUST/MUST NOT 규칙 강화, 워크플로우 프로토콜 추가 |
