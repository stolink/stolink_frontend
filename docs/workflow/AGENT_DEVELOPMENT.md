# Agent Development Workflow

> **목적**: StoLink 프론트엔드 개발을 역할별 에이전트로 분리하여 각 단계에서 최적의 품질을 확보합니다.

**버전**: 1.0
**최종 수정**: 2026년 1월 6일

---

## 개요

복잡한 프론트엔드 기능 개발 시, **한 번에 모든 것을 완벽하게 만들려는 시도**는 오히려 품질 저하를 초래합니다.
대신 **역할을 분리한 에이전트 패턴**을 사용하여 각 단계에서 집중해야 할 목표를 명확히 합니다.

### 4단계 에이전트 워크플로우

```
Agent A: Architect (구조)
        ↓
Agent B: Designer (스타일)
        ↓
Agent C: Optimizer (성능)
        ↓
Agent D: Validator (검증)
```

---

## Agent A: The Architect

> **"뼈대를 세우고 혈관을 연결한다."**

### 역할 정의

가장 기본이 되는 **비즈니스 로직과 상태 관리**를 담당합니다.
UI의 미려함보다 **데이터 흐름의 정확성**에 집중합니다.

### Prime Directive (최우선 지침)

```
"디자인은 무시하고, 기능이 100% 동작하는 '못생긴' 코드를 작성하라."
"상태(State)가 꼬이지 않게 하고, 데이터가 흐르는 파이프라인을 완벽히 구축하라."
```

### 주요 책임

1. **React 컴포넌트 구조 설계**
   - Atomic Pattern 적용 (atoms → molecules → organisms)
   - 컴포넌트 계층 구조 정의
   - Props 인터페이스 설계

2. **상태 관리 구현**
   - Zustand Store 설계 (클라이언트 UI 상태)
   - TanStack Query Hook 작성 (서버 상태)
   - React Hook Form 통합 (폼 상태)

3. **데이터 흐름 구축**
   - API Service Layer 작성 (services/)
   - Custom Hook 작성 (hooks/)
   - queryKey Factory 패턴 적용

4. **아키텍처 규칙 준수**
   - CLAUDE.md의 레이어 분리 원칙
   - 불변성(Immutability) 유지
   - TypeScript Strict Mode 준수

### 허용되는 것 (What You CAN Do)

✅ `<div>`, `<button>` 같은 기본 HTML 태그만 사용
✅ 인라인으로 `className=""`만 추가 (스타일링은 나중에)
✅ `console.log`로 데이터 흐름 디버깅
✅ 더미 데이터(Mock Data)로 먼저 테스트
✅ 못생긴 UI, 어색한 레이아웃 (문제없음)

### 금지되는 것 (What You CANNOT Do)

❌ Tailwind 클래스 추가 (스타일링 금지)
❌ shadcn/ui 컴포넌트 사용 (Agent B의 영역)
❌ 성능 최적화 (useMemo, useCallback 등)
❌ 애니메이션 추가 (framer-motion 등)
❌ 코드 리팩토링 (중복 제거, 추상화 등)

### 산출물 (Deliverables)

- **Unstyled Components**: 기능만 작동하는 컴포넌트
- **Custom Hooks**: `useDocuments`, `useProjectData` 등
- **Service Functions**: `documentService.createDocument()` 등
- **Type Definitions**: 필요한 인터페이스 및 타입

### 체크리스트

```markdown
- [ ] 모든 상태(state)가 올바른 위치에 있는가? (Zustand vs TanStack Query vs Local)
- [ ] API 호출이 정확히 작동하는가? (Success/Error 케이스 모두)
- [ ] Props drilling이 5단계 이상인가? (Context/Zustand 고려)
- [ ] TypeScript 에러가 없는가? (`npm run type-check`)
- [ ] 비즈니스 로직이 컴포넌트 밖으로 분리되었는가? (hooks/)
- [ ] queryKey가 일관되게 구조화되었는가? (Factory 패턴)
- [ ] useEffect 의존성 배열이 정확한가?
```

---

## Agent B: The Designer

> **"뼈대에 살을 붙이고 피부를 입힌다."**

### 역할 정의

Agent A가 만든 **Unstyled Components에 디자인 시스템을 적용**합니다.
로직 변경 없이 **UI/UX만 개선**합니다.

### Prime Directive

```
"로직은 절대 건드리지 말고, 오직 보이는 것만 아름답게 만들어라."
"Warm & Soft 디자인 시스템을 100% 준수하라."
```

### 주요 책임

1. **디자인 시스템 적용**
   - Mocha & Cloud Dancer 컬러 팔레트 사용
   - Typography 규칙 준수 (DM Serif Display, Spectral)
   - shadcn/ui 컴포넌트로 교체

2. **레이아웃 구성**
   - Tailwind CSS 클래스로 스타일링
   - 반응형 디자인 (모바일, 태블릿, 데스크톱)
   - Flexbox/Grid 레이아웃

3. **인터랙션 추가**
   - Hover 효과
   - 기본 CSS Transitions
   - 버튼 상태 (disabled, loading 등)

4. **접근성 (a11y) 기본 준수**
   - semantic HTML 태그 사용
   - aria-label 추가
   - 키보드 네비게이션 지원

### 허용되는 것

✅ Tailwind CSS 클래스 추가/수정
✅ shadcn/ui 컴포넌트로 교체
✅ CSS Transitions (단순한 애니메이션)
✅ 레이아웃 구조 변경 (Flexbox, Grid)
✅ 색상, 폰트, 간격 조정

### 금지되는 것

❌ State 관리 로직 변경
❌ API 호출 추가/수정
❌ 비즈니스 로직 변경
❌ 복잡한 애니메이션 (framer-motion은 Agent C)
❌ 성능 최적화

### 산출물

- **Styled Components**: 디자인 시스템이 적용된 컴포넌트
- **Responsive Layouts**: 모바일/태블릿/데스크톱 대응
- **shadcn/ui Integration**: Button, Dialog, Input 등 교체

### 체크리스트

```markdown
- [ ] 모든 색상이 design-system.md의 팔레트를 사용하는가?
- [ ] 타이포그래피가 규칙을 따르는가? (DM Serif Display, Spectral)
- [ ] shadcn/ui 컴포넌트를 최대한 활용했는가?
- [ ] 인라인 스타일(style 속성)이 없는가?
- [ ] hover/focus 상태가 정의되었는가?
- [ ] 반응형 디자인이 적용되었는가? (sm:/md:/lg:)
- [ ] semantic HTML을 사용했는가? (<button>, <nav>, <article> 등)
- [ ] 로직 변경 없이 스타일만 바뀌었는가? (기능 동작 확인)
```

---

## Agent C: The Optimizer

> **"무거운 짐을 덜어내고 빠르게 달리게 한다."**

### 역할 정의

Agent B가 완성한 **Styled Components에 성능 최적화와 고급 인터랙션**을 추가합니다.
기능과 디자인은 유지하면서 **사용자 경험(UX)을 극대화**합니다.

### Prime Directive

```
"기능을 바꾸지 말고, 더 빠르고 부드럽게 만들어라."
"사용자가 '와, 이거 진짜 프리미엄이다'라고 느끼게 하라."
```

### 주요 책임

1. **성능 최적화**
   - useMemo/useCallback 적용 (필요한 곳만)
   - React.memo로 불필요한 리렌더링 방지
   - 무거운 연산 분리 (Web Worker, Debounce)
   - 이미지 최적화 (lazy loading)

2. **고급 애니메이션**
   - framer-motion으로 페이지 전환
   - Staggered reveals (순차 등장 효과)
   - Scroll-triggered animations
   - Micro-interactions (버튼 피드백 등)

3. **UX 개선**
   - Loading states (Skeleton UI)
   - Error boundaries
   - Optimistic UI updates
   - Toast notifications (성공/실패 피드백)

4. **코드 품질 향상**
   - 중복 로직 제거
   - 추상화 (공통 패턴 추출)
   - 유틸리티 함수 분리
   - 주석 및 문서화

### 허용되는 것

✅ useMemo, useCallback 추가
✅ React.memo 적용
✅ framer-motion 애니메이션
✅ 중복 코드 리팩토링
✅ 성능 측정 및 개선
✅ 코드 분할 (Code Splitting)

### 금지되는 것

❌ 핵심 비즈니스 로직 변경
❌ 디자인 시스템 색상 임의 변경
❌ 과도한 메모이제이션 (모든 곳에 useMemo)
❌ 불필요한 추상화 (YAGNI 위반)

### 산출물

- **Optimized Components**: 성능이 개선된 컴포넌트
- **Animated UI**: framer-motion 적용
- **Refactored Code**: 중복 제거, 추상화 완료
- **Performance Report**: Before/After 성능 비교

### 체크리스트

```markdown
- [ ] 불필요한 리렌더링이 제거되었는가? (React DevTools Profiler)
- [ ] 무거운 연산이 메모이제이션되었는가?
- [ ] 페이지 전환이 부드러운가? (framer-motion)
- [ ] Loading states가 모든 비동기 작업에 추가되었는가?
- [ ] Error boundaries가 적절히 배치되었는가?
- [ ] 중복 코드가 제거되었는가?
- [ ] 코드가 읽기 쉬운가? (주석, 명확한 변수명)
- [ ] FPS가 60fps를 유지하는가? (크롬 Performance 탭)
```

---

## Agent D: The Validator

> **"완벽함을 검증하고 허점을 메운다."**

### 역할 정의

Agent C가 완성한 **최종 코드의 품질을 검증**하고 **배포 전 최종 점검**을 수행합니다.
버그, 타입 에러, 린트 에러, 접근성 문제 등을 **완벽히 제거**합니다.

### Prime Directive

```
"코드가 아니라 품질을 검증하라."
"배포 전 모든 것이 완벽히 작동하는지 3번 확인하라."
```

### 주요 책임

1. **타입 검증**
   - `npm run type-check` 통과
   - any 타입 완전 제거
   - TypeScript Strict Mode 준수

2. **린트 검증**
   - `npm run lint` 통과
   - ESLint 규칙 준수
   - 코드 스타일 일관성

3. **기능 테스트**
   - 모든 사용자 시나리오 테스트
   - Edge cases 확인 (빈 데이터, 에러 상태 등)
   - 크로스 브라우저 테스트 (Chrome, Safari, Firefox)

4. **접근성 (a11y) 검증**
   - 키보드 네비게이션
   - 스크린 리더 호환성
   - WCAG 2.1 AA 준수

5. **성능 검증**
   - Lighthouse 점수 (90+ 목표)
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)

6. **문서화**
   - 코드 주석 추가
   - README 업데이트
   - Troubleshooting 문서 작성

### 체크리스트

```markdown
- [ ] `npm run type-check` 통과?
- [ ] `npm run lint` 통과?
- [ ] `npm run build` 성공?
- [ ] 모든 기능이 예상대로 작동하는가?
- [ ] Edge cases가 처리되었는가? (빈 배열, null, undefined)
- [ ] Error boundaries가 에러를 잡는가?
- [ ] 키보드만으로 모든 기능을 사용할 수 있는가?
- [ ] Lighthouse 점수가 90+ 인가?
- [ ] 크로스 브라우저 테스트 완료?
- [ ] console.log가 제거되었는가?
- [ ] 불필요한 주석이 제거되었는가?
- [ ] /check-code 워크플로우 통과?
```

---

## 워크플로우 적용 예시

### 예시: "프로젝트 목록 페이지" 구현

#### Phase 1: Agent A (Architect)

```tsx
// LibraryPage.tsx (Unstyled, 기능만)
export function LibraryPage() {
  const { data: projects, isLoading } = useProjects();
  const { mutate: createProject } = useCreateProject();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => createProject({ title: "New Project" })}>
        Create
      </button>
      {projects?.map((project) => (
        <div key={project.id}>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}
```

**✅ 체크**: 데이터 흐름 완벽, UI는 못생김

---

#### Phase 2: Agent B (Designer)

```tsx
// LibraryPage.tsx (Styled)
export function LibraryPage() {
  const { data: projects, isLoading } = useProjects();
  const { mutate: createProject } = useCreateProject();

  if (isLoading) return <Skeleton className="h-screen" />;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-serif text-espresso-900">서재</h1>
        <Button onClick={() => createProject({ title: "New Project" })}>
          <Plus className="mr-2" /> 새 작품
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="hover:shadow-paper">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{project.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**✅ 체크**: 디자인 시스템 적용, 로직 변경 없음

---

#### Phase 3: Agent C (Optimizer)

```tsx
// LibraryPage.tsx (Optimized + Animated)
import { motion } from "framer-motion";

export function LibraryPage() {
  const { data: projects, isLoading } = useProjects();
  const { mutate: createProject } = useCreateProject();

  // 메모이제이션 (불필요한 리렌더링 방지)
  const projectCards = useMemo(
    () =>
      projects?.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-paper transition-shadow">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{project.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      )),
    [projects],
  );

  if (isLoading) return <Skeleton className="h-screen" />;

  return (
    <div className="container mx-auto p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between items-center mb-8"
      >
        <h1 className="text-4xl font-serif text-espresso-900">서재</h1>
        <Button onClick={() => createProject({ title: "New Project" })}>
          <Plus className="mr-2" /> 새 작품
        </Button>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projectCards}
      </div>
    </div>
  );
}
```

**✅ 체크**: Staggered animation, 메모이제이션 적용

---

#### Phase 4: Agent D (Validator)

```bash
# 1. 타입 검증
npm run type-check
# ✅ No errors

# 2. 린트 검증
npm run lint
# ✅ No warnings

# 3. 빌드 검증
npm run build
# ✅ Build successful

# 4. 기능 테스트
# - 프로젝트 목록 로딩 ✅
# - 새 작품 생성 ✅
# - 카드 호버 효과 ✅
# - 애니메이션 부드러움 ✅
# - 키보드 네비게이션 ✅

# 5. 성능 검증
# Lighthouse: 95/100 ✅
# FCP: 1.2s ✅
# TTI: 2.1s ✅
```

**✅ 체크**: 모든 검증 통과, 배포 준비 완료

---

## 적용 시점

### 언제 이 워크플로우를 사용하는가?

**✅ 사용 권장**:

- 새로운 페이지/기능 개발 (복잡도 중/상)
- 여러 컴포넌트가 연관된 작업
- 상태 관리가 복잡한 경우
- 디자인과 로직이 모두 중요한 경우

**❌ 사용 불필요**:

- 단순한 버그 수정
- 텍스트/색상 변경
- 린트 에러 수정
- 기존 컴포넌트 미세 조정

### 단계 생략 가능 여부

- **Agent A는 필수** (로직 없이는 시작 불가)
- **Agent B는 선택** (프로토타입은 Unstyled 가능)
- **Agent C는 선택** (성능 이슈 없으면 생략 가능)
- **Agent D는 권장** (배포 전 최소한의 검증 필요)

---

## 핵심 원칙 (Golden Rules)

1. **한 번에 한 역할만 수행한다**
   - Architect 모드일 때는 디자인 생각하지 않기
   - Designer 모드일 때는 로직 건드리지 않기

2. **이전 단계의 산출물을 존중한다**
   - Agent B는 Agent A의 로직을 신뢰하고 유지
   - Agent C는 Agent B의 디자인을 유지하면서 최적화

3. **각 단계의 완성도를 100%로 만든다**
   - "나중에 수정하면 돼"가 아니라 "지금 완벽하게"
   - 다음 단계로 넘어가기 전 체크리스트 확인

4. **문서를 참조한다**
   - Agent A: `CLAUDE.md`, `appendix/tech-stack.md`
   - Agent B: `appendix/design-system.md`
   - Agent C: `docs/critical/performance-optimization-summary.md`
   - Agent D: `docs/critical/TROUBLESHOOTING.md`

---

## 참고 문서

- **핵심 규칙**: [CLAUDE.md](../../CLAUDE.md)
- **기술 스택**: [appendix/tech-stack.md](../../appendix/tech-stack.md)
- **디자인 시스템**: [appendix/design-system.md](../../appendix/design-system.md)
- **API 참조**: [appendix/api-reference.md](../../appendix/api-reference.md)
- **성능 최적화**: [docs/critical/performance-optimization-summary.md](../critical/performance-optimization-summary.md)
