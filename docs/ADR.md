# StoLink 아키텍처 결정 기록 (ADR)

> 프로젝트의 핵심 기술 결정과 그 근거를 기록합니다.
> **최종 수정**: 2025년 12월 29일

---

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [핵심 기술 스택 결정](#핵심-기술-스택-결정)
3. [상태 관리 전략](#상태-관리-전략)
4. [에디터 기술 선택](#에디터-기술-선택)
5. [캐릭터 관계도 시각화](#캐릭터-관계도-시각화)
6. [번들 최적화 전략](#번들-최적화-전략)
7. [폴더 구조 설계](#폴더-구조-설계)
8. [브랜치 전략](#브랜치-전략)

---

## 프로젝트 개요

**StoLink**는 장편 소설 작가를 위한 AI 기반 스토리 관리 플랫폼입니다.

| 항목            | 내용                                                  |
| --------------- | ----------------------------------------------------- |
| **핵심 기능**   | 복선 관리, 캐릭터 관계도, 세계관 설정, AI 일관성 체크 |
| **타겟 사용자** | 장편 소설 작가 (방대한 세계관 관리 필요)              |
| **개발 기간**   | 5주 MVP                                               |
| **코드 규모**   | ~20,000 LOC (React + TypeScript)                      |

---

## 핵심 기술 스택 결정

### 📌 ADR-001: React 19 + TypeScript + Vite 선택

**결정**: React 19.2 + TypeScript 5.9 + Vite 7.2

**고려한 대안**:
| 옵션 | 장점 | 단점 | 결정 이유 |
|------|------|------|-----------|
| **React + Vite** ✅ | 빠른 HMR, 생태계 | - | 팀 경험, 생태계 |
| Next.js | SSR, 파일 라우팅 | 복잡성, 오버헤드 | SPA로 충분, SSR 불필요 |
| Vue/Nuxt | 간결한 문법 | 생태계 작음 | Tiptap React 통합 우선 |
| Svelte | 번들 작음 | 생태계 미성숙 | 에디터 라이브러리 부족 |

**근거**:

1. **SPA로 충분** - 작가 도구는 SEO 불필요, 클라이언트 중심 인터랙션
2. **Vite HMR** - CRA 대비 10배 빠른 개발 서버 시작
3. **TypeScript** - 20,000줄 규모에서 타입 안정성 필수
4. **트레이드오프**: SSR 없음 → 초기 로드 약간 느림 (번들 최적화로 보완)

---

### 📌 ADR-002: Tailwind CSS + shadcn/ui 선택

**결정**: Tailwind CSS 3.4 + shadcn/ui

**고려한 대안**:
| 옵션 | 장점 | 단점 | 결정 이유 |
|------|------|------|-----------|
| **Tailwind + shadcn** ✅ | 빠른 개발, 커스터마이징 | 클래스 verbose | 일관된 디자인 시스템 |
| styled-components | CSS-in-JS, 동적 스타일 | 런타임 오버헤드 | 빌드 타임 선호 |
| MUI | 풍부한 컴포넌트 | 무거움, 커스터마이징 어려움 | Paper/Ink 디자인에 부적합 |
| Chakra UI | 접근성 좋음 | 무거움 | 번들 크기 우려 |

**근거**:

1. **shadcn/ui = 복사-붙여넣기 방식** - node_modules 의존성 아님, 완전한 커스터마이징
2. **Radix UI 기반** - 접근성(a11y) 내장
3. **Paper/Ink 디자인 시스템** - 작가 도구에 맞는 따뜻한 색감 구현 용이
4. **트레이드오프**: 유틸리티 클래스 학습 곡선 존재

---

## 상태 관리 전략

### 📌 ADR-003: 하이브리드 상태 관리 (Zustand + TanStack Query)

**결정**: 상태 유형별 도구 분리

```
서버 상태 (API 데이터)     →  TanStack Query 5.90
전역 UI 상태 (사이드바 등)  →  Zustand 5.0
폼 상태 (입력값, 검증)     →  React Hook Form + Zod
로컬 컴포넌트 상태         →  useState
에디터 상태 (문서 내용)    →  Tiptap 내장 상태
```

**고려한 대안**:
| 옵션 | 장점 | 단점 | 결정 이유 |
|------|------|------|-----------|
| **Zustand + TanStack Query** ✅ | 관심사 분리, 경량 | 두 도구 학습 | 서버/클라이언트 상태 명확 분리 |
| Redux Toolkit + RTK Query | 일관된 패턴 | 보일러플레이트 80% 증가 | 과도한 복잡성 |
| Zustand만 | 단순 | 캐싱 직접 구현 필요 | 서버 상태 관리 비효율 |
| Jotai/Recoil | 원자적 상태 | TanStack Query와 중복 | 서버 상태에 부적합 |

**근거**:

1. **서버 상태 ≠ 클라이언트 상태** - 캐싱, staleTime, 자동 리패칭은 TanStack Query가 최적
2. **Zustand 보일러플레이트 최소** - Redux 대비 80% 코드 감소
3. **Optimistic Update 패턴** - TanStack Query의 onMutate/onError로 UX 개선

**Zustand 스토어 (8개)**:
| 스토어 | 역할 | 미들웨어 |
|--------|------|----------|
| `useAuthStore` | 인증 상태, 토큰 | `persist` |
| `useEditorStore` | 프로젝트/챕터, 줌 | - |
| `useUIStore` | 사이드바, 모달 | - |
| `useSceneStore` | Scene CRUD | `immer` |

**TanStack Query 훅 (12개)**:

```typescript
// Query Key 팩토리 패턴
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};
```

**트레이드오프**: 두 도구 학습 필요 → 그러나 각 도구가 각자의 역할에 최적화되어 장기적 유지보수 용이

---

## 에디터 기술 선택

### 📌 ADR-004: Tiptap 에디터 선택

**결정**: Tiptap 3.14 (ProseMirror 기반)

**고려한 대안**:
| 옵션 | 장점 | 단점 | 결정 이유 |
|------|------|------|-----------|
| **Tiptap** ✅ | 확장성, React 통합 | 학습 곡선 | 커스텀 노드 필수 |
| Slate.js | 유연함 | 불안정, 문서 부족 | 프로덕션 리스크 |
| Draft.js | Facebook 지원 | 유지보수 중단 | 미래 불확실 |
| Quill | 간단 | 커스터마이징 제한 | `#복선:태그` 구현 불가 |
| CodeMirror | 코드 에디터 최적화 | 문서 편집 부적합 | 용도 불일치 |

**근거**:

1. **커스텀 노드 필수** - `#복선:태그명`, `@캐릭터명` 같은 커스텀 문법 구현
2. **헤드리스 아키텍처** - UI 완전 커스터마이징, shadcn/ui와 통합
3. **Y.js 통합 가능** - 향후 실시간 협업 확장 용이
4. **마크다운 양방향 변환** - 마크다운 저장, 렌더링 시 리치 텍스트

**커스텀 익스텐션**:
| 익스텐션 | 역할 |
|----------|------|
| `CharacterMention` | @캐릭터 멘션 자동완성 |
| `CharacterNodeView` | 캐릭터 노드 렌더링 |
| `CharacterHoverCard` | 호버 시 캐릭터 정보 |
| `CommandList` | / 명령어 팔레트 |

---

## 캐릭터 관계도 시각화

### 📌 ADR-005: React Flow → D3.js Force Simulation 전환

**결정**: D3.js 7.x Force Simulation (React Flow에서 전환)

**전환 이유**:
| 측면 | React Flow | D3.js Force | 결정 |
|------|------------|-------------|------|
| **레이아웃** | 수동 배치 | 물리 기반 자동 배치 | ✅ D3 |
| **번들 크기** | ~150KB | ~62KB | ✅ D3 (-59%) |
| **커스터마이징** | 제한적 | 완전한 제어 | ✅ D3 |
| **학습 곡선** | 낮음 | 높음 | ⚠️ React Flow |

**근거**:

1. **Obsidian 스타일 목표** - Force-Directed 레이아웃이 관계도에 자연스러움
2. **번들 크기 -59%** - 62.59 KB (gzip 21.50 KB)
3. **완전한 시각화 제어** - 노드 크기, 간선 스타일, 애니메이션

**훅 아키텍처**:

```typescript
useCharacterGraphSimulation; // Force 시뮬레이션 코어
useCharacterGraphDrag; // 노드 드래그 인터랙션
useCharacterGraphZoom; // SVG 줌/팬 제어
useCharacterGraphResize; // 컨테이너 리사이즈 감지
useRelationshipLinks; // 관계→링크 데이터 변환
```

**트레이드오프**: D3.js 학습 곡선 높음 → 그러나 5개 훅으로 관심사 분리하여 복잡도 관리

---

## 번들 최적화 전략

### 📌 ADR-006: 세분화된 Vendor 청크 분할

**결정**: 6개 → 13개 vendor 청크로 분할

**문제**:

- 초기 번들에 Export 라이브러리 1.25MB 포함
- 90% 사용자는 Export 기능 미사용
- Fast 3G에서 3.5초 로딩

**해결책**:

```javascript
// 개선 후 vendor 청크 (13개)
vendor-react      //  50.73 KB - 항상 로드
vendor-ui         // 111.66 KB - 항상 로드
vendor-editor     // 407.91 KB - 에디터 진입 시
vendor-export     // 730.66 KB - Export 시에만 ⭐⭐⭐
vendor-graph      //  62.59 KB - 관계도 진입 시
vendor-motion     // 118.93 KB - 애니메이션 필요 시
// ...
```

**결과**:
| 지표 | 개선 전 | 개선 후 | 개선율 |
|------|---------|---------|--------|
| 초기 로드 (gzip) | 450 KB | 187 KB | **-58%** |
| Fast 3G 로딩 | 3.5s | 2.0s | **-43%** |
| Export 미사용 시 대역폭 | +1.25 MB | 0 | **-100%** |

**트레이드오프**: 빌드 시간 11s → 12s (+9%) → 허용 범위

---

## 폴더 구조 설계

### 📌 ADR-007: Feature-Slice + Layer 혼합 구조

**결정**: 기능별 분리 + 레이어 구분

```
src/
├── api/           # API 클라이언트 (1개)
├── components/    # 컴포넌트 (60개)
│   ├── common/    # 공통 (Footer, Modal)
│   ├── editor/    # 에디터 전용 (27개)
│   ├── ui/        # shadcn/ui (23개)
│   └── ...
├── hooks/         # 커스텀 훅 (25개) ⭐
├── services/      # API 서비스 레이어 (16개) ⭐
├── stores/        # Zustand 스토어 (8개)
├── types/         # TypeScript 타입 (12개)
└── pages/         # 페이지 컴포넌트 (9개)
```

**원칙**:

1. **단방향 의존성**: pages → components → hooks → services → api
2. **관심사 분리**: UI / 비즈니스 로직 / 데이터 계층
3. **코로케이션**: 관련 파일은 가까이 (editor/extensions/, editor/sidebar/)

---

## 브랜치 전략

### 📌 ADR-008: 3-Layer 브랜치 전략

**결정**: main / dev / feature 3단계

```
main ─────── 프로덕션 (직접 push 금지)
dev ──────── 개발 통합, 스테이징 (직접 push 금지)
feature/* ── 기능 개발 → dev PR
fix/* ────── 버그 수정 → dev PR
hotfix/* ─── 긴급 수정 → main PR (자동 backport to dev)
```

**CI/CD 파이프라인**:
| 워크플로우 | 트리거 | 동작 |
|------------|--------|------|
| `ai-review.yml` | PR 생성/업데이트 | Claude API로 코드 리뷰 |
| `deploy.yml` | main push | S3 + CloudFront 배포 |
| `deploy_dev.yml` | dev push | 개발 환경 배포 |
| `hotfix-backport.yml` | hotfix→main 머지 | develop에 자동 체리픽 |

---

## 결정 요약

| ADR | 결정                     | 핵심 근거                        |
| --- | ------------------------ | -------------------------------- |
| 001 | React + Vite             | SPA 충분, 빠른 HMR               |
| 002 | Tailwind + shadcn        | 커스터마이징 용이, 복사-붙여넣기 |
| 003 | Zustand + TanStack Query | 서버/클라이언트 상태 분리        |
| 004 | Tiptap                   | 커스텀 노드 필수, 확장성         |
| 005 | D3.js Force              | 물리 기반 레이아웃, 번들 -59%    |
| 006 | 13개 청크 분할           | 초기 로드 -58%                   |
| 007 | Feature-Slice 구조       | 관심사 분리, 단방향 의존         |
| 008 | 3-Layer 브랜치           | 안전한 배포, 자동 backport       |
| 009 | 스플릿 뷰 아키텍처       | 인지 부하 감소, 하이브리드 형태  |
| 010 | 자연어→DB 파이프라인     | 핵심 차별화, AI 자동 추출        |

---

## 📌 ADR-009: 스플릿 뷰 / 인스펙터 아키텍처

**결정**: 하이브리드 형태 (인스펙터 + 멀티 페인)

**고려한 대안**:
| 옵션 | 장점 | 단점 | 결정 이유 |
|------|------|------|-----------|
| **하이브리드** ✅ | 문맥 감응 + 자유도 | 복잡도 증가 | 두 장점 결합 |
| 인스펙터만 | 공간 효율 | 자유도 부족 | 고정 정보만 표시 |
| 멀티 페인만 | 자유도 높음 | 자동화 없음 | 매번 수동 설정 |

**근거**:

1. **인지 부하 감소** - 문맥 전환 없이 참조 정보 확인 (23분 재진입 비용 제거)
2. **인스펙터**: 현재 씬의 캐릭터, 복선, 설정 **자동** 표시
3. **멀티 페인**: 사용자가 원하는 문서 **고정** 참조

**컴포넌트 구조 (향후)**:

```
EditorPage
├── LeftSidebar (ChapterTree)
├── EditorPane
│   ├── TiptapEditor (Primary)
│   └── TiptapEditor (Secondary) ← 멀티 페인
└── RightSidebar
    ├── InspectorPanel ← 인스펙터 (문맥 감응)
    └── TabPanels (복선, AI, 체크)
```

---

## 📌 ADR-010: 자연어 → 데이터베이스 변환 파이프라인 ⭐

**결정**: AI 기반 자동 추출 (LangGraph + LLM)

> **[핵심 기능]** StoLink의 차별화 요소

**고려한 대안**:
| 옵션 | 장점 | 단점 | 결정 이유 |
|------|------|------|-----------|
| **AI 자동 추출** ✅ | 작가 부담 제로 | 정확도 문제 | 검증 UI로 보완 |
| 수동 입력 | 정확 | 작가 부담 | 기존 도구와 동일 |
| 하이브리드 | 균형 | 복잡 | AI 우선, 수동 보조 |

**근거**:

1. **핵심 차별화** - "글쓰기만 하면 설정이 자동으로 정리됨"
2. **작가 워크플로우 단순화** - 데이터 관리를 의식하지 않음
3. **검증 UI** - AI 추출 결과를 작가가 확인/수정

**파이프라인**:

```
본문 텍스트 → LangGraph → LLM (GPT/Claude)
                    ↓
              구조화 데이터
                    ↓
         PostgreSQL + Neo4j
                    ↓
         관계도 / 설정집 UI
```

**추출 대상**:
| 엔티티 | 저장 위치 | UI 연동 |
|--------|----------|---------|
| 캐릭터 | PostgreSQL + Neo4j | 관계도 노드 |
| 관계 | Neo4j | 관계도 엣지 |
| 장소/아이템 | PostgreSQL | 세계관 탭 |
| 복선 | PostgreSQL | 복선 패널 |

---

## 관련 문서

| 문서                                              | 내용                                 |
| ------------------------------------------------- | ------------------------------------ |
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 디렉토리 구조, 라우팅, 상태관리 상세 |
| [TECHSTACK.md](./architecture/TECHSTACK.md)       | 기술 스택 버전, 라이브러리 목록      |
| [SPEC.md](./spec/SPEC.md)                         | 페이지별 기능 명세                   |
| [DATA_MODEL.md](./spec/DATA_MODEL.md)             | 엔티티, DTO, 타입 정의               |
| [API_SPEC.md](./spec/API_SPEC.md)                 | API 엔드포인트 명세                  |
| [CLAUDE.md](../CLAUDE.md)                         | AI 인스트럭션, 코딩 컨벤션           |

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                            |
| ---- | ---------- | ---------------------------------------------------- |
| 1.0  | 2025.12.29 | 최초 작성 - 8개 ADR 통합                             |
| 1.1  | 2025.12.29 | ADR-009 스플릿 뷰, ADR-010 자연어→DB 파이프라인 추가 |
