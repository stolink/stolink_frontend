# Domain Glossary

> **AI 참조용**: StoLink 도메인 용어 및 핵심 Entity 이해가 필요할 때 참조하세요.

## 핵심 도메인 용어

| 한글       | 영문            | 설명                                                               | 관련 타입/경로                              |
| ---------- | --------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| 복선       | Foreshadowing   | 나중에 회수될 스토리 요소. 에디터에서 `#복선:태그명` 문법으로 작성 | `Foreshadowing`, `useForeshadowing`         |
| 회수       | Recovery        | 복선이 해결/사용되는 시점. `isRecovery: true`로 표시               | `ForeshadowingAppearance`                   |
| 문서       | Document        | 폴더(folder) 또는 텍스트(text). Scrivener 스타일 재귀 구조 ⭐      | `Document`, `DocumentTreeNode`              |
| 서재       | Library         | 사용자의 모든 작품을 관리하는 메인 페이지                          | `/library`, `LibraryPage`                   |
| 설정집     | World           | 캐릭터, 장소, 아이템 등 세계관 요소 관리 페이지                    | `/projects/:id/world`                       |
| 관계도     | Character Graph | React Flow 기반 캐릭터 관계 시각화                                 | `CharacterRelationship`, `useRelationships` |
| 스크리브닝 | Scrivenings     | 여러 문서를 하나로 통합하여 편집하는 모드                          | EditorPage 뷰 모드                          |

---

## 핵심 Entity (Core Entities)

### Document (문서)

**가장 중요한 데이터 구조** - Scrivener 스타일 재귀 구조

```typescript
interface Document {
  id: string;
  projectId: string;
  title: string;
  type: "folder" | "text"; // 폴더 또는 텍스트
  content?: string; // HTML (text 타입만)
  parentId: string | null; // 재귀 구조
  order: number; // 정렬 순서
  metadata?: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
}

interface DocumentMetadata {
  wordCount?: number; // 백엔드에서 계산
  characterCount?: number;
  synopsis?: string; // 시놉시스
  status?: "draft" | "review" | "final";
  tags?: string[];
  color?: string; // 라벨 색상
}
```

**특징**:

- 폴더(folder)는 children을 가질 수 있음
- 텍스트(text)는 content(HTML)를 가짐
- parentId로 계층 구조 구성 (챕터 → 장면)
- wordCount는 **백엔드에서만 계산**, 프론트에서 직접 업데이트 금지

---

### Project (프로젝트/작품)

```typescript
interface Project {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  status: "active" | "completed" | "archived";
  stats?: ProjectStats;
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStats {
  totalWords: number;
  totalCharacters: number;
  totalDocuments: number;
  lastEditedAt: string;
}
```

**관련 훅**: `useProjects`, `useProjectStats`

---

### Character (캐릭터)

```typescript
interface Character {
  id: string;
  projectId: string;
  name: string;
  role?: string; // 주인공, 조연, 악역 등
  description?: string;
  avatarUrl?: string;
  extras: Record<string, any>; // 동적 속성 (나이, 성격 등)
  createdAt: string;
  updatedAt: string;
}
```

**특징**:

- `extras`로 동적 속성 저장 (유연한 데이터 구조)
- Neo4j 그래프 DB와 연동

---

### CharacterRelationship (캐릭터 관계)

```typescript
interface CharacterRelationship {
  id: string;
  projectId: string;
  sourceId: string; // 관계 시작 캐릭터 ID
  targetId: string; // 관계 대상 캐릭터 ID
  type: "friendly" | "hostile" | "romantic" | "family" | "neutral";
  strength?: number; // 관계 강도 (1-10)
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

**주의**:

- `sourceId`, `targetId`는 Character의 `id`
- `type`은 내부 속성 (Neo4j relationship type과 별개)
- 관계 색상은 `appendix/design-system.md` 참조

---

### Foreshadowing (복선)

```typescript
interface Foreshadowing {
  id: string;
  projectId: string;
  tag: string; // 복선 태그 (예: "비밀금고")
  description?: string;
  status: "pending" | "recovered" | "abandoned";
  appearances: ForeshadowingAppearance[];
  createdAt: string;
  updatedAt: string;
}

interface ForeshadowingAppearance {
  documentId: string;
  position: number; // 문서 내 위치
  isRecovery: boolean; // 회수 지점 여부
  context?: string; // 전후 문맥
}
```

**에디터 사용법**:

- `#복선:비밀금고` 형태로 작성
- 에디터에서 세이지(Sage) 톤으로 하이라이트
- 자동으로 appearances 배열에 추가

---

## 데이터 흐름 패턴

### 서버 상태 (TanStack Query)

- **Document**: `useDocuments`, `documentService`
- **Project**: `useProjects`, `projectService`
- **Character**: `useCharacters`, `characterService`
- **Foreshadowing**: `useForeshadowing`, `foreshadowingService`

### 클라이언트 상태 (Zustand)

- **에디터 UI**: `useEditorStore` (커서 위치, 선택 영역 등)
- **사이드바**: `useUIStore` (열림/닫힘 상태)
- **인증**: `useAuthStore` (사용자 정보, 토큰)

---

## 참고 문서

**상세 데이터 모델**: [docs/spec/DATA_MODEL.md](../docs/spec/DATA_MODEL.md)
**API 명세**: [docs/spec/API_SPEC.md](../docs/spec/API_SPEC.md)
