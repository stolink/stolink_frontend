# StoLink 에디터 핵심 기능 명세

> **버전**: 1.0
> **최종 수정**: 2024년 12월
> **참고**: Scrivener 워크플로우 기반, TypeScript + Zustand 최적화

---

## 1. 문서 구조 관리

### 1.1 계층적 바인더

```
Project > Part > Chapter > Scene
```

- 드래그앤드롭 정렬 (dnd-kit)
- 중첩 폴더 생성 가능

### 1.2 뷰 모드

| 모드            | 용도                 |
| --------------- | -------------------- |
| **Editor**      | 개별 씬/챕터 집필    |
| **Scrivenings** | 여러 문서 연속 편집  |
| **Corkboard**   | 인덱스 카드 시각화   |
| **Outline**     | 메타데이터 테이블 뷰 |

---

## 2. 메타데이터 시스템

```typescript
interface SceneMetadata {
  label: string; // POV 캐릭터, 위치 등 (색상 매핑)
  status: "draft" | "revised" | "final";
  keywords: string[]; // 복선, 테마 태그
  synopsis: string; // 카드에 표시될 요약
  notes: string; // 작가 메모
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
}
```

### Label 활용 예시

- POV 캐릭터별 색상 (주인공: 파랑, 히로인: 핑크)
- 타임라인 (과거: 회색, 현재: 흰색, 미래: 노랑)
- 플롯라인 (메인: 빨강, 서브A: 초록)

---

## 3. 캐릭터 & 복선 관리

### 3.1 캐릭터 시스템

```typescript
interface Character {
  id: string;
  name: string;
  aliases: string[];
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  color: string;
  profile: {
    appearance: string;
    personality: string;
    backstory: string;
    goals: string;
    secrets: string;
  };
  imageUrl?: string;
}

interface Relationship {
  from: string; // characterId
  to: string;
  type: string; // 친구, 적, 연인, 스승 등
  description: string;
  isRevealed: boolean; // 독자에게 공개 여부
  revealedIn?: string; // sceneId
}
```

### 3.2 복선 추적 시스템

```typescript
interface Foreshadowing {
  id: string;
  title: string;
  description: string;
  plantedIn: string; // sceneId
  revealedIn?: string; // sceneId
  status: "planted" | "hinted" | "revealed" | "abandoned";
  importance: "major" | "minor";
  relatedCharacters: string[];
  relatedKeywords: string[];
}
```

### 3.3 캐릭터 등장 추적

- 각 씬에 등장 캐릭터 태그
- 캐릭터별 등장 씬 목록 자동 생성
- 등장 빈도 통계

---

## 4. 에디터 기능

### 4.1 분할 화면

- 수직/수평 분할
- 한쪽: 집필 / 한쪽: 캐릭터 시트 or 이전 씬

### 4.2 집중 모드

- UI 최소화, 본문만 표시
- 커스텀 배경색/테마

### 4.3 인라인 기능

- **코멘트**: 특정 텍스트에 메모 연결
- **내부 링크**: `[[캐릭터명]]`, `[[씬 제목]]`
- **하이라이트**: 복선, 중요 설정 강조

---

## 5. 버전 관리

```typescript
interface Snapshot {
  id: string;
  sceneId: string;
  title: string;
  content: string;
  createdAt: Date;
}
```

- 스냅샷 vs 현재 버전 diff 비교

---

## 6. 진행 추적

```typescript
interface ProjectTargets {
  totalWords: number;
  dailyWords: number;
  deadline?: Date;
  writingDays: boolean[]; // [월, 화, 수, 목, 금, 토, 일]
}
```

- 일별/주별 작성량 통계
- 챕터별 분량, 캐릭터별 등장 비율

---

## 7. 상태 관리 구조 (Zustand)

### EditorStore

```typescript
interface EditorStore {
  activeDocumentId: string | null;
  openDocuments: string[];
  splitView: {
    enabled: boolean;
    direction: "horizontal" | "vertical";
    secondaryDocumentId: string | null;
  };
  viewMode: "editor" | "scrivenings" | "corkboard" | "outline";
  selectedDocumentIds: string[];
  sidebarVisible: boolean;
  inspectorVisible: boolean;
  focusMode: boolean;
}
```

### DocumentStore

```typescript
interface DocumentStore {
  documents: Record<string, Document>;
  folders: Record<string, Folder>;
  rootFolderId: string;
}
```

### CharacterStore

```typescript
interface CharacterStore {
  characters: Record<string, Character>;
  relationships: Relationship[];
  getCharacterAppearances: (charId: string) => string[];
  getSceneCharacters: (sceneId: string) => string[];
}
```

### ForeshadowingStore

```typescript
interface ForeshadowingStore {
  items: Record<string, Foreshadowing>;
  getUnresolvedItems: () => Foreshadowing[];
  getItemsByScene: (sceneId: string) => Foreshadowing[];
}
```

---

## 8. 우선순위

| 순위   | 기능                 | 이유             |
| ------ | -------------------- | ---------------- |
| **P0** | 바인더 + 기본 에디터 | 핵심 집필 기능   |
| **P0** | 캐릭터 시트 연동     | 기존 기능과 통합 |
| **P0** | 씬별 캐릭터 태깅     | 관계 추적의 기반 |
| **P1** | 복선 관리 시스템     | 장기 연재 필수   |
| **P1** | 분할 화면            | 생산성 향상      |
| **P1** | Synopsis + Corkboard | 구조 시각화      |
| **P2** | 스냅샷/버전 관리     | 수정 안전망      |
| **P2** | 목표/통계            | 동기 부여        |
| **P3** | Compile/출력         | 출판 단계        |
