# PR #69 AI Review 수정

## Issue Description

PR #69에서 AI 코드 리뷰가 2가지 이슈를 발견했습니다.

### 🔴 치명적: 불안전한 타입 가드 (src/hooks/useShare.ts:29-31)

- 에러: `error as { response?: { status?: number } }` 캐스팅으로 타입 검증 우회
- 실제로 Axios 에러인지 보장되지 않음

### ⚠️ 경고: 캐시 전략 불일치 (src/hooks/useShare.ts:75)

- 에러: `setQueryData`로 즉시 null 설정 시, 삭제 실패해도 캐시가 null로 유지
- 사용자는 성공한 것으로 오인

## Solution Strategy

### 변경 전 (타입 가드)

```typescript
if (error && typeof error === "object" && "response" in error) {
  const axiosError = error as { response?: { status?: number } };
  if (axiosError.response?.status === 404) {
    return null;
  }
}
```

### 변경 후 (타입 가드)

```typescript
if (axios.isAxiosError(error) && error.response?.status === 404) {
  return null;
}
```

### 변경 전 (캐시 전략)

```typescript
onSuccess: (_data, projectId) => {
  queryClient.setQueryData(shareKeys.settings(projectId), null);
},
```

### 변경 후 (캐시 전략)

```typescript
onSuccess: (_data, projectId) => {
  queryClient.setQueryData(shareKeys.settings(projectId), null);
},
onError: (_error, projectId) => {
  queryClient.invalidateQueries({
    queryKey: shareKeys.settings(projectId),
  });
},
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공
- **검증 방법**: TypeScript 컴파일 및 Vite 번들링 통과
