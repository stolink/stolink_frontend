# API Reference

> **AI 참조용**: API 엔드포인트 및 요청/응답 형식 참조하세요.

## 핵심 API 엔드포인트

| 도메인        | GET                                | POST                                 | PATCH                    | DELETE                   |
| ------------- | ---------------------------------- | ------------------------------------ | ------------------------ | ------------------------ |
| Auth          | `/api/auth/me`                     | `/api/auth/login`, `/register`       | `/api/auth/me`           | -                        |
| Projects      | `/api/projects`                    | `/api/projects`                      | `/api/projects/:id`      | `/api/projects/:id`      |
| Documents     | `/api/projects/:pid/documents`     | ←                                    | `/api/documents/:id`     | `/api/documents/:id`     |
| Characters    | `/api/projects/:pid/characters`    | ←                                    | `/api/characters/:id`    | `/api/characters/:id`    |
| Relationships | `/api/projects/:pid/relationships` | `/api/relationships`                 | `/api/relationships/:id` | `/api/relationships/:id` |
| Foreshadowing | `/api/projects/:pid/foreshadowing` | ←                                    | `/api/foreshadowing/:id` | `/api/foreshadowing/:id` |
| Places        | `/api/projects/:pid/places`        | ←                                    | `/api/places/:id`        | `/api/places/:id`        |
| Items         | `/api/projects/:pid/items`         | ←                                    | `/api/items/:id`         | `/api/items/:id`         |
| AI            | -                                  | `/api/ai/chat`, `/consistency-check` | -                        | -                        |
| Export        | `/api/exports/:jobId`              | `/api/projects/:id/export`           | -                        | -                        |

> 📡 **상세 명세**: [docs/spec/API_SPEC.md](../docs/spec/API_SPEC.md)

---

## 공통 응답 형식

모든 API는 다음 형식으로 응답:

```typescript
interface ApiResponse<T> {
  code: number; // HTTP 상태 코드
  status: string; // "OK" | "ERROR"
  message: string; // 메시지
  data: T; // 실제 데이터
}
```

---

## 인증 흐름

### 현재 방식 (개발)

- 헤더: `X-User-Id: {userId}`
- 프로덕션에서는 JWT 토큰 기반으로 전환 예정

### Refresh Token

- `/api/auth/refresh` 엔드포인트
- axios 인터셉터에서 자동 갱신
- 401 Unauthorized 시 자동 리프레시 시도

---

## SSE (Server-Sent Events)

### 이벤트 타입

| 이벤트               | 용도            | Payload                  |
| -------------------- | --------------- | ------------------------ |
| `ANALYSIS_STARTED`   | AI 분석 시작    | `{ analysisId }`         |
| `ANALYSIS_PROGRESS`  | 진행률 업데이트 | `{ progress: 0-100 }`    |
| `ANALYSIS_COMPLETED` | 분석 완료       | `{ analysisId, result }` |
| `ANALYSIS_FAILED`    | 분석 실패       | `{ error }`              |

### 연결 관리

- `src/hooks/useProjectSSE.ts`에서 관리
- 프로젝트 ID당 하나의 SSE 연결
- 컴포넌트 언마운트 시 자동 종료

---

## Job Polling Pattern

비동기 작업 (Export, AI Analysis) 처리:

```typescript
interface JobResponse {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "FAILED";
  progress?: number;
  result?: any;
  error?: string;
}
```

**사용 훅**: `useJobPolling.ts`

- 자동 폴링 (1초 간격)
- 완료/실패 시 자동 중단
- 취소 가능

---

## 에러 응답 구조

```typescript
{
  "code": 400,
  "status": "ERROR",
  "message": "Invalid request",
  "data": null
}
```

**주요 상태 코드**:

- `400`: Bad Request
- `401`: Unauthorized (인증 필요)
- `403`: Forbidden (권한 없음)
- `404`: Not Found
- `500`: Internal Server Error

---

## TanStack Query 캐시 전략

### queryKey 구조

```typescript
// 문서 목록
["documents", projectId][
  // 단일 문서
  ("document", documentId)
][
  // 캐릭터 목록
  ("characters", projectId)
][
  // 관계 목록
  ("relationships", projectId)
];
```

### 캐시 무효화 패턴

```typescript
// Mutation onSuccess에서 invalidateQueries
useMutation({
  mutationFn: updateDocument,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
    queryClient.invalidateQueries({ queryKey: ["document", documentId] });
  },
});
```

### staleTime 권장값

- **문서 내용**: `0` (항상 최신 유지)
- **프로젝트 목록**: `30000` (30초)
- **캐릭터/설정**: `60000` (1분)
- **통계**: `300000` (5분)
