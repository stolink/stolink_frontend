---
description: 새 커스텀 훅을 생성합니다 (TanStack Query 패턴)
---

# /add-hook 워크플로우

새 커스텀 훅을 생성할 때 사용합니다. TanStack Query 패턴을 준수합니다.

## 사용법

```
/add-hook useXxx [--mutation] [--query]
```

- `useXxx`: use 접두사 + camelCase 훅 이름 (예: `useProjects`)
- `--mutation`: mutation 훅 포함
- `--query`: query 훅 포함 (기본값)

---

## 워크플로우 단계

### 1. 경로 결정

```bash
TARGET_FILE="src/hooks/${hookName}.ts"
```

### 2. Query 훅 템플릿

// turbo

```typescript
// src/hooks/useXxx.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { xxxService } from "@/services/xxxService";

// Query Keys
export const xxxKeys = {
  all: ["xxx"] as const,
  lists: () => [...xxxKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...xxxKeys.lists(), filters] as const,
  details: () => [...xxxKeys.all, "detail"] as const,
  detail: (id: string) => [...xxxKeys.details(), id] as const,
};

/**
 * Fetch xxx list
 */
export function useXxxList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: xxxKeys.lists(),
    queryFn: () => xxxService.getAll(),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch single xxx
 */
export function useXxx(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: xxxKeys.detail(id),
    queryFn: () => xxxService.getById(id),
    enabled: !!id && options?.enabled !== false,
  });
}
```

### 3. Mutation 훅 템플릿 (--mutation)

// turbo

```typescript
/**
 * Create xxx
 */
export function useCreateXxx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateXxxInput) => xxxService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: xxxKeys.lists() });
    },
  });
}

/**
 * Update xxx
 */
export function useUpdateXxx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateXxxInput & { id: string }) =>
      xxxService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: xxxKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: xxxKeys.lists() });
    },
  });
}

/**
 * Delete xxx
 */
export function useDeleteXxx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => xxxService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: xxxKeys.lists() });
    },
  });
}
```

---

## 체크리스트

- [ ] queryKey 상수 정의 (xxxKeys)
- [ ] staleTime 설정
- [ ] enabled 옵션 지원
- [ ] invalidateQueries on mutation success
- [ ] 해당 서비스 파일 존재 확인

---

## 예시

```
/add-hook useItems --mutation
```

생성 결과:

- `src/hooks/useItems.ts` (query + mutation 훅 포함)
