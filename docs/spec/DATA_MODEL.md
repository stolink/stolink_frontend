# StoLink 데이터 모델 명세

> **버전**: 1.5
> **최종 수정**: 2026년 1월 14일
> **상태**: 현재 구현 기준 (sync-docs 워크플로우로 동기화)

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
> Scrivener 스타일의 **트리 구조** 문서 모델 (재귀적 계층 구조)

```typescript
export interface Document {
  // === Core Fields ===
  id: string;
  projectId: string;
  parentId?: string; // 부모 문서 ID (계층 구조 지원)
  type: "folder" | "text" | "scrivenings"; // 문서 타입

  // === Content ===
  title: string;
  content: string; // HTML content
  synopsis: string;

  // === Ordering ===
  order: number; // 정렬 순서 (같은 부모 내에서)

  // === Metadata ===
  metadata: DocumentMetadata;

  // === Relationships ===
  characterIds: string[];
  foreshadowingIds: string[];

  // === Timestamps ===
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  status: DocumentStatus;
  label?: string;
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords: string[];
  notes: string;
}

export type DocumentStatus = "draft" | "revised" | "final";

// Input types
export interface CreateDocumentInput {
  projectId: string;
  title: string;
  synopsis?: string;
  targetWordCount?: number;
  order?: number;
}

export interface UpdateDocumentInput {
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
> 백엔드 API도 1차원 구조

```typescript
interface BackendDocument {
  id: string;
  projectId: string;
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
  // children removed
}
```

---

## 4. 복선 (Foreshadowing)

> 파일: `src/types/foreshadowing.ts`

```typescript
export type ForeshadowingStatus = "pending" | "recovered" | "ignored";
export type ForeshadowingImportance = "major" | "minor";

export interface ForeshadowingAppearance {
  // === 위치 정보 ===
  sectionTitle: string; // 섹션 제목 (필수)
  documentId?: string; // 섹션 ID (선택, 레거시)

  // === 상태 ===
  isRecovery: boolean; // 회수 지점인지

  // === 레거시 호환 ===
  sceneId?: string;
  chapterId?: string;
  chapterTitle?: string;
}

export interface Foreshadowing {
  // === 필수 필드 ===
  id: string;
  projectId: string;
  tag: string; // e.g., "전설의검" (기존 title 필드)
  status: ForeshadowingStatus;

  // === 주요 선택 필드 ===
  description?: string;
  importance?: ForeshadowingImportance; // 중요도
  relatedCharacterIds?: string[]; // 관련 캐릭터

  // === 동적 추가 정보 ===
  extras?: Record<string, string | number | boolean>;

  // === 등장 위치들 ===
  appearances: ForeshadowingAppearance[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateForeshadowingInput {
  projectId: string;
  tag: string;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}

export interface UpdateForeshadowingInput {
  tag?: string;
  status?: ForeshadowingStatus;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}
```

**주요 변경사항:**

- `title` → `tag`: 복선 식별자 필드명 변경
- `status` 값: `"setup" | "resolved" | "dropped"` → `"pending" | "recovered" | "ignored"`
- `importance` 타입: `number` → `ForeshadowingImportance` ("major" | "minor")
- `createdIn`/`resolvedIn` 제거 → `appearances: ForeshadowingAppearance[]` 배열로 통합
- 각 등장 위치는 `isRecovery: boolean` 플래그로 투척/회수 구분

---

## 5. 캐릭터 (Character)

> 파일: `src/types/character.ts`

### 5.1 새 백엔드 스키마 (현재 구현)

```typescript
// === 관계 타입 (3종으로 단순화) ===
export type RelationType = "friendly" | "hostile" | "romantic";

// === 캐릭터 역할 ===
export type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "sidekick"
  | "other";

// === 캐릭터 프로필 정보 ===
export interface CharacterProfile {
  character_id: string;
  name: string;
  age: number | null;
  gender: string;
  race: string;
  mbti: string | null;
  personality: string[];
  backstory: string;
  faction: {
    name: string;
    social: {
      rank: string;
      influence: number;
      faction_reputation: Record<string, unknown>;
    };
  };
}

// === 캐릭터 외모 정보 ===
export interface CharacterAppearance {
  physique: string;
  skin_tone: string;
  eyes: string;
  nose: string;
  mouth: string;
  hair_style: string;
  hair_color: string;
  attire: string[];
  expression: string;
  scars_tattoos: string[];
  style_context: {
    art_style: string;
  };
}

// === 캐릭터 성격 정보 ===
export interface CharacterPersonality {
  core_traits: string[];
  flaws: string[];
  values: string[];
}

// === 캐릭터 관계 (임베딩된 그래프 노드) ===
export interface CharacterRelation {
  source: string;
  target: string;
  relation_type: RelationType;
  strength: number;
  description: string;
  bidirectional: boolean;
  public_stance?: string;
  private_feeling?: string;
  evolved_from?: RelationType | null;
}

// === 캐릭터 관계 정보 컨테이너 ===
export interface CharacterRelations {
  graph: CharacterRelation[];
  event_refs: string[];
  location_context: string;
}

// === 캐릭터 현재 감정 상태 ===
export interface CharacterMood {
  emotion: string;
  intensity: number;
  trigger: string | null;
}

// === 인벤토리 아이템 ===
export interface InventoryItem {
  item_id: string | null;
  name: string;
  quantity: number;
  rarity: string;
  estimated_value: number;
  equipped: boolean;
  slot: string;
  description: string;
}

// === 캐릭터 인벤토리 ===
export interface CharacterInventory {
  equipped_items: InventoryItem[];
  bag_items: InventoryItem[];
  quest_items: string[];
}

// === 캐릭터 메타 정보 ===
export interface CharacterMeta {
  created_at: string | null;
  updated_at: string | null;
  data_version: string;
  lock_version: number;
}

// === 메인 캐릭터 인터페이스 (새 백엔드 스키마) ===
export interface Character {
  _id: string;
  projectId: string;
  role: CharacterRole;
  profile: CharacterProfile;
  aliases: string[];
  status: string;
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  relations: CharacterRelations;
  current_mood: CharacterMood;
  inventory: CharacterInventory;
  meta: CharacterMeta;
  /** AI 생성 이미지 URL (다른 파이프라인에서 폴링) */
  imageUrl?: string;
  embedding?: number[];
}
```

### 5.2 헬퍼 함수

```typescript
// Character._id를 id로 접근할 수 있게 하는 헬퍼
export function getCharacterId(char: Character): string {
  return char._id;
}

// Character.profile.name을 간편하게 접근
export function getCharacterName(char: Character): string {
  return char.profile.name;
}

// Character.profile.faction.name을 간편하게 접근
export function getCharacterFaction(char: Character): string {
  return char.profile.faction?.name || "무소속";
}

// 관계 배열을 가져오는 헬퍼 (레거시 호환)
export function getCharacterRelationships(
  char: Character,
): CharacterRelation[] {
  return char.relations?.graph || [];
}
```

### 5.3 레거시 호환 (Deprecated)

```typescript
/**
 * @deprecated Use Character.relations.graph instead
 * 하위 호환성을 위한 레거시 관계 인터페이스
 */
export interface BackendRelationship {
  id?: string | number;
  target: string;
  type: RelationType;
  strength: number;
  label?: string | null;
  since?: string | null;
  description?: string;
  bidirectional?: boolean;
  evolved_from?: RelationType;
  history?: RelationshipEvent[] | string;
}

export interface RelationshipEvent {
  eventId: string;
  title: string;
  chapter?: string;
  type: RelationType;
  reason?: string;
  date?: string;
}
```

### 5.4 D3.js 그래프 타입

> 파일: `src/types/characterGraph.ts`

```typescript
interface CharacterNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  role?: CharacterRole;
  group?: string;
  imageUrl?: string;
  // D3 런타임 필드 (시뮬레이션이 자동 추가)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface RelationshipLink extends d3.SimulationLinkDatum<CharacterNode> {
  id: string;
  source: string | CharacterNode;
  target: string | CharacterNode;
  type: RelationType;
  strength: number; // 1-10
  label?: string;
}

interface GraphData {
  nodes: CharacterNode[];
  links: RelationshipLink[];
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

## 9. AI 분석 (AI Analysis)

> 파일: `src/types/ai.ts`
> **정책**: AI 분석 결과는 사용자 승인 과정 없이 **즉시 프로젝트 데이터(PostgreSQL/NoSQL)에 반영(Overwrite)**됩니다.

```typescript
// === AI 분석 결과 (NoSQL 저장 대상) ===
// 분석 즉시 프론트엔드/백엔드에서 이 구조를 통해 메인 DB를 업데이트합니다.
interface AiAnalysisResult {
  // 메인 엔티티와 1:1 매핑되는 데이터들
  characters: Character[]; // 기존 Character 타입 재사용 (src/types/character.ts)
  events: Event[]; // 기존 Event 타입 재사용 (src/types/event.ts)
  settings: Setting[]; // 기존 Setting 타입 재사용

  // 분석 전용 메타데이터
  relationships: Relationship[];
  plot_integration: PlotIntegration;
  consistency_report: ConsistencyReport;
  metadata: AiMetadata;
}

// 별도의 AiCharacter, AiEvent 타입 정의 불필요 -> 기존 타입 사용
```

---

## 10. 증분 분석 버퍼 (Analysis Buffer)

> 파일: `src/stores/useAnalysisBufferStore.ts`
> **Persist**: IndexedDB (`idb-keyval`)

```typescript
export interface BufferChunk {
  documentId: string;
  content: string; // HTML content
  charCount: number;
  timestamp: number;
}

interface AnalysisBufferState {
  projectId: string | null;
  buffer: BufferChunk[];
  bufferCharCount: number; // 현재 버퍼링된 총 글자 수
  lastFlushAt: number; // 마지막 분석 요청 시각
  isAnalyzing: boolean; // 현재 분석 중 여부
  progress: number; // 분석 진행률 (0-100)
  currentJobId: string | null; // 현재 추적 중인 메인 작업 ID
  currentJobType: "analysis" | "image" | null; // 작업 유형
  activeJobs: Record<string, string[]>; // 프로젝트별 활성 작업 ID 목록
  lastAnalyzedHashes: Record<string, string>; // 문서별 마지막 분석 해시 (중복 분석 방지)
  pendingDocuments: Record<string, string>; // 분석 대상 문서 해시 (이미 요청 중인 문서 중복 전송 방지)
  lastConsistencyReport: ConsistencyReport | null; // 마지막 일관성 리포트
}

// Config Constants
// - MIN_CHARS_FOR_AUTO_FLUSH = 5,000
// - MIN_INTERVAL_MS = 30분
```

---

# Part 2: PostgreSQL 엔티티

> **데이터 전략**: 관계형 데이터베이스는 서비스의 뼈대(Account, Project, Document)와 분석 요청 이력(Job)을 관리합니다.
> 캐릭터, 사건 등 유동적인 데이터는 NoSQL로 이관되었습니다.

## 1. User Entity

| 필드      | 타입      | 필수 | 설명          |
| --------- | --------- | ---- | ------------- |
| id        | UUID      | ✅   | PK            |
| email     | VARCHAR   | ✅   | 로그인 이메일 |
| nickname  | VARCHAR   | ✅   | 표시 이름     |
| createdAt | TIMESTAMP | ✅   | 가입일        |

## 2. Project Entity

| 필드      | 타입      | 필수 | 설명      |
| --------- | --------- | ---- | --------- |
| id        | UUID      | ✅   | PK        |
| userId    | UUID      | ✅   | FK (User) |
| title     | VARCHAR   | ✅   | 소설 제목 |
| synopsis  | TEXT      | ❌   | 기획 의도 |
| createdAt | TIMESTAMP | ✅   | 생성일    |

## 3. Document Entity

_(Part 1에서 정의한 1차원 리스트 구조와 동일)_

| 필드      | 타입    | 필수 | 설명                    |
| --------- | ------- | ---- | ----------------------- |
| id        | UUID    | ✅   | PK                      |
| projectId | UUID    | ✅   | FK (Project)            |
| title     | VARCHAR | ✅   | 챕터/장면 제목          |
| content   | TEXT    | ✅   | 본문 (HTML)             |
| order     | INTEGER | ✅   | 정렬 순서               |
| status    | ENUM    | ✅   | draft / revised / final |

## 4. AnalysisJob Entity

| 필드      | 타입      | 필수 | 설명                                      |
| --------- | --------- | ---- | ----------------------------------------- |
| id        | UUID      | ✅   | PK (Job ID)                               |
| projectId | UUID      | ✅   | FK (Project)                              |
| status    | ENUM      | ✅   | pending / processing / completed / failed |
| resultId  | VARCHAR   | ❌   | NoSQL 문서 ID (완료 시 기록)              |
| options   | JSONB     | ❌   | 분석 옵션                                 |
| createdAt | TIMESTAMP | ✅   | 요청 시각                                 |
| updatedAt | TIMESTAMP | ✅   | 완료 시각                                 |

## 5. Foreshadowing Entity

> **수동 관리**: 작가가 직접 생성 및 관리하는 복선 데이터

| 필드            | 타입      | 필수 | 설명                           |
| --------------- | --------- | ---- | ------------------------------ |
| id              | UUID      | ✅   | PK                             |
| projectId       | UUID      | ✅   | FK (Project)                   |
| title           | VARCHAR   | ✅   | 복선 제목                      |
| description     | TEXT      | ❌   | 설명/메모                      |
| status          | ENUM      | ✅   | setup / resolved / dropped     |
| importance      | INTEGER   | ✅   | 중요도 (1-5)                   |
| category        | ENUM      | ❌   | 유형 (props, dialogue...)      |
| relatedEntities | JSONB     | ❌   | 관련 엔티티 ID 목록            |
| createdIn       | JSONB     | ❌   | 투척 위치 (Document ID, Index) |
| resolvedIn      | JSONB     | ❌   | 회수 위치 (Document ID, Index) |
| createdAt       | TIMESTAMP | ✅   | 생성일                         |
| updatedAt       | TIMESTAMP | ✅   | 수정일                         |

---

# Part 3: NoSQL 엔티티 (MongoDB) ⭐ 상세 스키마

> **JSON 구조**: 사용자가 제공한 AI 분석 결과를 기반으로 설계되었습니다.
> 모든 컬렉션은 `projectId`를 인덱스로 가집니다.

## 1. AnalysisResult Collection (Raw Wrapper)

**Purpose**: AI 분석 원본 데이터 보관 및 버전 관리

| Field       | Type     | Description                            |
| ----------- | -------- | -------------------------------------- |
| `_id`       | ObjectId | 고유 ID                                |
| `jobId`     | String   | AnalysisJob ID 참조                    |
| `projectId` | String   | 프로젝트 ID                            |
| `data`      | Object   | **AI 통합 분석 결과** (하위 문서 포함) |
| `createdAt` | ISODate  | 생성일                                 |

---

## 2. Character Collection (상세)

**Purpose**: 등장인물의 상세 프로필, 스탯, 인벤토리 등 유동적 속성 관리

| Field Group    | Field                      | Type     | Description                                |
| -------------- | -------------------------- | -------- | ------------------------------------------ |
| **Identity**   | `name`                     | String   | 캐릭터 이름                                |
|                | `role`                     | String   | 역할 (protagonist, antagonist...)          |
|                | `aliases`                  | String[] | **이명/별명/멸칭** (예: 쥐새끼, 하얀 늑대) |
|                | `level`                    | Int      | 레벨                                       |
|                | `status`                   | String   | 상태 (alive, dead...)                      |
| **Profile**    | `profile.age`              | Int      | 나이                                       |
|                | `profile.gender`           | String   | 성별                                       |
|                | `profile.backstory`        | String   | 배경 스토리                                |
|                | `profile.personality`      | String[] | 성격 키워드 배열                           |
| **Appearance** | `appearance.physique`      | String   | 체격 묘사                                  |
|                | `appearance.visual_prompt` | String   | 이미지 생성용 프롬프트                     |
| **Stats**      | `stats.*`                  | Map      | 유동적 스탯 (str, int, dex...)             |
| **Combat**     | `combat.class`             | String   | 전투 클래스                                |
|                | `combat.weapons`           | String[] | 주력 무기                                  |
| **Inventory**  | `inventory.equipped`       | Object[] | 장착 아이템 목록                           |
|                | `inventory.bag`            | Object[] | 소지품 목록                                |
| **State**      | `current_mood`             | Object   | 현재 감정 상태 (`emotion`, `intensity`)    |
| **Meta**       | `relationCount`            | Int      | **관계 수** (자동 계산, 중요도 지표)       |

---

## 3. Event Collection (상세)

**Purpose**: 타임라인을 구성하는 개별 사건 정보

| Field               | Type     | Description                       |
| ------------------- | -------- | --------------------------------- |
| `event_type`        | String   | action / dialogue / confrontation |
| `narrative_summary` | String   | 한 줄 요약                        |
| `description`       | String   | 상세 묘사                         |
| `participants`      | String[] | 참여 캐릭터 이름/ID 목록          |
| `location_ref`      | String   | 장소 참조                         |
| `visual_scene`      | String   | 장면 시각화 프롬프트              |
| `importance`        | Int      | 중요도 (1-10)                     |
| `is_foreshadowing`  | Boolean  | 복선 포함 여부                    |

---

## 4. Setting Collection (상세)

**Purpose**: 장소 및 배경 설정

| Field               | Type     | Description             |
| ------------------- | -------- | ----------------------- |
| `name`              | String   | 장소 이름               |
| `type`              | String   | 유형 (dungeon, city...) |
| `visual_background` | String   | 배경 이미지 프롬프트    |
| `atmosphere`        | String   | 분위기 키워드           |
| `notable_features`  | String[] | 주요 특징물             |

---

## 5. Relationship Collection (상세)

**Purpose**: 캐릭터 간 관계 정의

| Field           | Type     | Description                       |
| --------------- | -------- | --------------------------------- |
| `source`        | String   | 주체 캐릭터                       |
| `target`        | String   | 대상 캐릭터                       |
| `relation_type` | String   | 관계 유형 (ENEMY, FRIENDLY...)    |
| `strength`      | Int      | 관계 강도                         |
| `description`   | String   | 관계에 대한 설명                  |
| `history`       | Object[] | **관계 변천사** (Event 참조 목록) |

### Relationship History Structure (in `history`)

```json
{
  "eventId": "uuid",
  "title": "사건 제목",
  "chapter": "Chapter 3",
  "type": "hostile", // 당시 관계 상태
  "reason": "배신으로 인한 적대 관계 형성"
}
```

---

# Part 4: Neo4j 엔티티 (Graph DB)

> **동기화 전략**: NoSQL의 `Character`와 `Relationship` 데이터를 기반으로, **복잡한 관계 탐색 및 그래프 알고리즘**을 위한 투영(Projection) 데이터를 저장합니다.

## 1. Node Labels (정점)

| Label        | Key Properties                        | Description                                      |
| ------------ | ------------------------------------- | ------------------------------------------------ |
| `:Character` | `id` (UUID)<br>`name`<br>`role`       | 등장인물 노드. NoSQL의 `Character`와 1:1 매핑    |
| `:Event`     | `id` (UUID)<br>`type`<br>`importance` | 사건 노드. 시간 순서 및 인과 관계 표현           |
| `:Group`     | `name`                                | 소속 세력 (Faction). 캐릭터를 그룹화하는 데 사용 |
| `:Keyword`   | `word`                                | 주요 키워드/테마. 의미적 연결망 분석용           |

## 2. Relationship Types (간선)

| Type               | Direction                        | Properties                                                    | Description                             |
| ------------------ | -------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `:RELATED_TO`      | `(:Character)-[:]->(:Character)` | `type` (FRIENDLY/ENEMY)<br>`strength` (1-10)<br>`description` | 캐릭터 간의 사회적/감정적 관계          |
| `:PARTICIPATED_IN` | `(:Character)-[:]->(:Event)`     | `role` (주동/피동)                                            | 캐릭터가 특정 사건에 개입함             |
| `:NEXT_EVENT`      | `(:Event)-[:]->(:Event)`         | `time_gap`                                                    | 사건의 시간적/인과적 흐름 (Linked List) |
| `:BELONGS_TO`      | `(:Character)-[:]->(:Group)`     | `rank`                                                        | 캐릭터의 세력 소속                      |
| `:MENTIONS`        | `(:Event)-[:]->(:Keyword)`       | `frequency`                                                   | 사건에서 특정 키워드가 언급됨           |

## 3. Graph Algorithms Use Cases

Graph DB는 단순 조회가 아닌 **분석 연산**을 위해 존재합니다.

1. **Centrality (중심성)**: 스토리의 진짜 주인공이나 비선 실세 찾기 (`PageRank`)
2. **Community Detection**: 파벌 분석 및 인물 클러스터링 (`Louvain`)
3. **Path Finding**: 두 캐릭터 사이의 가장 짧은 연결 고리 찾기 (`ShortestPath`)

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                                   |
| ---- | ---------- | ----------------------------------------------------------- |
| 1.0  | 2024.12.25 | 최초 작성                                                   |
| 1.5  | 2025.12.30 | PostgreSQL/NoSQL/Neo4j 3-Tier 구조 확립 및 상세 스키마 정의 |

---

## 관련 문서

| 문서              | 설명                      |
| ----------------- | ------------------------- |
| `API_SPEC.md`     | API 엔드포인트 명세       |
| `ARCHITECTURE.md` | 프로젝트 아키텍처         |
| `SPEC.md`         | 전체 기능 명세            |
| `src/types/`      | TypeScript 타입 정의 파일 |
