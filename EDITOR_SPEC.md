# StoLink 에디터 핵심 기능 명세

> **버전**: 1.2
> **최종 수정**: 2024년 12월 24일
> **검증**: 코드베이스 대조 완료

---

## 구현 현황 요약

| 기능               | 상태      | 검증 결과                                  |
| ------------------ | --------- | ------------------------------------------ |
| 통합 Document 모델 | ✅ 완료   | `src/types/document.ts` - folder/text 타입 |
| Repository 패턴    | ✅ 완료   | `src/repositories/` - 2개 파일             |
| Section Strip      | ✅ 완료   | `SectionStrip.tsx` - EditorPage에서 사용   |
| 분할 화면          | ✅ 완료   | `useEditorStore.ts` - splitView            |
| 집중 모드          | ✅ 완료   | `useEditorStore.ts` - isFocusMode          |
| 복선 관리          | ✅ 완료   | `useForeshadowingStore.ts` - appearances   |
| 씬 인스펙터        | ✅ 완료   | `SceneInspector.tsx`                       |
| Character 타입     | ✅ 완료   | `character.ts` - Role, Relationship        |
| Place/Item 타입    | ✅ 완료   | `character.ts` - 세계관 요소               |
| ~~Corkboard 뷰~~   | ⚠️ 대체됨 | Section Strip으로 대체 (파일은 존재)       |
| Scrivenings 뷰     | ✅ 완료   | `ScriveningsEditor.tsx` - 통합 편집 모드   |
| Outline 뷰         | ✅ 완료   | `OutlineView.tsx` - 테이블 기반 아웃라인   |
| 버전/스냅샷        | ❌ 미구현 | grep 검색 결과 없음                        |
| 인라인 링크        | ❌ 미구현 | `[[...]]` 패턴 없음                        |

> **Note:** CorkboardView.tsx 파일은 존재하나 EditorPage에서 import하지 않음

---

## 1. 문서 구조 관리

### 1.1 계층적 바인더 ✅ 검증됨

**타입 정의** (`src/types/document.ts`):

```typescript
export type DocumentType = "folder" | "text";

export interface Document {
  id: string;
  projectId: string;
  parentId?: string;
  type: DocumentType;
  title: string;
  order: number;
  content: string;
  synopsis: string;
  characterIds: string[];
  // ...
}
```

**Repository 구현** (`src/repositories/`):

- `DocumentRepository.ts` - 인터페이스 + buildDocumentTree()
- `LocalDocumentRepository.ts` - Zustand 기반 구현

**Hooks** (`src/hooks/useDocuments.ts`):

- `useDocumentTree(projectId)` - 트리 구조 반환
- `useDocumentContent(id)` - 콘텐츠 읽기/저장
- `useChildDocuments(parentId, projectId)` - 자식 문서

### 1.2 뷰 모드 ⚠️ 부분 구현

| 모드          | 상태      | 위치                                |
| ------------- | --------- | ----------------------------------- |
| Editor        | ✅ 완료   | `TiptapEditor.tsx`                  |
| Section Strip | ✅ 완료   | `SectionStrip.tsx` (하단 카드 네비) |
| ~~Corkboard~~ | ⚠️ 대체됨 | EditorPage에서 제거됨               |
| Scrivenings   | ✅ 완료   | `ScriveningsEditor.tsx`             |
| Outline       | ✅ 완료   | `OutlineView.tsx`                   |

---

## 2. 메타데이터 시스템 ✅ 검증됨

**Document Metadata** (`src/types/document.ts`):

```typescript
export interface DocumentMetadata {
  status: "draft" | "revised" | "final";
  keywords: string[];
  notes: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  label?: string;
}
```

**Scene Metadata** (`src/types/scene.ts`):

```typescript
synopsis: string;  // ✅ 존재
wordCount: number; // ✅ 존재
targetWordCount?: number; // ✅ 존재
```

---

## 3. 캐릭터 & 복선 관리

### 3.1 캐릭터 시스템 ✅ 검증됨

**타입** (`src/types/character.ts`):

```typescript
export interface Character {
  id: string;
  projectId: string;
  name: string;
  role?: CharacterRole;  // protagonist | antagonist | supporting | mentor | sidekick
  imageUrl?: string;
  extras?: Record<string, ...>;
}

export interface CharacterRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;  // friendly | hostile | neutral
  strength: number;  // 1-10
}
```

**추가 세계관 타입**:

- `Place` - 장소 (region, building, special)
- `Item` - 아이템 (weapon, accessory, document)

### 3.2 복선 추적 시스템 ✅ 검증됨

**Store** (`src/stores/useForeshadowingStore.ts`):

```typescript
interface Foreshadowing {
  status: "pending" | "hinted" | "recovered" | "abandoned";
  appearances: ForeshadowingAppearance[]; // 등장 씬 목록
  // ...
}

// 주요 함수
getByScene(sceneId);
getByStatus(projectId, status);
getUnresolved(projectId);
addAppearance(id, sceneId, description);
markAsRecovered(id, sceneId);
```

### 3.3 캐릭터-씬 연결 ✅ 검증됨

```typescript
// document.ts & scene.ts
characterIds: string[];  // ✅ 양쪽에 존재
```

---

## 4. 에디터 기능

### 4.1 분할 화면 ✅ 검증됨

**Store** (`src/stores/useEditorStore.ts`):

```typescript
splitView: {
  enabled: boolean;
  direction: "horizontal" | "vertical";
}
toggleSplitView();
```

**구현**: `react-resizable-panels` 사용

### 4.2 집중 모드 ✅ 검증됨

```typescript
isFocusMode: boolean;
toggleFocusMode();
```

### 4.3 인라인 기능 ❌ 미구현

- 코멘트 시스템 - 없음
- 내부 링크 `[[캐릭터명]]` - 없음
- 하이라이트 - 없음

---

## 5. 버전 관리 ❌ 미구현

스냅샷/버전 시스템 코드 없음

---

## 6. 에디터 컴포넌트 목록 (14개)

```
src/components/editor/
├── AIAssistantPanel.tsx
├── ChapterTree.tsx
├── ConsistencyPanel.tsx
├── CorkboardView.tsx     ⚠️ EditorPage에서 미사용
├── DemoHeader.tsx
├── EditorLeftSidebar.tsx
├── EditorRightSidebar.tsx
├── EditorToolbar.tsx
├── ForeshadowingPanel.tsx
├── SceneInspector.tsx
├── SectionGridView.tsx
├── SectionStrip.tsx      ✅ EditorPage에서 사용
├── StatusBar.tsx
└── TiptapEditor.tsx
```

---

## 7. 다음 구현 대상

| 우선순위 | 기능                    | 상태 |
| -------- | ----------------------- | ---- |
| P1       | Scrivenings 뷰          | ✅   |
| P1       | Outline 뷰              | ✅   |
| P2       | 스냅샷/버전 관리        | ❌   |
| P3       | 인라인 링크 (`[[...]]`) | ❌   |
| P3       | Compile/출력            | ✅   |
