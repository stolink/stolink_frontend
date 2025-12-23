# StoLink - Claude 인스트럭션

> 이 문서는 GitHub Claude 및 Cursor AI가 프로젝트 컨텍스트를 이해하기 위한 가이드입니다.

**버전:** 1.1
**최종 수정:** 2025년 12월
**문서 상태:** 활성

---

## 프로젝트 개요

**StoLink** - 작가용 AI 기반 스토리 관리 플랫폼

- 복선 관리, 캐릭터 관계도, 세계관 설정, 일관성 체크
- 대상: 장편 소설 작가 (방대한 세계관 관리 필요)

---

## 기술 스택

| 영역      | 기술                                                        |
| --------- | ----------------------------------------------------------- |
| Framework | React 18, TypeScript 5, Vite                                |
| 상태관리  | Zustand (전역), TanStack Query (서버), React Hook Form (폼) |
| UI        | Tailwind CSS, shadcn/ui                                     |
| 에디터    | Tiptap (ProseMirror 기반)                                   |
| 그래프    | React Flow (캐릭터 관계도)                                  |
| DnD       | dnd-kit (챕터 트리)                                         |

---

## 핵심 데이터 구조

```typescript
// 프로젝트 (작품)
interface Project {
  id: string;
  title: string;
  genre: Genre;
  status: "draft" | "completed";
  chapters: Chapter[];
  characters: Character[];
  foreshadowings: Foreshadowing[];
}

// 챕터
interface Chapter {
  id: string;
  projectId: string;
  parentId: string | null; // 계층 구조 (부 > 장 > 절)
  title: string;
  content: string; // 마크다운
  order: number;
}

// 캐릭터
interface Character {
  id: string;
  name: string;
  description: string;
  relations: Relation[]; // Neo4j 그래프 데이터
}

// 복선
interface Foreshadowing {
  id: string;
  tag: string; // #복선:태그명
  chapterId: string;
  status: "pending" | "resolved";
  resolvedChapterId?: string;
}
```

---

## 코드 작성 원칙

### TypeScript

- `any` 사용 금지, 명시적 타입 정의
- 유틸리티 타입 적극 활용 (Pick, Omit, Partial)
- API 응답은 Zod 스키마로 런타임 검증
- Non-null assertion (`!`) 남용 금지, 방어적 프로그래밍

### Zustand 스토어

- 도메인별 분리: `useProjectStore`, `useEditorStore`, `useUIStore`
- 서버 상태는 TanStack Query, 클라이언트 상태만 Zustand
- **직렬화 가능한 타입만 사용** (Set, Map 대신 배열/객체)
- immer 미들웨어로 불변성 관리

### React

- 비즈니스 로직은 커스텀 훅으로 분리
- Props는 인터페이스로 명시적 정의
- useEffect 의존성 배열 정확히 관리
- useCallback/useMemo 적절히 사용

### 컴포넌트

- shadcn/ui 컴포넌트 우선 사용
- Tailwind 클래스는 `cn()` 유틸로 조합
- 매직 스트링 지양, 상수 파일로 분리

---

## 파일 구조

```
src/
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── editor/          # 에디터 관련
│   ├── graph/           # 관계도
│   ├── common/          # 공통 (Footer, Modal 등)
│   └── layouts/         # 레이아웃
│
├── pages/               # 페이지 컴포넌트
├── stores/              # Zustand 스토어
├── hooks/               # 커스텀 훅
├── api/                 # API 클라이언트
├── types/               # 타입 정의
├── lib/                 # 유틸리티
└── data/                # 목 데이터, 상수
```

---

## 금지 사항

- `any`, `as any` 타입 단언
- 인라인 스타일 (Tailwind 사용)
- 전역 상태에 서버 데이터 직접 저장
- console.log 커밋 (개발용 제외)
- Set, Map 등 직렬화 불가 타입을 Zustand에 저장
- 중복 로직 (기존 유틸/훅 재사용)

---

## 브랜치 전략

```
release ────●─────────────●───────▶ (프로덕션)
            ↑             ↑
main ───●───●───●───●───●───●───▶ (스테이징/QA)
         \     /   \   /
          feature   fix
```

| 브랜치      | 용도                       | 머지 방향                        |
| ----------- | -------------------------- | -------------------------------- |
| `release`   | 안정화 버전, 프로덕션 배포 | main → release (PR)              |
| `main`      | 개발 통합, QA 테스트       | feature → main (PR)              |
| `feature/*` | 기능 개발                  | -                                |
| `fix/*`     | 버그 수정                  | -                                |
| `hotfix/*`  | 긴급 수정                  | release → hotfix → release, main |

---

## 커밋 컨벤션

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅 (동작 변화 X)
refactor: 리팩토링 (동작 변화 X)
test: 테스트 추가
chore: 빌드, 설정, 의존성 변경
hotfix: 긴급 수정
```

**예시:**

```
feat: 복선 태그 자동완성 기능 추가
fix: 챕터 트리 드래그 오류 수정
chore: eslint 규칙 변경
```

---

## 코드 리뷰 기준

### 🔴 치명적 (즉시 수정)

- 런타임 에러 가능성
- 타입 오류
- 보안 취약점
- Zustand 직렬화 이슈

### ⚠️ 경고 (권장 수정)

- 성능 이슈 (불필요한 리렌더링, useMemo/useCallback 누락)
- 안티패턴
- React 훅 의존성 배열 오류
- 중복 로직

### 💡 제안 (선택)

- 코드 스타일 개선
- 리팩토링 기회
- 더 나은 패턴 제안

---

## 요청 시 주의사항

1. 새 기능은 기존 데이터 구조(Project, Chapter 등)와 호환성 확인
2. 상태 추가 시 Zustand vs TanStack Query 적합성 판단
3. 복잡한 타입은 단계적으로 분리 (base → extended)
4. 에디터 관련은 Tiptap Extension 패턴 준수
5. UI 컴포넌트는 shadcn/ui 스타일 가이드 준수
6. 응답은 한국어로 작성

---

## 워크플로우 연동

이 문서는 다음 워크플로우들과 유기적으로 연동됩니다:

| 워크플로우   | 파일                               | 역할                                              |
| ------------ | ---------------------------------- | ------------------------------------------------- |
| AI 코드 리뷰 | `.github/workflows/ai-review.yml`  | PR 생성 시 자동으로 이 문서의 코드 리뷰 기준 적용 |
| 스마트 커밋  | `.agent/workflows/smart-commit.md` | 커밋 컨벤션 및 브랜치 전략 참조                   |

### 연동 방식

1. **PR 생성** → `ai-review.yml` 트리거
2. **Claude Code Action**이 `CLAUDE.md` 자동 인식
3. **코드 리뷰 기준**에 따라 리뷰 생성
4. **커밋 컨벤션** 준수 여부 확인

---

## 참고 문서

| 문서           | 내용                         | 용도                           |
| -------------- | ---------------------------- | ------------------------------ |
| `SPEC.md`      | 페이지 구성 및 기능 명세서   | UI/UX 구현 시 참조             |
| `TECHSTACK.md` | 프론트엔드 기술 스택 상세    | 기술 선택 및 라이브러리 사용법 |
| `README.md`    | 프로젝트 소개 및 시작 가이드 | 온보딩                         |

---

## 버전 이력

| 버전 | 날짜    | 변경 내용                                                 |
| ---- | ------- | --------------------------------------------------------- |
| 1.0  | 2024.12 | 최초 작성                                                 |
| 1.1  | 2024.12 | 워크플로우 연동 섹션 추가, 참고 문서 테이블 형식으로 개선 |
