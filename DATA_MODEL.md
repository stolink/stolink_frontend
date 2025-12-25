# StoLink 데이터 모델 명세

> **버전**: 1.0
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
// 로그인 요청
interface LoginInput {
  email: string;
  password: string;
}

// 회원가입 요청
interface RegisterInput {
  email: string;
  password: string;
  nickname: string;
}

// 인증 응답
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
  totalCharacters: number; // 총 글자 수
  totalWords: number; // 총 단어 수
  chapterCount: number; // 챕터 수
  characterCount: number; // 캐릭터 수
  foreshadowingRecoveryRate: number; // 복선 회수율 (0-100)
  consistencyScore: number; // 일관성 점수 (0-100)
}
```

### 2.3 Project DTOs

```typescript
// 생성 요청
interface CreateProjectInput {
  title: string;
  genre: Genre;
  description?: string;
  extras?: Record<string, string | number | boolean | string[]>;
}

// 수정 요청 (모든 필드 선택적)
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

### 3.1 Document Entity

> Scrivener 스타일의 통합 문서 모델. folder와 text 두 타입을 하나의 모델로 통합.

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
  label?: string; // POV 캐릭터, 장소 등
  labelColor?: string; // 라벨 색상 (#hex)
  wordCount: number; // 현재 글자 수
  targetWordCount?: number; // 목표 글자 수
  includeInCompile: boolean; // 내보내기 포함 여부
  keywords: string[]; // 키워드 태그
  notes: string; // 작가 메모
}

type DocumentStatus = "draft" | "revised" | "final";
```

### 3.3 Document DTOs

```typescript
// 생성 요청
interface CreateDocumentInput {
  projectId: string;
  parentId?: string; // null이면 루트
  type: DocumentType; // "folder" | "text"
  title: string;
  synopsis?: string;
  targetWordCount?: number;
}

// 수정 요청
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
// Document를 확장한 트리 노드 (UI용)
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
  | "protagonist" // 주인공
  | "antagonist" // 악역
  | "supporting" // 조연
  | "mentor" // 멘토
  | "sidekick" // 조력자
  | "other";
```

### 4.2 CharacterRelationship (관계)

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
// 그래프 노드
interface CharacterNode {
  id: string;
  type: "character";
  position: { x: number; y: number };
  data: Character;
}

// 그래프 엣지 (관계선)
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

### 5.2 ForeshadowingAppearance (등장 위치)

```typescript
interface ForeshadowingAppearance {
  sceneId?: string; // 씬 ID (옵션)
  chapterId: string; // 챕터 ID
  chapterTitle: string; // 챕터 제목 (표시용)
  line: number; // 라인 번호
  context: string; // 주변 텍스트 (미리보기)
  isRecovery: boolean; // 회수 지점 여부
  extras?: Record<string, unknown>;
}
```

### 5.3 Foreshadowing DTOs

```typescript
// 생성 요청
interface CreateForeshadowingInput {
  projectId: string;
  tag: string;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}

// 수정 요청
interface UpdateForeshadowingInput {
  status?: ForeshadowingStatus;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}

// 등장 추가 요청
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
  isPlot?: boolean; // 플롯 노트 여부
  isModified?: boolean; // 수정됨 표시
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

## 8. API 엔드포인트 예상

### 8.1 Auth

| Method | Endpoint           | 설명      |
| ------ | ------------------ | --------- |
| POST   | /api/auth/register | 회원가입  |
| POST   | /api/auth/login    | 로그인    |
| POST   | /api/auth/logout   | 로그아웃  |
| POST   | /api/auth/refresh  | 토큰 갱신 |

### 8.2 Projects

| Method | Endpoint                | 설명      |
| ------ | ----------------------- | --------- |
| GET    | /api/projects           | 목록 조회 |
| POST   | /api/projects           | 생성      |
| GET    | /api/projects/:id       | 상세 조회 |
| PATCH  | /api/projects/:id       | 수정      |
| DELETE | /api/projects/:id       | 삭제      |
| GET    | /api/projects/:id/stats | 통계 조회 |

### 8.3 Documents

| Method | Endpoint                     | 설명        |
| ------ | ---------------------------- | ----------- |
| GET    | /api/projects/:pid/documents | 목록 조회   |
| POST   | /api/projects/:pid/documents | 생성        |
| GET    | /api/documents/:id           | 상세 조회   |
| PATCH  | /api/documents/:id           | 수정        |
| DELETE | /api/documents/:id           | 삭제        |
| GET    | /api/documents/:id/content   | 본문만 조회 |
| PATCH  | /api/documents/:id/content   | 본문만 수정 |
| POST   | /api/documents/reorder       | 순서 변경   |

### 8.4 Characters

| Method | Endpoint                         | 설명      |
| ------ | -------------------------------- | --------- |
| GET    | /api/projects/:pid/characters    | 목록 조회 |
| POST   | /api/projects/:pid/characters    | 생성      |
| GET    | /api/characters/:id              | 상세 조회 |
| PATCH  | /api/characters/:id              | 수정      |
| DELETE | /api/characters/:id              | 삭제      |
| GET    | /api/projects/:pid/relationships | 관계 목록 |
| POST   | /api/relationships               | 관계 생성 |
| DELETE | /api/relationships/:id           | 관계 삭제 |

### 8.5 Foreshadowing

| Method | Endpoint                           | 설명           |
| ------ | ---------------------------------- | -------------- |
| GET    | /api/projects/:pid/foreshadowing   | 목록 조회      |
| POST   | /api/projects/:pid/foreshadowing   | 생성           |
| GET    | /api/foreshadowing/:id             | 상세 조회      |
| PATCH  | /api/foreshadowing/:id             | 수정           |
| DELETE | /api/foreshadowing/:id             | 삭제           |
| POST   | /api/foreshadowing/:id/appearances | 등장 위치 추가 |
| PATCH  | /api/foreshadowing/:id/recover     | 회수 처리      |

---

## 9. 버전 이력

| 버전 | 날짜       | 변경 내용                |
| ---- | ---------- | ------------------------ |
| 1.0  | 2024.12.25 | 현재 구현 기준 최초 작성 |

---

## 관련 문서

| 문서              | 설명                      |
| ----------------- | ------------------------- |
| `ARCHITECTURE.md` | 프로젝트 아키텍처         |
| `EDITOR_SPEC.md`  | 에디터 기능 명세          |
| `SPEC.md`         | 전체 기능 명세            |
| `src/types/`      | TypeScript 타입 정의 파일 |
