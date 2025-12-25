# StoLink 데이터 모델 명세

> **버전**: 1.1
> **최종 수정**: 2024년 12월 25일
> **상태**: 현재 구현 기준

---

## 개요

이 문서는 StoLink 프로젝트에서 사용되는 모든 **엔티티(Entity)**와 **DTO(Data Transfer Object)**를 정의합니다.

```
┌─────────────────────────────────────────────────────┐
│                  핵심 엔티티 관계도                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   User ─────┬─────> Project                         │
│             │         │                             │
│             │         ├──> Document (folder/text)   │
│             │         │        ├── characterIds[]   │
│             │         │        └── foreshadowingIds[]
│             │         │                             │
│             │         ├──> Character                │
│             │         │        └── Relationship     │
│             │         │                             │
│             │         ├──> Foreshadowing            │
│             │         │        └── Appearance[]     │
│             │         │                             │
│             │         ├──> Place                    │
│             │         │                             │
│             │         └──> Item                     │
│             │                                       │
└─────────────┴───────────────────────────────────────┘
```

> 📖 API 엔드포인트 상세 → [SPEC.md](./SPEC.md) 각 페이지 섹션 참조

---

## 1. 인증 (Auth)

### 1.1 User Entity

| 필드      | 타입     | 필수 | 설명            |
| --------- | -------- | ---- | --------------- |
| id        | string   | ✅   | 고유 식별자     |
| email     | string   | ✅   | 이메일 (로그인) |
| nickname  | string   | ✅   | 필명/닉네임     |
| avatarUrl | string   | ❌   | 프로필 이미지   |
| createdAt | datetime | ✅   | 가입일시        |

### 1.2 Auth DTOs

```typescript
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

### 2.1 Project Entity

| 필드        | 타입          | 필수 | 설명                     |
| ----------- | ------------- | ---- | ------------------------ |
| id          | string        | ✅   | 고유 식별자              |
| userId      | string        | ✅   | 소유자 ID                |
| title       | string        | ✅   | 작품 제목                |
| genre       | Genre         | ✅   | 장르                     |
| description | string        | ❌   | 시놉시스                 |
| coverImage  | string        | ❌   | 표지 이미지 URL          |
| status      | ProjectStatus | ✅   | 연재 상태                |
| author      | string        | ❌   | 작가명 (표시용)          |
| extras      | Record        | ❌   | 세계관 설정 등 동적 정보 |
| stats       | ProjectStats  | ✅   | 통계 정보                |
| createdAt   | datetime      | ✅   | 생성일시                 |
| updatedAt   | datetime      | ✅   | 수정일시                 |

### 2.2 Project 관련 타입

```typescript
type Genre = "fantasy" | "romance" | "sf" | "mystery" | "other";

type ProjectStatus = "writing" | "completed";

interface ProjectStats {
  totalCharacters: number;
  totalWords: number;
  chapterCount: number;
  characterCount: number;
  foreshadowingRecoveryRate: number; // 0-100
  consistencyScore: number; // 0-100
}
```

### 2.3 Project DTOs

```typescript
interface CreateProjectInput {
  title: string;
  genre: Genre;
  description?: string;
  extras?: Record<string, string | number | boolean | string[]>;
}

interface UpdateProjectInput {
  title?: string;
  genre?: Genre;
  description?: string;
  coverImage?: string;
  status?: ProjectStatus;
  extras?: Record<string, unknown>;
}
```

---

## 3. 문서 (Document) ⭐ 핵심

> Scrivener 스타일의 통합 문서 모델. folder와 text 두 타입을 하나의 모델로 통합.

### 3.1 Document Entity

| 필드             | 타입             | 필수 | 설명                     |
| ---------------- | ---------------- | ---- | ------------------------ |
| id               | string           | ✅   | 고유 식별자              |
| projectId        | string           | ✅   | 프로젝트 ID              |
| parentId         | string           | ❌   | 상위 폴더 ID (null=루트) |
| type             | DocumentType     | ✅   | "folder" \| "text"       |
| title            | string           | ✅   | 문서 제목                |
| content          | string           | ✅   | 본문 (HTML, text만 사용) |
| synopsis         | string           | ✅   | 요약 (인덱스 카드용)     |
| order            | number           | ✅   | 형제 간 순서             |
| metadata         | DocumentMetadata | ✅   | 메타데이터               |
| characterIds     | string[]         | ✅   | 등장 캐릭터 ID 목록      |
| foreshadowingIds | string[]         | ✅   | 관련 복선 ID 목록        |
| createdAt        | datetime         | ✅   | 생성일시                 |
| updatedAt        | datetime         | ✅   | 수정일시                 |

### 3.2 DocumentMetadata

```typescript
interface DocumentMetadata {
  status: DocumentStatus; // "draft" | "revised" | "final"
  label?: string;
  labelColor?: string;
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean;
  keywords: string[];
  notes: string;
}

type DocumentStatus = "draft" | "revised" | "final";
```

### 3.3 Document DTOs

```typescript
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

### 3.4 DocumentTreeNode (트리 구조)

```typescript
interface DocumentTreeNode extends Document {
  children: DocumentTreeNode[];
}
```

---

## 4. 캐릭터 (Character)

### 4.1 Character Entity

| 필드      | 타입          | 필수 | 설명              |
| --------- | ------------- | ---- | ----------------- |
| id        | string        | ✅   | 고유 식별자       |
| projectId | string        | ✅   | 프로젝트 ID       |
| name      | string        | ✅   | 캐릭터 이름       |
| role      | CharacterRole | ❌   | 역할              |
| imageUrl  | string        | ❌   | 캐릭터 이미지 URL |
| extras    | Record        | ❌   | 동적 추가 정보    |
| createdAt | datetime      | ✅   | 생성일시          |
| updatedAt | datetime      | ✅   | 수정일시          |

```typescript
type CharacterRole =
  | "protagonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "sidekick"
  | "other";
```

### 4.2 CharacterRelationship

| 필드     | 타입             | 필수 | 설명           |
| -------- | ---------------- | ---- | -------------- |
| id       | string           | ✅   | 고유 식별자    |
| sourceId | string           | ✅   | 시작 캐릭터 ID |
| targetId | string           | ✅   | 대상 캐릭터 ID |
| type     | RelationshipType | ✅   | 관계 유형      |
| strength | number           | ✅   | 관계 강도 1-10 |
| extras   | Record           | ❌   | 관계 설명 등   |

```typescript
type RelationshipType = "friendly" | "hostile" | "neutral";
```

### 4.3 React Flow 노드 타입

```typescript
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

## 5. 복선 (Foreshadowing)

### 5.1 Foreshadowing Entity

| 필드                | 타입                      | 필수 | 설명                  |
| ------------------- | ------------------------- | ---- | --------------------- |
| id                  | string                    | ✅   | 고유 식별자           |
| projectId           | string                    | ✅   | 프로젝트 ID           |
| tag                 | string                    | ✅   | 태그명 (예: 전설의검) |
| status              | ForeshadowingStatus       | ✅   | 상태                  |
| description         | string                    | ❌   | 설명                  |
| importance          | ForeshadowingImportance   | ❌   | 중요도                |
| relatedCharacterIds | string[]                  | ❌   | 관련 캐릭터 ID        |
| extras              | Record                    | ❌   | 동적 추가 정보        |
| appearances         | ForeshadowingAppearance[] | ✅   | 등장 위치 목록        |
| createdAt           | datetime                  | ✅   | 생성일시              |
| updatedAt           | datetime                  | ✅   | 수정일시              |

```typescript
type ForeshadowingStatus = "pending" | "recovered" | "ignored";
type ForeshadowingImportance = "major" | "minor";
```

### 5.2 ForeshadowingAppearance

```typescript
interface ForeshadowingAppearance {
  sceneId?: string;
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string;
  isRecovery: boolean;
  extras?: Record<string, unknown>;
}
```

### 5.3 Foreshadowing DTOs

```typescript
interface CreateForeshadowingInput {
  projectId: string;
  tag: string;
  description?: string;
}

interface UpdateForeshadowingInput {
  status?: ForeshadowingStatus;
  description?: string;
}

interface ForeshadowingAppearanceInput {
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string;
  isRecovery: boolean;
}
```

---

## 6. 세계관 요소

### 6.1 Place (장소)

| 필드      | 타입      | 필수 | 설명          |
| --------- | --------- | ---- | ------------- |
| id        | string    | ✅   | 고유 식별자   |
| projectId | string    | ✅   | 프로젝트 ID   |
| name      | string    | ✅   | 장소 이름     |
| type      | PlaceType | ❌   | 장소 유형     |
| imageUrl  | string    | ❌   | 이미지 URL    |
| extras    | Record    | ❌   | 위치, 역사 등 |
| createdAt | datetime  | ✅   | 생성일시      |
| updatedAt | datetime  | ✅   | 수정일시      |

```typescript
type PlaceType = "region" | "building" | "special" | "other";
```

### 6.2 Item (아이템)

| 필드           | 타입     | 필수 | 설명               |
| -------------- | -------- | ---- | ------------------ |
| id             | string   | ✅   | 고유 식별자        |
| projectId      | string   | ✅   | 프로젝트 ID        |
| name           | string   | ✅   | 아이템 이름        |
| type           | ItemType | ❌   | 아이템 유형        |
| currentOwnerId | string   | ❌   | 현재 소유자 캐릭터 |
| imageUrl       | string   | ❌   | 이미지 URL         |
| extras         | Record   | ❌   | 능력, 역사 등      |
| createdAt      | datetime | ✅   | 생성일시           |
| updatedAt      | datetime | ✅   | 수정일시           |

```typescript
type ItemType = "weapon" | "accessory" | "document" | "consumable" | "other";
```

---

## 7. UI 전용 타입

### 7.1 ChapterNode (사이드바용)

> Document를 UI 표시용으로 간소화한 타입

```typescript
interface ChapterNode {
  id: string;
  title: string;
  type: "part" | "chapter" | "section";
  characterCount?: number;
  isPlot?: boolean;
  isModified?: boolean;
  status?: "todo" | "inProgress" | "done" | "revised";
  children?: ChapterNode[];
}
```

### 7.2 Status Colors

```typescript
const statusColors = {
  todo: "bg-stone-400", // 🔘 구상 중
  inProgress: "bg-amber-400", // 🟡 집필 중
  done: "bg-emerald-400", // 🟢 탈고 완료
  revised: "bg-blue-400", // 🔵 퇴고 완료
};
```

---

## 버전 이력

| 버전 | 날짜       | 변경 내용                                 |
| ---- | ---------- | ----------------------------------------- |
| 1.0  | 2024.12.25 | 현재 구현 기준 최초 작성                  |
| 1.1  | 2024.12.25 | API 엔드포인트 섹션 제거 (SPEC.md로 통합) |

---

## 관련 문서

| 문서              | 설명                            |
| ----------------- | ------------------------------- |
| `ARCHITECTURE.md` | 프로젝트 아키텍처               |
| `SPEC.md`         | 전체 기능 명세 + API 엔드포인트 |
| `TECHSTACK.md`    | 기술 스택 선정 이유             |
| `src/types/`      | TypeScript 타입 정의 파일       |
