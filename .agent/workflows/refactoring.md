---
description: StoLink 리팩토링 및 코드 개선 가이드 (React 19, Vibe Coding, Phasing)
---

# REFACTORING_REQUEST.md

> **문서 목적:** StoLink 프로젝트의 코드베이스를 유지보수 가능하고, 성능이 최적화된 상태로 개선하기 위한 AI 에이전트용 리팩토링 지침서입니다.
> **적용 범위:** 모든 `.tsx`, `.ts` 파일 (React 19, Vite 7 환경)
> **참조 문서:** `CLAUDE.md` (Project Constitution), `FRONTEND_INTEGRATION_GUIDE.md`

---

## 1. 리팩토링 철학 (Refactoring Philosophy)

우리는 켄트 벡의 **"동작하는 코드를 만든 후, 더 낫게 만들라(Make it work, make it right, make it fast)"** 원칙을 따릅니다. 리팩토링은 기능의 변경 없이 내부 구조를 개선하여 소프트웨어의 엔트로피 증가를 막는 엔지니어링 행위입니다.

### 핵심 목표

1. **가독성(Readability):** 코드는 기계가 실행하기 위해 존재하지만, 사람이 읽기 위해 작성된다. 의도가 명확하지 않은 코드는 기술 부채다.
2. **단순성(Simplicity):** 불필요한 복잡성을 제거한다. 오컴의 면도날을 적용하여 가장 단순한 해결책을 선택한다.
3. **감성적 일관성(Aesthetic Consistency):** StoLink의 **"Warm & Soft"** 디자인 철학을 코드 수준에서도 유지한다. (Mocha/Cloud 톤앤매너 및 부드러운 인터랙션 보존)
4. **안전성(Safety):** 타입 시스템(TypeScript Strict Mode)과 불변성을 통해 런타임 오류를 원천 차단한다.

---

## 2. 품질 관리 임계값 (Quality Gates)

리팩토링 결과물은 반드시 아래의 정량적 지표를 준수해야 합니다. 이를 초과할 경우 "리팩토링 실패"로 간주합니다.

### 2.1 복잡도 제한 (Complexity Limits)

- **순환 복잡도 (Cyclomatic Complexity): 10 이하**
- 함수 당 분기문(`if`, `for`, `while`, `case`)의 합이 10을 넘지 않아야 합니다.
- _해결책:_ 비즈니스 로직을 서브 루틴으로 분리하거나, 전략 패턴(Strategy Pattern)을 사용하여 `switch/case`를 제거하십시오.

- **인지 복잡도 (Cognitive Complexity): 15 이하 (SonarQube 기준)**
- 중첩 구조(Nesting)에 가중치를 둡니다. (`if` 중첩, `for` 중첩 등)
- **도구 사용:** 환경이 허용하는 경우 `npx eslint-plugin-sonarjs` 등을 활용하여 측정하거나, 상기 기준에 따라 수동으로 평가하십시오.
- _해결책:_ 깊은 중첩(`if` 안에 `for` 안에 `if`)을 조기 반환(Early Return) 패턴으로 평탄화(Flattening)하십시오.

### 2.2 물리적 제한

- **함수 길이:** 30라인 권장, 최대 50라인 (단일 책임 원칙 준수)
- **파일 길이:** 300라인 권장, 최대 500라인 (초과 시 모듈 분리 필수)
- **매개변수:** 최대 3개 (초과 시 객체 구조 분해 할당 사용)

### 2.3 성능 및 품질 지표 (Lighthouse/Performance)

- **Interaction to Next Paint (INP):** 에디터 타이핑 중 200ms 이하 유지.
- **FPS:** 캐릭터 관계도 및 에디터 스크롤 중 60 FPS 지향 (최저 45 FPS 방어).

---

## 3. 리팩토링 상세 가이드라인 (Execution Guidelines)

### 3.1 아키텍처 및 상태 관리 (Architecture Alignment)

`CLAUDE.md`의 `<coding_rules>`에 의거하여 다음과 같이 코드를 재배치하십시오.

1. **UI와 로직의 분리 (Separation of Concerns):**

- 컴포넌트(`src/components`)는 오직 렌더링에만 집중해야 합니다.
- 데이터 페칭, 상태 조작, 이벤트 핸들링 로직은 반드시 **Custom Hook**(`src/hooks`)으로 추출하십시오.
- _Anti-Pattern:_ `useEffect` 내부에서 복잡한 데이터를 가공하는 로직.

2. **Server vs Client State 분리 (Zustand 5 & TanStack Query 5):**

- **Server State:** API 데이터는 `TanStack Query`가 관리합니다. `useQuery`의 `queryKey`를 계층별로 구조화하십시오.
- **Client State:** UI 상태(모달, 사이드바 등)만 `Zustand`를 사용하십시오.
- **Serializability:** `Zustand` 스토어에 `Set`, `Map` 등 직렬화 불가능한 타입을 저장하지 마십시오.

3. **Tiptap 3.x 에디터 로직:**

- 에디터 관련 복잡한 로직은 컴포넌트 내부가 아닌 `Extension` 또는 `Command`로 분리하십시오.
- 커스텀 노드뷰는 `ReactNodeViewRenderer`를 사용하여 React 컴포넌트로 관리하십시오.

### 3.2 코드 품질 및 디자인 패턴 (Code Quality)

1. **"Warm & Soft" 스타일 준수:**

- 스타일링 시 `tailwind.config.js`에 정의된 `mocha`, `cloud`, `sage` 팔레트를 우선 사용하십시오.
- 동적인 애니메이션은 `framer-motion`을 사용하여 StoLink만의 부드러운 감성을 유지하십시오.

2. **DRY (Don't Repeat Yourself):**

- 3번 이상 반복되는 로직은 공통 유틸리티(`src/lib`) 또는 훅으로 추상화하십시오.
- 단, **우발적 중복(Accidental Duplication)**과 **필수적 중복**을 구분하십시오.

3. **조건문 단순화 (Simplifying Conditional Logic):**

- **Guard Clauses:** 중첩된 `if/else` 블록 대신 조기 반환(`return`)을 사용하여 들여쓰기 깊이를 줄이십시오.
- **Decompose Conditional:** 복잡한 조건식은 의미를 가진 변수나 함수(`isValidUser`, `shouldShowModal`)로 추출하십시오.

4. **함수형 프로그래밍 원칙 적용:**

- React 19 컴파일러 호환성을 위해 **불변성(Immutability)**을 엄격히 준수하십시오.
- `let` 대신 `const`를 사용하십시오.
- 데이터 변형 시 `mutation`을 피하고 `map`, `filter`, `reduce` 또는 `immer`를 활용하십시오.

5. **디자인 패턴 적용 (Contextual Application):**

- **Compound Component:** `shadcn/ui` 스타일의 컴포넌트 조합이 필요한 경우 적용 (예: `Dialog`, `DialogTrigger`, `DialogContent`).
- **Facade Pattern:** 복잡한 API 호출과 UI 상태를 래핑하는 상위 Hook을 구축하십시오.

### 3.3 성능 최적화 (Performance Optimization)

1. **렌더링 제어:**

- 객체나 배열 리터럴을 `props`로 직접 전달하여 불필요한 리렌더링을 유발하지 마십시오. (React 19 컴파일러 도입 전까지 `useMemo` 활용)
- Context API 사용 시 상태 변경 빈도가 높다면 `Zustand`로 마이그레이션하여 선택적 렌더링(Selector)을 유도하십시오.

2. **비동기 최적화:**

- `TanStack Query`의 `staleTime`, `gcTime`을 명시적으로 설정하여 불필요한 네트워크 요청을 방지하십시오.
- Waterfall 방식의 요청을 `Promise.all` 또는 `useSuspenseQueries`로 병렬화하십시오.

---

## 4. 리팩토링 워크플로우 (Step-by-Step Protocol)

에이전트는 다음 절차에 따라 리팩토링을 수행해야 합니다.

1. **Analyze (분석):**

- 대상 코드의 현재 순환 복잡도와 인지 복잡도를 계산합니다. (SonarQube 기준 참고)
- `CLAUDE.md` 위반 사항(Anti-Patterns)을 식별합니다.

2. **Plan (설계):**

- **Implementation Plan 수립:** 대규모 리팩토링 시 반드시 단계를 나눕니다. (Phase 1, 2...)
- 추출할 Hook, 분리할 컴포넌트, 제거할 중복 로직을 정의합니다.
- 타입 안정성을 보장하기 위한 Interface/Type 설계를 선행합니다.

3. **Execute & Verify Loop (단계별 수행 및 검증):**

- **Phase 단위 수행:** 수립된 계획의 Phase 1부터 순차적으로 실행합니다.
- **Build Verification (필수):** 각 Phase 완료 시 반드시 `npm run build`를 실행하여 안정성을 검증합니다.
- **Smart Commit (필수):** 빌드 성공 시 `@[/smart-commit]` 워크플로우를 실행하여 진행 상황을 저장하고 PR을 업데이트합니다.
- **Zero-Error Policy:** 린트 및 빌드 에러가 남아있는 상태에서 다음 Phase로 넘어가지 마십시오.

4. **Final Verify (최종 검증):**

- 모든 Phase 완료 후 복잡도 지표를 재계산하여 목표 달성 여부를 확인합니다.
- `npm run type-check` 및 `npm run lint` 통과 여부를 재확인합니다.

---

## 5. 출력 형식 (Output Format)

리팩토링 결과는 다음 마크다운 형식을 엄수하여 제출하십시오.

`````markdown
# 🛠️ Refactoring Report

## 1. Summary

- **Target File**: `src/.../Filename.tsx`
- **Total Phases**: 3 (Current Completed: Phase 3)
- **Changes**: (요약: 예 - 비즈니스 로직 useHook 분리, 조건문 간소화)

## 2. Complexity Metrics

| Metric                    | Before | After | Status  |
| :------------------------ | :----: | :---: | :-----: |
| **Cyclomatic Complexity** |   12   |   4   | ✅ Pass |
| **Cognitive Complexity**  |   18   |   6   | ✅ Pass |

## 3. Applied Improvements

- [x] **DRY**: `fetchData` 로직을 `useDocuments` 훅으로 통합
- [x] **Phasing**: Phase 1~3 완료 및 빌드 검증 성공
- [x] **Smart Commit**: 각 단계별 커밋 완료
- [x] **Type Safety**: `any` 타입 제거 및 Zod 스키마 적용

## 4. Refactored Code

### `src/hooks/useNewHook.ts` (New)

```typescript
// ...코드 내용...
```

\````

### `src/components/OriginalComponent.tsx` (Modified)

```tsx
// ...코드 내용...
```

---

## 6. 금지 사항 (Restrictions)

다음의 행위는 엄격히 금지되며 리팩토링 실패로 간주합니다.

- `any` 또는 `as` 타입 단언을 사용하여 타입 에러를 회피하는 행위.
- 주석으로 로직을 설명하려 하는 행위 (코드가 자체적으로 설명되어야 함, JSDoc 제외).
- 기존 기능(Business Logic)의 동작 방식을 변경하는 행위 (리팩토링은 동작 보존이 전제됨).
- **빌드 실패 상태에서 코드를 푸시하거나 작업을 종료하는 행위.**
- `CLAUDE.md`의 스타일 가이드(Tailwind, shadcn/ui)를 위반하는 인라인 스타일 적용.
`````
