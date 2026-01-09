# CLAUDE.md - StoLink Project Constitution

> AI 모델이 세션 시작 시 **반드시** 읽어야 하는 핵심 헌법입니다.

**버전**: 3.0
**최종 수정**: 2026년 1월 6일
**문서 상태**: 활성

---

## 프로젝트 개요

**StoLink** - 작가용 AI 기반 스토리 관리 플랫폼
복선 관리, 캐릭터 관계도, 세계관 설정, 일관성 체크를 지원하는 장편 소설 집필 도구

**기술 스택**: React 19.2, TypeScript 5.9, Zustand 5.0, TanStack Query 5.90, Tiptap 3.14
**백엔드**: Spring Boot, PostgreSQL, Neo4j

---

## 절대적 제약 사항 (MUST NOT)

🔴 **다음 규칙은 절대 위반 금지**:

- `any`, `as any` 타입 사용
- 인라인 스타일 (Tailwind 사용)
- console.log 커밋 (개발용 제외)
- Set, Map을 Zustand에 저장
- 중복 로직 작성 (기존 hooks/services 확인 필수)
- main/dev 브랜치에 직접 push (PR 필수)
- useEffect 의존성 배열 회피 (린트 에러 무시)
- useQuery 내부에서 Zustand 직접 업데이트
- Tiptap extension 중복 등록
- wordCount 직접 업데이트 (백엔드가 계산)

---

## 핵심 아키텍처 원칙 (MUST)

### TypeScript

- Strict Mode 준수
- 명시적 타입 정의 (export 함수/컴포넌트 필수)
- 유틸리티 타입 활용 (Pick, Omit, Partial, Record)
- Zod 4.x로 API 응답 런타임 검증

### State Management

- **TanStack Query**: 서버 상태 (문서, 프로젝트, 캐릭터 등)
- **Zustand**: 클라이언트 UI 상태 (에디터, 사이드바 등)
- **React Hook Form**: 폼 상태

### React

- 비즈니스 로직은 커스텀 훅으로 분리 (src/hooks/)
- Props는 인터페이스로 명시적 정의
- useEffect 의존성 배열 정확히 관리

### Style

- Tailwind CSS 사용, `cn()` 유틸로 클래스 조합
- shadcn/ui 컴포넌트 우선 사용
- "Warm & Soft" 디자인 시스템 준수

### Naming

- 컴포넌트: PascalCase
- 훅: use + camelCase
- 서비스: xxxService
- 타입: PascalCase (I 접두사 지양)
- 상수: UPPER_SNAKE_CASE

---

## Workflow Protocol

AI 모델이 따라야 할 4단계 프로토콜:

1. **Analyze**: 사용자 요청 파악, 관련 파일 경로 확인, 기존 코드베이스에서 유사 패턴 검색
2. **Plan**: 변경 계획 수립, 영향 받는 파일 나열, 데이터 구조 호환성 확인
3. **Implement**: 코드 작성, 기존 코드 파괴 방지, hooks/services 레이어 분리 유지
4. **Verify**: 타입 에러 확인, 의존성 배열 검증, 린트 에러 해결

---

## Appendix 색인 (참조 문서)

상세 정보가 필요할 때 다음 문서를 참조하세요:

| 문서                                                        | 내용                                   |
| ----------------------------------------------------------- | -------------------------------------- |
| **[tech-stack.md](appendix/tech-stack.md)**                 | 실제 버전 정보, 파일 구조, 명령어      |
| **[design-system.md](appendix/design-system.md)**           | 컬러 팔레트, 타이포그래피, 디자인 원칙 |
| **[api-reference.md](appendix/api-reference.md)**           | API 엔드포인트, 인증, SSE, 캐시 전략   |
| **[tiptap-guide.md](appendix/tiptap-guide.md)**             | Tiptap Extension 패턴, 주의사항        |
| **[domain-glossary.md](appendix/domain-glossary.md)**       | StoLink 도메인 용어, 핵심 Entity       |
| **[ai-review-protocol.md](appendix/ai-review-protocol.md)** | AI 코드 리뷰 규칙 (GitHub Actions 용)  |

---

## 참고 문서 구조 (docs/)

사람이 읽는 상세 문서:

```
docs/
├── critical/          # 성능, 트러블슈팅
│   ├── TROUBLESHOOTING.md
├── spec/              # 명세서
│   ├── API_SPEC.md
│   ├── DATA_MODEL.md
│   ├── SPEC.md
│   └── narrative-platform-requirements.md
├── architecture/      # 아키텍처
│   ├── ARCHITECTURE.md
│   └── TECHSTACK.md
└── workflow/          # Git 전략
    └── GIT_STRATEGY.md
```

<!-- Mocha & Cloud Dancer Design System -->

## Target Color Palette

### Primary (Mocha) & Surface (Cloud)

| 이름 (Token) | HEX     | 용도 및 특징               |
| ------------ | ------- | -------------------------- |
| Mocha 500    | #A47764 | 핵심 브랜드 색상           |
| Mocha 400    | #BD9B8D | Hover 상태 (고휘도)        |
| Mocha 700    | #7D5A4B | Dark/Active 상태           |
| Cloud 50     | #F1F0EC | 메인 배경색 (Cloud Dancer) |
| Espresso 900 | #3D302A | 본문 텍스트                |

### DOECHII Official Palette

| 이름      | HEX     | 용도                       |
| --------- | ------- | -------------------------- |
| Doechii 1 | #122611 | Deep Forest Green (포인트) |
| Doechii 2 | #BF8A49 | Golden Tan (강조)          |
| Doechii 3 | #D9B89C | Light Peach (부제목)       |
| Doechii 4 | #8C3D20 | Burnt Mocha (아이콘/강조)  |
| Doechii 5 | #401309 | Deep Chocolate (어두운 글) |

### Status Colors

| 이름    | HEX     | 용도                    |
| ------- | ------- | ----------------------- |
| Success | #5B7B4B | 성공/긍정 피드백        |
| Warning | #B8860B | 경고 (가독성 확보 골드) |
| Error   | #A33A3A | 오류 (공학용 레드)      |

### Relationship Colors (TW3K/CK3 스타일)

| 관계 유형 | HEX     | 설명                       |
| --------- | ------- | -------------------------- |
| Friendly  | #15803D | Dark Green (신뢰, 협력)    |
| Hostile   | #F44336 | Red (갈등, 적대)           |
| Romantic  | #FF4081 | Vivid Blossom (애정, 열정) |

**참고**: 관계 강도(Strength)에 따른 색상 구분은 제거되고 통합되었습니다.

## 디자인 원칙

- **Warm & Soft**: Mocha와 Cloud Colors를 사용하여 따뜻하고 부드러운 분위기 연출
- **Unified Typography**: 모든 텍스트에 **Pretendard** 단일 폰트 적용 (Modern & Professional)
- **가독성 확보**: Cloud Dancer 배경 위 Espresso 900 텍스트로 12:1 이상 명도 대비 확보
- **일관성**: 모든 UI 요소는 새로운 색체계를 준수하여 시각적 통일성 유지

## Core Philosophy

- **Literary IDE**: "Beautiful logic for authors." Create a premium, organized drafting environment.
- **Warm Immersion**: Avoid cold "tech" aesthetics. Focus on a comfortable, long-form writing experience.
- **Precision Typography**: Strictly use **Pretendard** for all UI and content.

## Design Quality Standards

- **Typography**:
  - **Unified**: Use **Pretendard** for everything. No Serif or Monospace variations.
  - Optimize for readability with generous `line-height` and balanced kerning.
- **Color & Theme**:
  - Primary: `Mocha` palette for accents and primary actions.
  - Surface: `Cloud` palette for backgrounds and panels.
- **Motion & Interaction**:
  - Use `framer-motion` for complex animations, CSS transitions for simple ones.
  - Soft, organic transitions (`cubic-bezier(0.19, 1, 0.22, 1)`).
- **Composition**:
  - Balanced negative space and deliberate hierarchy.
  - Soft shadows (`shadow-paper`) and organic borders (`rounded-xl`).

## 🔴 Anti-Patterns (MUST NOT)

- Hardcoded Midnight hex codes (e.g., #0A0A0A). Use semantic tokens.
- Non-Pretendard fonts (Serif, Monospace).
- Sharp corners or cold "Terminal" aesthetic.

---

## Git 브랜치 전략 (3-Layer)

| 브랜치      | 용도      | 직접 Push | PR 대상          |
| ----------- | --------- | --------- | ---------------- |
| `main`      | 프로덕션  | ❌ 금지   | hotfix/\*        |
| `dev`       | 개발 통합 | ❌ 금지   | feature/_, fix/_ |
| `feature/*` | 기능 개발 | ✅ 허용   | → dev            |
| `fix/*`     | 버그 수정 | ✅ 허용   | → dev            |
| `hotfix/*`  | 긴급 수정 | ✅ 허용   | → main           |

**상세**: [docs/workflow/GIT_STRATEGY.md](docs/workflow/GIT_STRATEGY.md)

---

## Commit Convention

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

---

## 핵심 Entity (Quick Reference)

- **Document**: 폴더(folder) 또는 텍스트(text), Scrivener 스타일 재귀 구조 ⭐
- **Project**: 작품 (프로젝트 단위, stats 포함)
- **Character**: 캐릭터 (extras로 동적 속성, Neo4j 연동)
- **Foreshadowing**: 복선 (tag, status, appearances 배열)
- **CharacterRelationship**: 관계 (sourceId, targetId, type, strength)

**상세**: [appendix/domain-glossary.md](appendix/domain-glossary.md)

---

## Workflow Integration

| 워크플로우      | 파일                                    | 트리거               |
| --------------- | --------------------------------------- | -------------------- |
| AI 코드 리뷰    | `.github/workflows/ai-review.yml`       | PR 생성/업데이트     |
| 스마트 커밋     | `.agent/workflows/smart-commit.md`      | `/smart-commit` 명령 |
| 프로덕션 배포   | `.github/workflows/deploy.yml`          | main push            |
| 개발 배포       | `.github/workflows/deploy_dev.yml`      | dev push             |
| Hotfix Backport | `.github/workflows/hotfix-backport.yml` | hotfix/\* → main     |

---

## Request Guidelines

1. 새 기능은 기존 데이터 구조(Document, Project 등)와 호환성 확인
2. 상태 추가 시 TanStack Query (서버) vs Zustand (클라이언트) 판단 필수
3. API 호출은 services/ 레이어, 훅은 hooks/에서 TanStack Query 사용
4. 복잡한 타입은 단계적으로 분리 (base → extended)
5. 에디터 관련은 Tiptap Extension 패턴 준수
6. UI 컴포넌트는 shadcn/ui 스타일 가이드 준수
7. 기존 hooks/services 확인 후 중복 방지
8. **응답은 한국어로 작성**

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                          |
| ---- | ---------- | -------------------------------------------------- |
| 3.0  | 2026.01.06 | 200줄 이하로 압축, Appendix 분리, 핵심 규칙만 유지 |
| 2.3  | 2025.12.27 | 디자인 시스템 섹션 추가                            |
| 2.0  | 2025.12.26 | XML 태그 구조화, MUST/MUST NOT 규칙 강화           |
| 1.0  | 2024.12    | 최초 작성                                          |
