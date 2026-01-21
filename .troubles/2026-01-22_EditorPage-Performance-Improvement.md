# EditorPage 성능 개선 완료 보고서

> **작업일**: 2026-01-22
> **범위**: EditorPage 웹 접근성(KWCAG 2.2) + Lighthouse 성능 개선

---

## 📊 성능 벤치마크

### 배포 버전 기준선 (개선 전)

| 지표        | 값        | 상태                 |
| ----------- | --------- | -------------------- |
| FCP         | 1.0초     | 🟢 Good              |
| LCP         | 3.8초     | 🟡 Needs Improvement |
| TBT         | 0ms       | 🟢 Good              |
| **CLS**     | **0.429** | 🔴 Poor              |
| Speed Index | 1.6초     | 🟢 Good              |

### 근본 원인 분석

```
CLS 0.429 원인 (Lighthouse "Layout shift culprits"):
├── div#root: 0.424 (99%) → 웹 폰트 로딩 (Pretendard, Google Fonts)
├── <div class="flex items-center gap-3">: 0.003
└── 기타 미미한 요소들
```

---

## ✅ 구현된 변경 사항

### 1. 웹 접근성 (KWCAG 2.2)

| 파일                                                                                      | 변경 내용                               |
| ----------------------------------------------------------------------------------------- | --------------------------------------- |
| [SkipLink.tsx](file:///Users/dongha/jungle/sto-link/src/components/common/SkipLink.tsx)   | **[NEW]** 스킵 링크 컴포넌트            |
| [useDocumentTitle.ts](file:///Users/dongha/jungle/sto-link/src/hooks/useDocumentTitle.ts) | **[NEW]** SPA 페이지 제목 관리 훅       |
| [App.tsx](file:///Users/dongha/jungle/sto-link/src/App.tsx)                               | SkipLink 추가, `main#main-content` 래퍼 |
| [LandingPage.tsx](file:///Users/dongha/jungle/sto-link/src/pages/landing/LandingPage.tsx) | `useDocumentTitle` 호출                 |
| [LibraryPage.tsx](file:///Users/dongha/jungle/sto-link/src/pages/library/LibraryPage.tsx) | `useDocumentTitle`, sr-only h1          |
| [WorldPage.tsx](file:///Users/dongha/jungle/sto-link/src/pages/world/WorldPage.tsx)       | `useDocumentTitle`, sr-only h1          |
| [EditorPage.tsx](file:///Users/dongha/jungle/sto-link/src/pages/editor/EditorPage.tsx)    | `useDocumentTitle` 호출                 |

---

### 2. CLS 개선

#### 2.1 EditorLeftSidebar 단일 DOM 구조

```tsx
// BEFORE: 조건부로 다른 컴포넌트 반환 → CLS 발생
if (!isOpen) return <CollapsedBar />;
return <FullSidebar />;

// AFTER: 단일 구조 + width transition
<aside style={{ width: isOpen ? width : 40 }}>
  {isOpen ? <FullContent /> : <CollapsedButton />}
</aside>;
```

- **파일**: [EditorLeftSidebar.tsx](file:///Users/dongha/jungle/sto-link/src/components/editor/EditorLeftSidebar.tsx)

#### 2.2 EditorRightSidebar width:0 전환

```tsx
// BEFORE
if (!isOpen) return null;

// AFTER
style={{ width: isOpen ? width : 0 }}
className="transition-[width,opacity] duration-300"
```

- **파일**: [EditorRightSidebar.tsx](file:///Users/dongha/jungle/sto-link/src/components/editor/EditorRightSidebar.tsx)

#### 2.3 AnimatePresence 제거

- EditorPage에서 EditorLeftSidebar 래핑하던 AnimatePresence 제거
- **파일**: [EditorPage.tsx](file:///Users/dongha/jungle/sto-link/src/pages/editor/EditorPage.tsx)

#### 2.4 Skeleton/Content 높이 일치

```tsx
// EditorSkeleton: h-full flex flex-col 적용
<div className="h-full flex flex-col animate-pulse p-6">

// EditorPage: Suspense 래퍼에 flex-1 min-h-0 적용
<div className="flex-1 min-h-0 overflow-hidden">
  <Suspense fallback={<EditorLoadingSkeleton />}>
```

- **파일**: [EditorSkeleton.tsx](file:///Users/dongha/jungle/sto-link/src/components/editor/EditorSkeleton.tsx)

#### 2.5 폰트 font-size-adjust

- **파일**: [index.html](file:///Users/dongha/jungle/sto-link/index.html)
- **목적**: 시스템 폰트 → 웹 폰트 전환 시 텍스트 크기 일관성 유지

#### 2.6 index.html 로더 및 sr-only 선언

- **로더**: `body` 스타일 직접 수정 대신 `fixed` 오버레이(`loader-wrapper`) 사용 → React 앱 로드 시 body 레이아웃 점프 방지
- **sr-only**: `index.html` head에 기본 `sr-only` CSS 클래스 선언 → Tailwind 로드 전 `SkipLink` 노출로 인한 레이아웃 시프트 차단
- **파일**: [index.html](file:///Users/dongha/jungle/sto-link/index.html)

---

### 3. LCP 개선

#### 3.1 모달 및 무거운 컴포넌트 Lazy Import

- **EditorPage**: `EditorContent`를 `lazy`로 전환하여 초기 번들 로드 가속화
- **EditorContent**: `TiptapEditor`, `ScriveningsEditor`, `OutlineView`를 내부적으로 `lazy` 전환 → 에디터 초기화 지연 감소
- **기존 모달**: `ReaderModal`, `ExportGatewayModal` lazy 적용 유지

#### 3.2 의미 있는 LCP 후보 노출

- `EditorToolbar`는 동기적으로 로드되도록 유지하여 문서 제목(`TitleBreadcrumb`)이 `EditorContent` 로딩 중에도 즉시 렌더링되도록 함 (LCP 인식 개선)

---

### 4. 반응형 개선

#### 툴바 버튼 반응형

```tsx
// 작은 화면에서 텍스트 숨김, 아이콘만 표시
<span className="hidden sm:inline">분석</span>
<span className="hidden sm:inline">미리보기</span>
```

- **파일**: [EditorToolbar.tsx](file:///Users/dongha/jungle/sto-link/src/pages/editor/components/EditorToolbar.tsx)
- **목적**: 사이드바 확장 시 레이아웃 깨짐 방지

---

## 📦 번들 사이즈 변화

| 청크       | Before | After  | 변화       |
| ---------- | ------ | ------ | ---------- |
| EditorPage | 392 KB | 362 KB | **-30 KB** |
| index      | 272 KB | 272 KB | -          |

---

## ⚠️ 추가 권장 사항

### 배포 후 확인 필요

1. **Lighthouse 재측정**: CLS 개선 확인 (목표: < 0.1) 및 LCP 개선 확인
2. **font-size-adjust 브라우저 호환성**: Safari에서 제한적 지원

### 향후 개선 가능 사항

| 항목                            | 예상 효과             |
| ------------------------------- | --------------------- |
| 커스텀 extension 별도 청크 분리 | 초기 번들 감소        |
| 폰트 로컬 호스팅                | 네트워크 의존성 감소  |
| WorldPage 코드 스플릿 (1.2MB)   | 다른 페이지 성능 개선 |

---

## 검증 결과

| 검증 항목            | 결과                            |
| -------------------- | ------------------------------- |
| `npm run type-check` | ✅ 통과                         |
| `npm run build`      | ✅ 통과                         |
| **CLS 개선 확인**    | **Loader & SkipLink 고정 완료** |
| **LCP 개선 확인**    | **Editor Lazy-loading 완료**    |
