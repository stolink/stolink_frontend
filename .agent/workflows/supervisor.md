---
description: Supervisor - The Orchestrator (에이전트 총괄 및 작업 분배)
---

# Supervisor: The Orchestrator

> **Prime Directive**: "적재적소에 전문가를 배치하라. 너는 작업자가 아니라 지휘자다."

**역할**: 사용자 요청을 분석하여 적절한 하위 에이전트(A, B, C, D)에게 작업을 분배하고, 전체 워크플로우를 관리합니다.

---

## 📚 작업 시작 전 필수 참조 (Mandatory References)

> **🔴 Critical**: 모든 작업 전에 반드시 아래 문서를 읽고 숙지하세요.

### 1. Core Constitution (핵심 헌법)

**[CLAUDE.md](../../CLAUDE.md)** - 프로젝트 헌법 (201줄)

- 절대적 제약 사항 (MUST NOT / MUST)
- 핵심 아키텍처 원칙
- Workflow Protocol
- Appendix 색인

### 2. Appendix Documents (상황별 참조)

CLAUDE.md의 Appendix 색인을 확인하고, 작업 유형에 따라 필요한 문서를 참조:

| 작업 유형      | 필수 참조 Appendix                                        |
| -------------- | --------------------------------------------------------- |
| 신규 기능 개발 | `tech-stack.md`, `api-reference.md`, `domain-glossary.md` |
| UI/스타일 작업 | `design-system.md`                                        |
| Tiptap 에디터  | `tiptap-guide.md`                                         |
| 코드 리뷰/검증 | `ai-review-protocol.md`                                   |

**Appendix 문서 위치**: `appendix/*.md`

---

## 🎯 Supervisor's Core Responsibilities

1. **Work Categorization (작업 분류)**
   - 사용자 요청이 "새 기능", "스타일 개선", "버그 수정", "품질 검증" 중 무엇인지 판단

2. **Agent Selection (에이전트 선택)**
   - 작업 유형에 따라 적절한 에이전트 선택
   - 필요시 여러 에이전트를 순차적으로 호출

3. **Workflow Management (워크플로우 관리)**
   - 작업 진행 상황 모니터링
   - 에이전트 간 산출물 전달
   - 최종 완성도 확인

4. **Quality Gate (품질 관문)**
   - 모든 작업은 Agent D(Auditor)의 승인을 거쳐야 함
   - 승인 실패 시 Agent C(Refiner)를 통해 수정

---

## 🤖 Available Agents (사용 가능한 에이전트)

| Agent       | Slash Command    | 역할                  | 산출물                               |
| ----------- | ---------------- | --------------------- | ------------------------------------ |
| **Agent A** | `/architect`     | 구조 및 로직 설계     | Unstyled Components, Hooks, Services |
| **Agent B** | `/stylist-agent` | 감성 엔지니어링 & UX  | Styled Components, Animations        |
| **Agent C** | `/refine-code`   | 리팩토링 및 수정 실행 | Refactored Code, Patch Notes         |
| **Agent D** | `/audit`         | 품질 감사 및 검증     | Audit Report, Action Items           |
| **Agent F** | `/librarian`     | 문서 및 스펙 관리     | API_SPEC, DATA_MODEL, Sync Report    |

---

## 📋 Decision Tree (의사결정 트리)

### 1. 새 기능 추가 요청

```
User: "프로젝트 공유 기능 추가해줘"
       ↓
Supervisor 분석:
  - 카테고리: 신규 기능
  - 필요 Agent: F → A → B → D → F
       ↓
Step 0: /librarian 호출 (Pre-Development)
  → API_SPEC.md, DATA_MODEL.md 스펙 정의
  → 프론트-백엔드 계약(Contract) 확정
       ↓
Step 1: /architect 호출
  → 데이터 모델, Hook, Service 작성
  → Unstyled Component 생성
       ↓
Step 2: /stylist-agent 호출
  → Mocha/Cloud Palette 적용
  → Framer Motion 애니메이션 추가
       ↓
Step 3: /audit 호출
  → Phase 1-6 검증
  → ✅ PASS → 완료
  → ❌ FAIL → /refine-code 호출 → 재검증
       ↓
Step 4: /librarian 호출 (Post-Development)
  → 구현된 코드 변경사항을 문서에 반영
  → 문서-코드 일관성 검증
  → Sync Report 생성
```

### 2. 스타일 개선 요청

```
User: "캐릭터 카드 디자인 개선해줘"
       ↓
Supervisor 분석:
  - 카테고리: 스타일링
  - 필요 Agent: B → D
       ↓
Step 1: /stylist-agent 호출
  → Design System 적용
  → Animation 추가
       ↓
Step 2: /audit 호출
  → Vibe Check (Phase 3) 집중 검증
  → ✅ PASS → 완료
```

### 3. 버그 수정 요청

```
User: "에디터에서 타이핑하면 렉 걸려"
       ↓
Supervisor 분석:
  - 카테고리: 성능 이슈
  - 필요 Agent: C → D
       ↓
Step 1: /audit 호출 (진단)
  → Phase 2 Performance Analysis
  → Action Items 생성
       ↓
Step 2: /refine-code 호출
  → Action Items 수정
  → Before/After 성능 비교
       ↓
Step 3: /audit 재검증
  → ✅ PASS → 완료
```

### 4. 코드 품질 검증 요청

```
User: "/check-code 실행해줘"
       ↓
Supervisor 분석:
  - 카테고리: 검증
  - 필요 Agent: D only
       ↓
Step 1: /audit 호출
  → Phase 1-6 전체 검증
  → Audit Report 생성
       ↓
Action Items 있으면:
  → /refine-code 호출
       ↓
재검증 (Loop until PASS)
```

---

## 📝 PRD Creation Workflow (신규 기능 개발 시)

**적용 시점**: 새로운 기능/페이지 추가 요청 시
**목표**: 코드 작성 전 명확한 설계 문서(PRD) 작성 및 검증

### 7-Step Planning Process

#### Step 1: 워크플로우 기반 컨텍스트 확보

**목표**: 관련된 기존 코드/문서 파악

**작업**:

- [ ] 기존 hooks/ 검색 (`grep_search`, `find_by_name`)
  - 유사 기능이 이미 구현되어 있는지 확인
  - 예: "공유 기능" 요청 시 `useSharedProject` 이미 존재 여부
- [ ] 기존 services/ 검색
  - 재사용 가능한 API 함수 확인
- [ ] 관련 타입 정의 확인 (`src/types/`)
  - 확장 가능한 기존 타입 식별
- [ ] 참조 문서 확인
  - `appendix/api-reference.md`: API 엔드포인트
  - `appendix/domain-glossary.md`: 도메인 용어
  - `docs/spec/DATA_MODEL.md`: 데이터 모델

**산출물**: 기존 코드 재사용 계획

---

#### Step 2: 요구사항(Requirements) 상세 정의

**목표**: 사용자 요청을 구체적인 요구사항으로 변환

**작업**:

- [ ] **기능 범위(Scope) 명확화**
  - 예: "프로젝트 공유" → "읽기 전용 링크 생성 + 비밀번호 옵션"
- [ ] **사용자 스토리(User Story) 작성**
  ```
  As a [작가],
  I want to [프로젝트를 URL로 공유],
  So that [다른 사람이 내 작품을 미리보기 할 수 있다].
  ```
- [ ] **Acceptance Criteria (인수 기준)**
  - [ ] 공유 링크 생성 버튼이 프로젝트 설정에 있다
  - [ ] 링크 클릭 시 비밀번호 입력 (설정한 경우)
  - [ ] 읽기 전용으로 문서 열람 가능
  - [ ] 공유 링크 비활성화 가능
- [ ] **제약 사항(Constraints)**
  - 성능: 링크 생성 3초 이내
  - 보안: 비밀번호는 bcrypt 해싱
  - 호환성: 모바일에서도 정상 작동

**산출물**: Requirements Document (Markdown)

---

#### Step 3: UX 설계 및 시나리오

**목표**: 사용자 여정(User Journey) 시각화

**작업**:

- [ ] **User Flow Diagram** (Mermaid)
  ```mermaid
  graph TD
    A[프로젝트 설정] --> B[공유 설정 탭]
    B --> C[공유 링크 생성]
    C --> D{비밀번호 설정?}
    D -->|Yes| E[비밀번호 입력]
    D -->|No| F[링크 복사]
    E --> F
    F --> G[공유 완료 Toast]
  ```
- [ ] **Wireframe** (필요시 `generate_image`)
  - 주요 화면 레이아웃 스케치
- [ ] **인터랙션 시나리오**
  - **시나리오 1**: 설정 없이 즉시 공유
  - **시나리오 2**: 비밀번호 설정 후 공유
  - **시나리오 3**: 공유 링크 비활성화
- [ ] **Error Handling**
  - 링크 생성 실패 시 → Toast 에러 메시지
  - 잘못된 비밀번호 → "비밀번호가 틀렸습니다" 표시

**산출물**: UX Scenario Document + Flow Diagram

---

#### Step 4: 의존성(Dependency) 분석

**목표**: 백엔드, 외부 API, 데이터베이스 의존성 파악

**작업**:

- [ ] **Backend API 요구사항**
  - 필요한 엔드포인트 나열
    ```
    POST /api/projects/:id/share
    GET /api/share/:shareId
    DELETE /api/share/:shareId
    ```
  - Request/Response 형식 정의
- [ ] **Database Schema**
  - 새 테이블: `project_shares` (shareId, projectId, password, expiresAt)
  - 인덱스: `shareId` (unique)
- [ ] **External Dependencies**
  - 외부 라이브러리 필요 여부 (예: bcryptjs)
  - 새 npm 패키지 설치 필요성
- [ ] **Zustand/TanStack Query 의존성**
  - 새 Store 필요? → `useShareStore`
  - 새 Query Hook 필요? → `useSharedProject`

**산출물**: Dependency Matrix (표 형식)

| 의존성 유형 | 항목                         | 상태      | 비고                |
| ----------- | ---------------------------- | --------- | ------------------- |
| Backend API | POST /api/projects/:id/share | ❌ 미구현 | 백엔드 팀 요청 필요 |
| Database    | project_shares 테이블        | ❌ 미구현 | Migration 작성 필요 |
| npm Package | bcryptjs                     | ✅ 설치됨 | -                   |

---

#### Step 5: 데이터 스키마 및 인터페이스 명세

> **🔴 Critical Step**: 코드 작성 전 데이터 구조 논리 검증

**목표**: TypeScript 타입, 함수 시그니처, Store 구조 사전 정의

**작업**:

##### 5.1 TypeScript Interface/Type 정의

```typescript
// src/types/share.ts

export interface ProjectShare {
  id: string;
  projectId: string;
  shareId: string; // URL에 사용될 고유 ID
  hasPassword: boolean; // 비밀번호 설정 여부
  expiresAt: string | null; // 만료 시간 (null = 무제한)
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareRequest {
  password?: string; // 선택적 비밀번호
  expiresInDays?: number; // 만료 일수 (null = 무제한)
}

export interface VerifyShareRequest {
  shareId: string;
  password?: string;
}

export interface SharedProjectData {
  project: Project;
  documents: Document[];
  characters: Character[];
  isReadOnly: true; // 항상 읽기 전용
}
```

##### 5.2 함수 시그니처

**Service Layer**:

```typescript
// src/services/shareService.ts

export const shareService = {
  createShare: (projectId: string, request: CreateShareRequest) =>
    Promise<ProjectShare>,

  getSharedProject: (shareId: string, password?: string) =>
    Promise<SharedProjectData>,

  revokeShare: (shareId: string) => Promise<void>,
};
```

**Custom Hooks**:

```typescript
// src/hooks/useProjectShare.ts

export function useCreateShare(
  projectId: string,
): UseMutationResult<ProjectShare, Error, CreateShareRequest>;

export function useSharedProject(
  shareId: string,
  password?: string,
): UseQueryResult<SharedProjectData, Error>;

export function useRevokeShare(): UseMutationResult<
  void,
  Error,
  string // shareId
>;
```

##### 5.3 Zustand Store 구조 (필요시)

```typescript
// src/stores/useShareStore.ts

interface ShareStore {
  // 현재 입력 중인 비밀번호 (세션 임시 저장)
  tempPassword: string | null;
  setTempPassword: (password: string | null) => void;

  // 공유 링크 목록 (프로젝트별)
  sharesByProject: Record<string, ProjectShare[]>;
  setShares: (projectId: string, shares: ProjectShare[]) => void;
}
```

##### 5.4 논리 검증 체크리스트

- [ ] **타입 일관성**: Request → Service → Hook → Component 타입 호환
- [ ] **Null Safety**: 모든 Optional 필드에 `?` 또는 `| null` 명시
- [ ] **네이밍 컨벤션**: camelCase, 명확한 의미 전달
- [ ] **순환 참조 없음**: Import 순환 구조 검토
- [ ] **API 응답 매칭**: Backend 응답 형식과 Frontend 타입 일치

**산출물**: Type Specification Document (Markdown with TS code blocks)

---

#### Step 6: 구현 계획(Implementation Plan) 수립

**목표**: 파일별 작업 순서 및 난이도 평가

**작업**:

- [ ] **파일 생성/수정 목록**
  ```
  [NEW]    src/types/share.ts
  [NEW]    src/services/shareService.ts
  [NEW]    src/hooks/useProjectShare.ts
  [NEW]    src/components/share/ShareSettingsTab.tsx
  [MODIFY] src/pages/settings/ProjectSettingsPage.tsx (탭 추가)
  [NEW]    src/pages/share/SharedProjectPage.tsx
  ```
- [ ] **작업 순서 (의존성 기반)**
  1. Types 먼저 (`share.ts`)
  2. Service Layer (`shareService.ts`)
  3. Custom Hooks (`useProjectShare.ts`)
  4. Components (Unstyled)
  5. Integration (기존 페이지에 연결)
- [ ] **난이도 및 시간 예상**
  - Types: 쉬움 (5분)
  - Service: 중간 (15분)
  - Hooks: 중간 (20분)
  - Components: 중간 (30분)
  - Integration: 쉬움 (10분)
  - **Total**: ~80분

**산출물**: Implementation Roadmap

---

#### Step 7: 리스크 분석 (Side Effect 예측)

**목표**: 예상되는 부작용 및 엣지 케이스 식별

**작업**:

- [ ] **Breaking Changes**
  - 기존 API 변경? No
  - 기존 타입 수정? No
  - 호환성 문제? No
- [ ] **Performance Impact**
  - 새 쿼리 추가로 초기 로딩 느려짐? → `enabled` 조건으로 방지
  - 대량 공유 링크 생성 시 DB 부하? → 페이지네이션 필요
- [ ] **Security Risks**
  - 비밀번호 평문 전송? → HTTPS 필수
  - 무제한 링크 생성 → Rate Limiting (백엔드)
- [ ] **Edge Cases**
  - 만료된 링크 접근 → "링크가 만료되었습니다" 메시지
  - 잘못된 shareId → 404 페이지
  - 삭제된 프로젝트 → "프로젝트를 찾을 수 없습니다"
- [ ] **Regression Risk**
  - 기존 프로젝트 설정 페이지 깨짐? → Agent D 검증 필수

**산출물**: Risk Matrix + Mitigation Plan

| 리스크               | 확률 | 영향도 | 완화 방안                |
| -------------------- | ---- | ------ | ------------------------ |
| 비밀번호 평문 노출   | 중   | 높음   | HTTPS 강제 + bcrypt 해싱 |
| 링크 무한 생성 (DoS) | 낮음 | 중     | Rate Limiting (백엔드)   |
| 만료 링크 처리 미흡  | 중   | 낮음   | 명확한 에러 메시지       |

---

#### Step 8: 테스트 케이스 작성

**목표**: 기능 검증을 위한 test scenario 사전 정의

**작업**:

- [ ] **Unit Test Cases** (Hook/Service)

  ```typescript
  describe("useCreateShare", () => {
    it("should create share without password", async () => {
      // Given: projectId
      // When: createShare({ expiresInDays: 7 })
      // Then: shareId 생성됨, hasPassword = false
    });

    it("should create share with password", async () => {
      // Given: projectId
      // When: createShare({ password: '1234' })
      // Then: hasPassword = true
    });
  });
  ```

- [ ] **Integration Test Cases** (E2E)
  - **Test 1**: 공유 링크 생성 → 복사 → 새 탭에서 열기 → 프로젝트 보임
  - **Test 2**: 비밀번호 설정 → 잘못된 비밀번호 입력 → 에러 메시지
  - **Test 3**: 공유 링크 비활성화 → 링크 접근 → 404
- [ ] **Accessibility Test**
  - 키보드 네비게이션: 모든 폼 필드 Tab으로 접근 가능
  - 스크린 리더: "공유 링크 생성" 버튼 읽음

**산출물**: Test Specification Document

---

### PRD 최종 산출물 (Implementation Plan Artifact)

위 7단계를 거쳐 생성된 **PRD (Product Requirements Document)**를 `implementation_plan.md`로 작성:

```markdown
# PRD: 프로젝트 공유 기능

## 1. Requirements

- User Story: ...
- Acceptance Criteria: ...

## 2. UX Design

- User Flow: (Mermaid diagram)
- Wireframe: ...

## 3. Dependencies

- Backend API: ...
- Database: ...

## 4. Data Schema & Interfaces

- TypeScript Types: (코드 블록)
- Function Signatures: (코드 블록)
- Zustand Store: (코드 블록)

## 5. Implementation Plan

- File List: ...
- Work Order: ...

## 6. Risk Analysis

- Risk Matrix: (표)

## 7. Test Cases

- Unit Tests: ...
- Integration Tests: ...
```

**✅ PRD 승인 후 → Agent A (Architect) 호출**

---

## 🔄 Standard Workflows (표준 워크플로우)

### Workflow A: Full Feature Implementation (전체 기능 구현)

```
사용자 요청 분석
       ↓
Phase 0: Spec Definition (스펙 정의)
  /librarian
  ✅ Checklist:
    - [ ] API_SPEC.md 업데이트 (엔드포인트, 스키마)
    - [ ] DATA_MODEL.md 업데이트 (타입 정의)
    - [ ] 프론트-백엔드 Contract 확정
       ↓
Phase 1: Architecture (로직 구축)
  /architect
  ✅ Checklist:
    - [ ] Type definitions
    - [ ] Service functions
    - [ ] Custom hooks
    - [ ] Unstyled components
       ↓
Phase 2: Styling (감성 입히기)
  /stylist-agent
  ✅ Checklist:
    - [ ] Mocha/Cloud Palette 적용
    - [ ] Framer Motion 애니메이션
    - [ ] Skeleton UI 추가
       ↓
Phase 3: Quality Audit (품질 검증)
  /audit
  ✅ Checklist:
    - [ ] Phase 1-6 모두 PASS
       ↓
Phase 4: Refinement (수정 및 개선)
  ❌ FAIL인 경우:
  /refine-code
  → Action Items 수정
  → /audit 재검증 (Phase 3 반복)
       ↓
Phase 5: Doc Sync (문서 동기화)
  /librarian
  ✅ Checklist:
    - [ ] 코드 변경사항을 문서에 반영
    - [ ] 문서-코드 일관성 검증
    - [ ] Sync Report 생성
       ↓
✅ FINAL APPROVAL
  → /smart-commit 실행
```

### Workflow B: Style-Only Update (스타일만 개선)

```
사용자 요청 분석
       ↓
Phase 1: Styling
  /stylist-agent
  ✅ Checklist:
    - [ ] 로직 변경 없음 확인
    - [ ] Design System 준수
       ↓
Phase 2: Vibe Check
  /audit --focus=vibe
  → Phase 3 집중 검증
       ↓
✅ APPROVAL or 🔄 /refine-code
```

### Workflow C: Bug Fix (버그 수정)

```
사용자 요청 분석
       ↓
Phase 1: Diagnosis
  /audit
  → Phase 2 (Performance) 집중
  → Action Items 도출
       ↓
Phase 2: Fix
  /refine-code
  → Patch Note 작성
       ↓
Phase 3: Regression Test
  /audit --focus=regression
  → Phase 5 (Integration Testing) 집중
       ↓
✅ APPROVAL
```

---

## 🚦 Request Classification (요청 분류 기준)

### 신규 기능 (New Feature)

**키워드**: "추가해줘", "만들어줘", "구현해줘", "기능", "페이지"
**에이전트**: A → B → D (→ C if needed)
**예시**:

- "AI 분석 페이지 만들어줘"
- "캐릭터 필터링 기능 추가해줘"
- "엑셀 내보내기 구현해줘"

### 스타일 개선 (Style Enhancement)

**키워드**: "디자인", "예쁘게", "색상", "애니메이션", "UI 개선"
**에이전트**: B → D
**예시**:

- "모달 애니메이션 부드럽게 해줘"
- "버튼 색상 Mocha로 바꿔줘"
- "카드 호버 효과 추가해줘"

### 버그/성능 (Bug/Performance)

**키워드**: "느려", "에러", "작동 안 해", "버그", "최적화"
**에이전트**: D (진단) → C (수정) → D (재검증)
**예시**:

- "에디터 타이핑 렉 걸려"
- "관계도 FPS 낮아"
- "복선 사이드바 업데이트 안 돼"

### 품질 검증 (Quality Check)

**키워드**: "/check-code", "/audit", "검증", "리뷰"
**에이전트**: D → C (if fail) → D (재검증)
**예시**:

- "/check-code 실행해줘"
- "코드 품질 검증해줘"
- "배포 전 최종 점검"

---

## 💬 Sample Conversations (대화 예시)

### Example 1: 신규 기능 추가

```
User: "복선 통계 페이지 추가해줘. 프로젝트별로 복선 개수, 회수율 보여주는 대시보드"

Supervisor:
📊 작업 분석:
- 카테고리: 신규 기능
- 복잡도: 중
- 예상 시간: 40분
- 에이전트 순서: A → B → D

🏗️ Phase 1: Architecture (/architect)
[Agent A 작업 중...]
✅ 완료:
- ForeshadowingStats 타입 정의
- foreshadowingService.getStats() API 함수
- useForeshadowingStats 훅
- ForeshadowingStatsPage 컴포넌트 (Unstyled)

🎨 Phase 2: Styling (/stylist-agent)
[Agent B 작업 중...]
✅ 완료:
- Mocha 배경 + Espresso 텍스트
- 통계 카드에 Framer Motion stagger
- Skeleton UI 추가

🛡️ Phase 3: Quality Audit (/audit)
[Agent D 검증 중...]
✅ Phase 1-6 모두 PASS

✅ 작업 완료! /smart-commit 실행할까요?
```

### Example 2: 스타일 개선

```
User: "캐릭터 관계도 노드가 너무 밋밋해. 좀 더 입체감 있게"

Supervisor:
📊 작업 분석:
- 카테고리: 스타일링
- 에이전트: B → D

🎨 Phase 1: Styling (/stylist-agent)
[Agent B 작업 중...]
✅ 완료:
- 노드에 shadow-paper 적용
- Hover 시 scale 1.05 + shadow 강화
- 관계 유형별 gradient border

🛡️ Phase 2: Vibe Check (/audit --focus=vibe)
[Agent D 검증 중...]
✅ Phase 3 (Vibe Check) PASS

✅ 완료!
```

### Example 3: 버그 수정

```
User: "에디터에서 한글 입력 중에 커서가 튀어"

Supervisor:
📊 작업 분석:
- 카테고리: 버그
- 에이전트: D (진단) → C (수정) → D (재검증)

🛡️ Phase 1: Diagnosis (/audit --focus=performance)
[Agent D 분석 중...]
❌ Issue 발견:
- TiptapEditor.tsx:156 - useEffect 의존성 배열 오류
- onUpdate 콜백이 매 타이핑마다 재생성됨

🔧 Phase 2: Fix (/refine-code)
[Agent C 수정 중...]
✅ 수정 완료:
- useRef로 콜백 참조 안정화
- Before: 120ms latency → After: 40ms

🛡️ Phase 3: Regression Test (/audit --focus=regression)
[Agent D 재검증 중...]
✅ 기존 기능 모두 정상 작동

✅ 수정 완료!
```

---

## 🎯 Supervisor Decision Matrix (의사결정 매트릭스)

| 요청 유형        | 에이전트 순서 | 예상 시간 | 우선 검증 Phase                       |
| ---------------- | ------------- | --------- | ------------------------------------- |
| 새 페이지/기능   | A → B → D     | 40-60분   | Phase 1-6 전체                        |
| UI 컴포넌트 추가 | A → B → D     | 20-30분   | Phase 3 (Vibe), Phase 5 (Integration) |
| 스타일만 변경    | B → D         | 10-15분   | Phase 3 (Vibe)                        |
| 성능 최적화      | D → C → D     | 20-40분   | Phase 2 (Performance)                 |
| 버그 수정        | D → C → D     | 15-30분   | Phase 5 (Integration)                 |
| 리팩토링         | D → C → D     | 30-50분   | Phase 1, 4 (Architecture)             |
| 품질 검증만      | D             | 10분      | Phase 1-6 전체                        |

---

## 🚨 Escalation Rules (에스컬레이션 규칙)

다음 상황 발생 시 **사용자에게 질문** 필요:

1. **Ambiguous Request (모호한 요청)**
   - "개선해줘", "더 좋게 만들어줘" → 구체적으로 무엇을?

2. **Conflicting Requirements (상반된 요구사항)**
   - 성능 vs UX trade-off → 어느 쪽 우선?

3. **Architecture Change Needed (아키텍처 변경 필요)**
   - 5개 이상 파일 수정 필요 → 진행할까요?

4. **Breaking Change (호환성 깨짐)**
   - 기존 API 변경 필요 → 사용자 확인 필요

---

## 📊 Quality Gate (품질 관문)

모든 작업은 다음 조건을 만족해야 완료:

### Mandatory Checks (필수 검증)

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 성공
- [ ] Agent D의 Audit Report 승인 (🟢 PASS)

### Optional Checks (선택 검증)

- [ ] `/smart-commit` 실행 (커밋 + PR 업데이트)
- [ ] 성능 Before/After 비교 (필요시)
- [ ] Lighthouse 점수 확인 (UI 변경 시)

---

## 🔗 Related Workflows

- **`/librarian`**: Agent F - 문서 및 스펙 관리
- **`/architect`**: Agent A - 구조 및 로직
- **`/stylist-agent`**: Agent B - 감성 엔지니어링
- **`/refine-code`**: Agent C - 리팩토링 실행
- **`/audit`**: Agent D - 품질 감사
- **`/smart-commit`**: 커밋 및 PR 관리
- **`/check-code`**: 자동 검증 (Type/Lint/Build)

---

## 🎯 Supervisor's Golden Rules

1. **"적재적소에 전문가를 배치하라"**
   - 로직 = Agent A, 스타일 = Agent B, 수정 = Agent C, 검증 = Agent D

2. **"품질 관문은 타협하지 마라"**
   - Agent D가 FAIL을 내면 반드시 수정 후 재검증

3. **"사용자에게 명확한 진행 상황을 보고하라"**
   - 각 Phase별 완료 상태 표시
   - 예상 시간 안내

4. **"중복 작업을 방지하라"**
   - 기존 hooks/services 재사용 가능한지 확인
   - Architect가 이미 만든 것을 Stylist가 다시 만들지 않도록

5. **"최종 책임은 Supervisor가 진다"**
   - 모든 Phase가 완료되어도 사용자 만족도 확인
   - "작동하지만 이상하다"는 피드백에 민감하게 반응

---

**END OF SUPERVISOR PROTOCOL**
