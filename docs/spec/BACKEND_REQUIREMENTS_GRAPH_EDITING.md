# Backend Requirements: Graph Editing API

> **작성일**: 2026-01-14 | **프론트엔드 담당 기능**: Advanced Graph Editing v2.0

---

## 현재 API 상태

### ✅ 이미 구현된 엔드포인트 (확인 필요)

| Method   | Endpoint                 | 설명                         | 프론트엔드 서비스              |
| -------- | ------------------------ | ---------------------------- | ------------------------------ |
| `POST`   | `/api/relationships`     | 새 관계 생성                 | `relationshipService.create()` |
| `PATCH`  | `/api/relationships/:id` | 관계 수정 (타입, 강도, 설명) | `relationshipService.update()` |
| `DELETE` | `/api/relationships/:id` | 관계 삭제                    | `relationshipService.delete()` |

---

## 확인/구현 필요 사항

### 1. POST /api/relationships (관계 생성)

**Request Body**:

```json
{
  "sourceId": "character_id_1",
  "targetId": "character_id_2",
  "types": ["ALLY"],
  "strength": 7,
  "bidirectional": true,
  "description": "어린 시절부터 함께 자란 친구"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "rel_...",
    "sourceId": "character_id_1",
    "targetId": "character_id_2",
    "types": ["ALLY"],
    "strength": 7,
    "bidirectional": true,
    "description": "어린 시절부터 함께 자란 친구"
  }
}
```

> [!IMPORTANT]
> **확인 필요**: `bidirectional: true`일 때 역방향 관계도 자동 생성되는지?

---

### 2. PATCH /api/relationships/:id (관계 수정)

**Request Body** (Partial):

```json
{
  "types": ["RIVAL"],
  "strength": 8,
  "description": "갈등이 심화됨"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "rel_...",
    "sourceId": "...",
    "targetId": "...",
    "types": ["RIVAL"],
    "strength": 8,
    "description": "갈등이 심화됨"
  }
}
```

---

### 3. DELETE /api/relationships/:id (관계 삭제)

**Expected Response**:

```json
{
  "success": true,
  "data": null
}
```

> [!WARNING]
> **확인 필요**: 양방향 관계의 경우 한쪽만 삭제되는지, 양쪽 모두 삭제되는지?

---

## 관계 타입 (RelationType)

프론트엔드에서 사용하는 관계 타입 목록:

```typescript
type RelationType =
  | "ALLY" // 동맹
  | "RIVAL" // 라이벌
  | "NEUTRAL" // 중립
  | "ROMANTIC" // 연인
  | "ENEMY" // 적대
  | "MENTOR" // 멘토
  | "FAMILY" // 가족
  | "MASTER_SERVANT" // 주종
  | "COWORKER" // 동료
  | "COMPLEX"; // 복합
```

---

## 데이터 동기화

관계 생성/수정/삭제 후 프론트엔드는 다음을 호출합니다:

```typescript
queryClient.invalidateQueries({
  queryKey: characterKeys.list(projectId),
});
```

이는 `GET /api/projects/:projectId/characters` 를 재호출하여 최신 관계 데이터를 가져옵니다.

> [!NOTE]
> 관계 데이터가 `Character.relationships` 배열에 embedded되어 있다고 가정합니다.

---

## 테스트 시나리오

| #   | 시나리오            | 예상 결과                         |
| --- | ------------------- | --------------------------------- |
| 1   | 관계 생성 (양방향)  | 두 캐릭터 모두에서 관계 확인 가능 |
| 2   | 관계 타입 변경      | 그래프에서 링크 색상 변경         |
| 3   | 관계 삭제           | 그래프에서 링크 제거              |
| 4   | 중복 관계 생성 시도 | 적절한 에러 메시지 반환           |

---

## 프론트엔드 구현 완료 항목

- ✅ `RelationshipEditDialog` - 수정/삭제 UI
- ✅ `RelationshipCreateDialog` - 생성 UI
- ✅ `useCreateRelationship` hook
- ✅ `useUpdateRelationship` hook
- ✅ `useDeleteRelationship` hook
- ✅ Connection Mode (노드 선택 UX)
