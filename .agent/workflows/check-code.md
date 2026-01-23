---
description: 코드 무결성, UX 감성, 성능 검증 및 Smart-Commit 연동 프로토콜
---

# CHECK_CODE.md (Verification Protocol)

> **문서 목적:** 대규모 리팩토링 및 기능 개발 이후, 시스템의 무결성(Integrity)과 사용자 경험(UX)의 감성적 품질(Vibe)을 최종 검증하기 위한 프로토콜입니다.
> **적용 시점:** 주요 기능 구현 완료 후, PR 생성 직전
> **참조 문서:** `CLAUDE.md`, `REFACTORING_REQUEST.md`

---

## 1. 검증 철학 (Verification Philosophy)

**"작동한다고 끝난 것이 아니다. 연결되지 않은 기능은 없는 것과 같으며, 불편한 UI는 버그보다 치명적이다."**

우리는 '바이브 코딩(Vibe Coding)'의 결과물이 가질 수 있는 전형적인 함정—기계적인 코드 나열, 영혼 없는 디자인, 논리적 단절—을 사전에 차단하기 위해 **엄격한 5단계 검증 프로세스**를 수행합니다.

---

## 2. 검증 프로세스 (The 5-Step Protocol)

에이전트는 아래 순서대로 검증을 수행하고, 발견된 결함은 즉시 수정해야 합니다.

### Phase 1. 정적 무결성 및 구조 검증 (Static Integrity)

**목표:** StoLink 아키텍처 규칙 준수 및 좀비 코드 제거

<check_list>

1. **상태 관리 무결성 (State Management Hygiene)**
   - **Zustand 5.x:** 스토어(`src/stores/`) 내부 상태에 `Set`, `Map`, `Class` 인스턴스 등 직렬화 불가능한 객체가 저장되지 않았는지 확인.
   - **TanStack Query 5.x:** `useQuery`의 키가 `['documents', projectId]`와 같이 배열 구조를 갖추고 있는지 확인.

2. **좀비 컴포넌트 색출 (Dead Code Elimination)**
   - **프로젝트 전체 검색:** 참조 횟수가 0인 컴포넌트/Hook 식별.
   - _Note:_ `export`는 되어있지만 내부에서만 쓰이는 유틸리티 함수도 정리 대상.

3. **라이브러리 사용 규칙 (Library Constraints)**
   - **Tiptap:** 중복된 Extension 등록 여부 확인 (예: `StarterKit`과 개별 `Bold` extension 동시 사용 금지).
   - **Imports:** `file://` 경로 또는 상위 디렉토리 무한 참조(`../../../../`) 대신 `src/` 절대 경로(Alias) 사용.

</check_list>

### Phase 2. 기능 연결성 검증 (Connectivity Verification)

**목표:** 사용자가 기능에 접근 가능한지 물리적 경로 확인

<check_list>

1. **진입점(Entry Point) 검사**
   - 새로 만든 기능으로 이동하는 버튼이 GNB 또는 사이드바에 존재하는가?
   - _Critical:_ URL 입력 없이는 접근 불가능한 기능은 "미구현"으로 간주.

2. **데이터 흐름(Data Flow) 루프 확인**
   - `UI Action` → `API Call` → `State Update` → `UI Feedback`
   - 특히 `useProjectSSE`와 같은 실시간 업데이트가 UI에 즉각 반영되는지 확인.

</check_list>

### Phase 3. UX/UI 감성 품질 검증 (Vibe & Quality Check)

**목표:** "AI Slop" 제거 및 StoLink만의 "Warm & Soft" 아이덴티티 주입

<anti_pattern_detection>
**다음 징후 발견 시 리팩토링 필수:**

1. **Generic Color Palette Usage:**
   - 단순 `bg-blue-500`, `text-gray-500` 사용 금지.
   - _Correction:_ `bg-mocha-500`, `text-espresso-900`, `bg-cloud-50` 등 `tailwind.config.js`의 지정 팔레트 적용.

2. **Hard Transition:**
   - 모달이나 사이드바가 '퍽' 하고 뜨는 현상.
   - _Correction:_ `framer-motion`의 `AnimatePresence`와 spring animation 적용.

3. **Accessibility (A11y):**
   - `Dialog`나 `Dropdown`이 키보드 탭(Tab)으로 접근 가능한가?
   - 색상 대비가 WCAG 기준(12:1 이상 권장)을 만족하는가?

</anti_pattern_detection>

### Phase 4. 성능 극한 검증 (Performance & Edge Cases)

**목표:** 대규모 데이터와 불안정한 환경 방어

<check_list>

1. **Interaction Latency:**
   - 에디터 타이핑 시 입력 지연이 200ms 미만인가? (느릴 경우 `Debounce` 로직 점검)

2. **Graph Rendering Checks:**
   - 캐릭터 관계도 노드가 50개 이상일 때도 45 FPS 이상 유지하는가?
   - _Action:_ 렌더링 저하 시 `React.memo` 또는 `useMemo` 적용 여부 확인.

3. **Empty/Loading States:**
   - 데이터 로딩 중 `Skeleton` UI가 표시되는가? (Layout Shift 방지)
   - 데이터가 없을 때 친절한 안내 문구("캐릭터를 추가해보세요!")가 있는가?

</check_list>

### Phase 5. 워크플로우 통합 (Workflow Integration)

**목표:** 검증된 코드의 안전한 저장

<check_list>

1. **검증 완료 후:** 모든 체크리스트 통과 시 `@[/smart-commit]` 워크플로우를 호출하여 커밋 및 PR 업데이트 수행.

</check_list>

---

## 3. 검증 보고서 포맷 (Report Format)

검증 완료 후 다음 형식으로 보고서를 작성해야 합니다.

```markdown
# 🛡️ Verification & Polish Report

## 1. Integrity check

- [ ] **Architecture**: Zustand/Query Rules Pass
- [ ] **Dead Code**: (삭제된 파일 수)
- [ ] **Imports**: (정리된 Import 수)

## 2. Vibe Check (Warm & Soft)

- [ ] **Colors**: Mocha/Cloud Palette applied? (Yes/No)
- [ ] **Motion**: Framer Motion applied? (Yes/No)
- [ ] **A11y**: Keyboard Navigation checked? (Yes/No)

## 3. Performance

- [ ] **Editor Check**: Typing Latency OK
- [ ] **Graph Check**: FPS OK

## 4. Action Items

- (수정이 필요한 사항 목록)
```

---

## 4. 실행 가이드 (Execution Commands)

에이전트는 이 문서를 바탕으로 다음 명령을 수행할 수 있습니다.

- **`verify:integrity`**: 1단계(구조) 검사 수행
- **`verify:vibe`**: 3단계(디자인/감성) 검사 수행
- **`verify:perf`**: 4단계(성능) 검사 수행
- **`verify:all`**: 전체 프로세스 수행 -> 보고서 작성 -> `smart-commit` 호출

---

## 5. 핵심 원칙 (Golden Rules)

1. **No "Later"**: "나중에 연결해야지"는 없다. 지금 연결하지 않을 거면 코드를 지워라.
2. **StoLink Identity**: 모든 UI는 `Warm & Soft` 해야 한다. 차가운 기본 스타일은 버그다.
3. **Performance First**: 예쁘지만 느린 UI는 가치가 없다.
