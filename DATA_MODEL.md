# StoLink 데이터 모델 명세

> **버전**: 1.3
> **최종 수정**: 2024년 12월 26일
> **상태**: 현재 구현 기준

---

## 개요

이 문서는 StoLink 프로젝트에서 사용되는 모든 **엔티티(Entity)**와 **DTO(Data Transfer Object)**를 정의합니다.

> 📡 API 명세 → [API_SPEC.md](./API_SPEC.md)
> 📋 기능 명세 → [SPEC.md](./SPEC.md)

---

## 데이터 저장소 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                        데이터 저장소 분리                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────┐   ┌─────────────────────────────┐ │
│   │      PostgreSQL (RDS)       │   │        Neo4j                │ │
│   │      정형 데이터 저장        │   │   그래프/관계 데이터 저장     │ │
│   ├─────────────────────────────┤   ├─────────────────────────────┤ │
│   │  • User                     │   │  • Character (노드)         │ │
│   │  • Project                  │   │  • Relationship (엣지)      │ │
│   │  • Document                 │   │  • Place (노드)             │ │
│   │  • Foreshadowing            │   │  • Item (노드)              │ │
│   │  • ForeshadowingAppearance  │   │  • 자연어 파싱 결과          │ │
│   │  • Export/Share 기록        │   │  • AI 분석 결과             │ │
│   └─────────────────────────────┘   └─────────────────────────────┘ │
│                                                                     │
│   ┌─────────────────────────────┐                                   │
│   │          AWS S3             │                                   │
│   │    대용량 파일 저장          │                                   │
│   ├─────────────────────────────┤                                   │
│   │  • 문서 스냅샷 (10분 주기)   │                                   │
│   │  • 표지 이미지               │                                   │
│   │  • 캐릭터 이미지             │                                   │
│   │  • 내보내기 파일             │                                   │
│   └─────────────────────────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# Part 1: 프론트엔드 TypeScript 타입

> `src/types/` 디렉토리 기준

---

## 1. 인증 (Auth)

> 파일: `src/types/auth.ts`

```typescript
interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  nickname: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

---

## 2. 프로젝트 (Project)

> 파일: `src/types/project.ts`

```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  genre: Genre;
  description?: string;
  coverImage?: string;
  status: ProjectStatus;
  author?: string;
  extras?: Record<string, string | number | boolean | string[]>;
  stats: ProjectStats;
  createdAt: string;
  updatedAt: string;
}

type Genre = "fantasy" | "romance" | "sf" | "mystery" | "other";
type ProjectStatus = "writing" | "completed";

interface ProjectStats {
  totalCharacters: number;
  totalWords: number;
  chapterCount: number;
  characterCount: number;
  foreshadowingRecoveryRate: number;
  consistencyScore: number;
}

interface CreateProjectInput {
  title: string;
  genre: Genre;
  description?: string;
  extras?: Record<string, string | number | boolean | string[]>;
}
```

---

## 3. 문서 (Document) ⭐ 핵심

> 파일: `src/types/document.ts`
> Scrivener 스타일의 통합 문서 모델

```typescript
type DocumentType = "folder" | "text";
type DocumentStatus = "draft" | "revised" | "final";

interface Document {
  // === Core Fields ===
  id: string;
  projectId: string;
  parentId?: string;
  type: DocumentType;

  // === Content ===
  title: string;
  content: string; // Only used for 'text' type
  synopsis: string; // Shown on corkboard cards

  // === Ordering ===
  order: number;

  // === Metadata ===
  metadata: DocumentMetadata;

  // === Relationships ===
  characterIds: string[];
  foreshadowingIds: string[];

  // === Timestamps ===
  createdAt: string;
  updatedAt: string;
}

interface DocumentMetadata {
  status: DocumentStatus;
  label?: string; // POV character, location, etc.
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords: string[];
  notes: string;
}

// Tree structure for display
interface DocumentTreeNode extends Document {
  children: DocumentTreeNode[];
}

// Input types
interface CreateDocumentInput {
  projectId: string;
  parentId?: string;
  type: DocumentType;
  title: string;
  synopsis?: string;
  targetWordCount?: number;
}

interface UpdateDocumentInput {
  title?: string;
  content?: string;
  synopsis?: string;
  order?: number;
  metadata?: Partial<DocumentMetadata>;
  characterIds?: string[];
  foreshadowingIds?: string[];
}
```

### Backend Document Format

> 파일: `src/services/documentService.ts`
> 백엔드 API는 flat 구조를 사용

```typescript
interface BackendDocument {
  id: string;
  projectId: string;
  parentId?: string;
  type: DocumentType;
  title: string;
  content?: string;
  synopsis?: string;
  order: number;
  status: DocumentStatus;
  label?: string;
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  children?: BackendDocument[];
}
```

---

## 4. 복선 (Foreshadowing)

> 파일: `src/types/foreshadowing.ts`

```typescript
type ForeshadowingStatus = "pending" | "recovered" | "ignored";
type ForeshadowingImportance = "major" | "minor";

interface Foreshadowing {
  id: string;
  projectId: string;
  tag: string; // e.g., "전설의검"
  status: ForeshadowingStatus;
  description?: string;
  importance?: ForeshadowingImportance;
  relatedCharacterIds?: string[];
  extras?: Record<string, string | number | boolean>;
  appearances: ForeshadowingAppearance[];
  createdAt: string;
  updatedAt: string;
}

interface ForeshadowingAppearance {
  sceneId?: string;
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string; // 주변 텍스트
  isRecovery: boolean; // 회수 지점인지
  extras?: Record<string, string | number | boolean>;
}

interface CreateForeshadowingInput {
  projectId: string;
  tag: string;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}

interface UpdateForeshadowingInput {
  status?: ForeshadowingStatus;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}
```

---

## 5. 캐릭터 (Character)

> 파일: `src/types/character.ts`

```typescript
type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "sidekick"
  | "other";

interface Character {
  id: string;
  projectId: string;
  name: string;
  role?: CharacterRole;
  imageUrl?: string;
  extras?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  updatedAt: string;
}

// === 관계 타입 ===
type RelationshipType = "friendly" | "hostile" | "neutral";

interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number; // 1-10
  extras?: Record<string, string | number | boolean>;
}

// === React Flow 노드 타입 ===
interface CharacterNode {
  id: string;
  type: "character";
  position: { x: number; y: number };
  data: Character;
}

interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  type: "relationship";
  data: CharacterRelationship;
}
```

---

## 6. 장소 (Place)

> 파일: `src/types/character.ts`

```typescript
type PlaceType = "region" | "building" | "special" | "other";

interface Place {
  id: string;
  projectId: string;
  name: string;
  type?: PlaceType;
  imageUrl?: string;
  extras?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  updatedAt: string;
}
```

---

## 7. 아이템 (Item)

> 파일: `src/types/character.ts`

```typescript
type ItemType = "weapon" | "accessory" | "document" | "consumable" | "other";

interface Item {
  id: string;
  projectId: string;
  name: string;
  type?: ItemType;
  currentOwnerId?: string; // 현재 소유자 캐릭터 ID
  imageUrl?: string;
  extras?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. API 공통 타입

> 파일: `src/types/api.ts`

```typescript
interface ApiResponse<T> {
  success?: boolean;
  status?: string;
  code?: number;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

type JobStatus = "pending" | "processing" | "completed" | "failed";

interface JobResponse<T = unknown> {
  jobId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  result?: T;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface AiAnalysisResult {
  message: string;
  suggestions: string[];
}
```

---

# Part 2: PostgreSQL 엔티티

> 백엔드 데이터베이스 스키마

---

## User Entity

| 필드      | 타입      | 필수 | 설명           |
| --------- | --------- | ---- | -------------- |
| id        | UUID      | ✅   | PK             |
| email     | VARCHAR   | ✅   | UNIQUE, 로그인 |
| password  | VARCHAR   | ✅   | bcrypt 해시    |
| nickname  | VARCHAR   | ✅   | 필명/닉네임    |
| avatarUrl | VARCHAR   | ❌   | S3 URL         |
| createdAt | TIMESTAMP | ✅   | 가입일시       |
| updatedAt | TIMESTAMP | ✅   | 수정일시       |

---

## Project Entity

| 필드        | 타입      | 필수 | FK/제약조건 | 설명              |
| ----------- | --------- | ---- | ----------- | ----------------- |
| id          | UUID      | ✅   | PK          | 고유 식별자       |
| userId      | UUID      | ✅   | FK → User   | 소유자            |
| title       | VARCHAR   | ✅   |             | 작품 제목         |
| genre       | ENUM      | ✅   |             | 장르              |
| description | TEXT      | ❌   |             | 시놉시스          |
| coverImage  | VARCHAR   | ❌   |             | S3 URL            |
| status      | ENUM      | ✅   |             | writing/completed |
| author      | VARCHAR   | ❌   |             | 작가명 (표시용)   |
| extras      | JSONB     | ❌   |             | 동적 메타데이터   |
| createdAt   | TIMESTAMP | ✅   |             | 생성일시          |
| updatedAt   | TIMESTAMP | ✅   |             | 수정일시          |

---

## Document Entity ⭐

| 필드             | 타입      | 필수 | FK/제약조건   | 설명                 |
| ---------------- | --------- | ---- | ------------- | -------------------- |
| id               | UUID      | ✅   | PK            | 고유 식별자          |
| projectId        | UUID      | ✅   | FK → Project  | 프로젝트             |
| parentId         | UUID      | ❌   | FK → Document | 상위 폴더 (self-ref) |
| type             | ENUM      | ✅   |               | folder/text          |
| title            | VARCHAR   | ✅   |               | 문서 제목            |
| content          | TEXT      | ✅   |               | 본문 (HTML)          |
| synopsis         | TEXT      | ✅   |               | 요약                 |
| order            | INTEGER   | ✅   |               | 형제 간 순서         |
| status           | ENUM      | ✅   |               | draft/revised/final  |
| label            | VARCHAR   | ❌   |               | POV 캐릭터 등        |
| labelColor       | VARCHAR   | ❌   |               | #hex                 |
| wordCount        | INTEGER   | ✅   |               | 글자수 (읽기전용)    |
| targetWordCount  | INTEGER   | ❌   |               | 목표 글자수          |
| includeInCompile | BOOLEAN   | ✅   | DEFAULT true  | 내보내기 포함        |
| keywords         | VARCHAR[] | ❌   |               | 태그 배열            |
| notes            | TEXT      | ❌   |               | 작가 메모            |
| createdAt        | TIMESTAMP | ✅   |               | 생성일시             |
| updatedAt        | TIMESTAMP | ✅   |               | 수정일시             |

> ⚠️ `wordCount`는 백엔드에서 content 저장 시 자동 계산됨. 프론트엔드에서 직접 업데이트하면 안됨.

---

## Foreshadowing Entity

| 필드        | 타입      | 필수 | FK/제약조건  | 설명                      |
| ----------- | --------- | ---- | ------------ | ------------------------- |
| id          | UUID      | ✅   | PK           | 고유 식별자               |
| projectId   | UUID      | ✅   | FK → Project | 프로젝트                  |
| tag         | VARCHAR   | ✅   | UNIQUE(proj) | 태그명 (예: 전설의검)     |
| status      | ENUM      | ✅   |              | pending/recovered/ignored |
| description | TEXT      | ❌   |              | 설명                      |
| importance  | ENUM      | ❌   |              | major/minor               |
| createdAt   | TIMESTAMP | ✅   |              | 생성일시                  |
| updatedAt   | TIMESTAMP | ✅   |              | 수정일시                  |

---

# Part 3: Neo4j 엔티티

> 그래프 데이터, 관계 분석

---

## Character 노드

```cypher
(:Character {
  id: "uuid",
  projectId: "uuid",
  name: "주인공",
  role: "protagonist",
  imageUrl: "https://s3.../image.jpg",
  // 동적 속성 (extras)
  age: 25,
  species: "human",
  personality: ["용감", "정의로움"]
})
```

## Relationship 엣지

```cypher
(:Character)-[:RELATED_TO {
  id: "uuid",
  type: "friendly",
  strength: 8,
  description: "어린시절 친구"
}]->(:Character)
```

## Place 노드

```cypher
(:Place {
  id: "uuid",
  projectId: "uuid",
  name: "왕국 아르카나",
  type: "region"
})
```

## Item 노드

```cypher
(:Item {
  id: "uuid",
  projectId: "uuid",
  name: "전설의 검",
  type: "weapon"
})

// 소유 관계
(:Character)-[:OWNS {since: "3장"}]->(:Item)
```

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                     |
| ---- | ---------- | --------------------------------------------- |
| 1.0  | 2024.12.25 | 현재 구현 기준 최초 작성                      |
| 1.1  | 2024.12.25 | API 엔드포인트 섹션 제거 (API_SPEC.md로 통합) |
| 1.2  | 2024.12.25 | PostgreSQL/Neo4j 저장소 분리 명시             |
| 1.3  | 2024.12.26 | 프론트엔드 TypeScript 타입 기준으로 전면 갱신 |

---

## 관련 문서

| 문서              | 설명                      |
| ----------------- | ------------------------- |
| `API_SPEC.md`     | API 엔드포인트 명세       |
| `ARCHITECTURE.md` | 프로젝트 아키텍처         |
| `SPEC.md`         | 전체 기능 명세            |
| `src/types/`      | TypeScript 타입 정의 파일 |
