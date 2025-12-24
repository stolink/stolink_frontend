# StoLink 에디터 핵심 기능 명세

> **버전**: 1.1
> **최종 수정**: 2024년 12월 24일
> **참고**: Scrivener 워크플로우 기반, TypeScript + Zustand 최적화

---

## 구현 현황 요약

| 기능                            | 상태      | 파일/위치                                |
| ------------------------------- | --------- | ---------------------------------------- |
| 통합 Document 모델              | ✅ 완료   | `src/types/document.ts`                  |
| Repository 패턴                 | ✅ 완료   | `src/repositories/`                      |
| Section Strip (하단 네비게이션) | ✅ 완료   | `src/components/editor/SectionStrip.tsx` |
| 분할 화면                       | ✅ 완료   | `useEditorStore`, `EditorPage.tsx`       |
| 집중 모드                       | ✅ 완료   | `useEditorStore`                         |
| 복선 관리                       | ✅ 완료   | `useForeshadowingStore`                  |
| Corkboard 뷰                    | ✅ 완료   | `CorkboardView.tsx`                      |
| 씬 인스펙터                     | ✅ 완료   | `SceneInspector.tsx`                     |
| Scrivenings 뷰                  | ❌ 미구현 | -                                        |
| Outline 뷰                      | ❌ 미구현 | -                                        |
| 버전/스냅샷 관리                | ❌ 미구현 | -                                        |
| 인라인 링크/코멘트              | ❌ 미구현 | -                                        |
| Compile/출력                    | ❌ 미구현 | -                                        |

---

## 1. 문서 구조 관리

### 1.1 계층적 바인더 ✅

```
Project > Part > Chapter > Section (text)
```

**구현 완료:**

- `Document` 통합 타입 (`type: 'folder' | 'text'`)
- `LocalDocumentRepository` (Zustand + localStorage)
- `useDocumentTree` 훅으로 트리 데이터 제공
- 좌측 사이드바 `ChapterTree` 컴포넌트

**파일:**

- `src/types/document.ts`
- `src/repositories/LocalDocumentRepository.ts`
- `src/hooks/useDocuments.ts`

### 1.2 뷰 모드

| 모드              | 상태      | 설명                                  |
| ----------------- | --------- | ------------------------------------- |
| **Editor**        | ✅ 완료   | TiptapEditor 기반 WYSIWYG             |
| **Section Strip** | ✅ 완료   | 하단 카드 네비게이션 (Corkboard 대체) |
| **Scrivenings**   | ❌ 미구현 | 여러 문서 연속 편집                   |
| **Outline**       | ❌ 미구현 | 메타데이터 테이블 뷰                  |

---

## 2. 메타데이터 시스템 ✅

```typescript
interface DocumentMetadata {
  status: "draft" | "revised" | "final";
  keywords: string[];
  notes: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  label?: string; // POV, 타임라인 등
}
```

**구현 위치:** `src/types/document.ts`

### Label 컬러 매핑

```typescript
// CorkboardView.tsx
const LABEL_COLORS = {
  "POV: 주인공": "bg-blue-500",
  "POV: 히로인": "bg-pink-500",
  과거: "bg-gray-400",
  현재: "bg-green-500",
  미래: "bg-amber-500",
};
```

---

## 3. 캐릭터 & 복선 관리

### 3.1 캐릭터 시스템 ⚠️ 부분 구현

**구현 완료:**

- 기본 Character 타입 (`src/types/index.ts`)
- Scene-Character 연결 (`characterIds` 필드)

**미구현:**

- 상세 프로필 (appearance, personality, backstory)
- 관계(Relationship) 시스템
- 캐릭터 등장 통계

### 3.2 복선 추적 시스템 ✅

```typescript
// src/stores/useForeshadowingStore.ts
interface Foreshadowing {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "pending" | "hinted" | "recovered" | "abandoned";
  importance: "major" | "minor";
  appearances: ForeshadowingAppearance[]; // 등장 씬 목록
  relatedCharacterIds: string[];
}
```

**구현 완료:**

- CRUD 작업
- 상태별 필터링 (`getByStatus`)
- 씬별 복선 조회 (`getByScene`)
- 캐릭터 연결

---

## 4. 에디터 기능

### 4.1 분할 화면 ✅

```typescript
// useEditorStore
splitView: {
  enabled: boolean;
  direction: "horizontal" | "vertical";
}
```

**구현:** `react-resizable-panels` 사용

### 4.2 집중 모드 ✅

- `isFocusMode` 상태
- UI 최소화 (사이드바, 툴바 숨김)
- ESC 키 또는 버튼으로 종료

### 4.3 인라인 기능 ❌ 미구현

- 코멘트 시스템
- 내부 링크 (`[[캐릭터명]]`)
- 하이라이트

---

## 5. 버전 관리 ❌ 미구현

스냅샷/버전 비교 기능 미구현

---

## 6. 진행 추적 ⚠️ 부분 구현

**구현 완료:**

- 문서별 글자 수 카운트 (`metadata.wordCount`)
- StatusBar에 현재 글자 수 표시

**미구현:**

- 일별/주별 작성량 통계
- 목표 설정 및 진행률
- 마감일 관리

---

## 7. 상태 관리 구조 (Zustand)

### EditorStore ✅

```typescript
// src/stores/useEditorStore.ts
interface EditorStore {
  splitView: { enabled: boolean; direction: "horizontal" | "vertical" };
  isFocusMode: boolean;
  // actions
  toggleSplitView: () => void;
  toggleFocusMode: () => void;
}
```

### DocumentStore ✅

```typescript
// src/repositories/LocalDocumentRepository.ts
interface DocumentStore {
  documents: Record<string, Document>;
  // actions (repository pattern)
}
```

### ForeshadowingStore ✅

```typescript
// src/stores/useForeshadowingStore.ts
- foreshadowings: Record<string, Foreshadowing>
- getByProject, getByScene, getByStatus
- add, update, delete, addAppearance, markAsRecovered
```

---

## 8. 우선순위 및 다음 단계

### ✅ 완료된 P0/P1

- [x] 바인더 + 기본 에디터
- [x] 씬별 캐릭터 태깅
- [x] 복선 관리 시스템
- [x] 분할 화면
- [x] Synopsis + Section Strip

### 🚧 다음 구현 대상

| 순위   | 기능             | 예상 작업                           |
| ------ | ---------------- | ----------------------------------- |
| **P1** | 캐릭터 시트 연동 | CharacterStore 확장, 상세 프로필 UI |
| **P1** | Scrivenings 뷰   | 선택된 여러 문서 연속 표시          |
| **P2** | Outline 뷰       | 메타데이터 테이블 + 드래그 정렬     |
| **P2** | 스냅샷/버전 관리 | SnapshotStore, diff 비교 UI         |
| **P2** | 목표/통계        | 일별 작성량, 진행률 차트            |
| **P3** | 인라인 링크      | TipTap extension                    |
| **P3** | Compile/출력     | 마크다운/HTML/PDF 내보내기          |
