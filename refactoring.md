# 리팩토링 현황 (2024-12-26 업데이트)

> **14,828 라인(TypeScript 97%)**의 견고한 MVP 단계

---

## 1. 최우선 리팩토링 대상: "복잡도 괴물" (Complexity > 30)

### ✅ 완료: `BookReaderModal.tsx` (CC: 34 → <10)

**리팩토링 완료!** 466라인 단일 파일을 8개 파일로 분리:

| 파일                                           | 역할                  | 예상 CC |
| ---------------------------------------------- | --------------------- | ------- |
| `src/components/reader/theme.ts`               | 테마 상수 룩업 테이블 | 0       |
| `src/components/reader/hooks/useBookReader.ts` | 상태 관리 커스텀 훅   | 6-8     |
| `src/components/reader/BookReaderModal.tsx`    | 최상위 Container      | 3-4     |
| `src/components/reader/ReaderHeader.tsx`       | 설정 UI               | 5-6     |
| `src/components/reader/ReaderFooter.tsx`       | 네비게이션 컨트롤     | 3-4     |
| `src/components/reader/ReaderContent.tsx`      | 본문 렌더링           | 6-8     |
| `src/components/reader/TableOfContents.tsx`    | 목차 사이드바         | 3-4     |
| `src/components/reader/index.ts`               | Barrel export         | 0       |

**적용된 패턴:**

- SRP (단일 책임 원칙) - UI 섹션별 컴포넌트 분리
- Custom Hook 패턴 - `useBookReader`로 모든 상태/이펙트 캡슐화
- 테마 룩업 테이블 - 15개 이상의 `theme === 'dark'` 조건 분기 제거

---

### 🚨 남은 대상: `TreeItem.tsx` (CC: 33)

- **진단:** 트리 구조 특성상 재귀 로직과 상태(펼침/접힘, 선택, 드래그 앤 드롭 등) 처리가 뒤엉켜 있음
- **해결 방안:**
  - `useTreeItem` 커스텀 훅으로 로직 추출
  - 뷰(View)는 렌더링만 담당

### 🚨 남은 대상: `EditorPage.tsx` (CC: 31)

- **진단:** 페이지 컴포넌트가 비즈니스 로직(데이터 페칭, 상태 동기화)과 라우팅 로직을 모두 처리
- **해결 방안:**
  - 데이터 페칭 로직을 커스텀 훅으로 분리
  - Container/Presenter 패턴 적용

---

## 2. 성능 킬러: `setState` in `useEffect`

> `/src/components/editor/extensions/CommandList.tsx:56:7`
> `Calling setState synchronously within an effect can trigger cascading renders`

- **상황:** `useEffect` 안에서 `setSelectedIndex(0)` 호출
- **문제:** Cascading Render - 사용자 타이핑마다 불필요한 리렌더링
- **해결:** Derived State 또는 `useRef` 사용

---

## 3. 타입 안정성 붕괴: `any` 남발

> `/src/components/editor/extensions/SlashCommand.tsx`

- **진단:** `SlashCommand` 관련 파일에서 `any` 10회 이상 발견
- **해결:** `interface`/`type` 정의, 제네릭 활용

---

## � 진행 상황

| 항목                     | 상태    | 비고                  |
| ------------------------ | ------- | --------------------- |
| BookReaderModal 리팩토링 | ✅ 완료 | CC: 34 → <10          |
| TreeItem 리팩토링        | ⏳ 대기 | CC: 33                |
| EditorPage 리팩토링      | ⏳ 대기 | CC: 31                |
| CommandList 성능 개선    | ⏳ 대기 | setState in useEffect |
| SlashCommand 타입 정의   | ⏳ 대기 | any 제거              |
