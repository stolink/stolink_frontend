---
description: 새 API 서비스를 생성합니다 (service + hook + type 세트)
---

# /add-service 워크플로우

새 API 도메인을 추가할 때 사용합니다. 서비스, 훅, 타입을 한 번에 생성합니다.

## 사용법

```
/add-service EntityName
```

- `EntityName`: PascalCase 엔티티 이름 (예: `Bookmark`, `Comment`)

---

## 워크플로우 단계

### 1. 파일 경로

```bash
SERVICE_FILE="src/services/${entityName}Service.ts"
HOOK_FILE="src/hooks/use${EntityName}s.ts"
TYPE_FILE="src/types/${entityName}.ts"
```

### 2. 타입 파일 생성

// turbo

```typescript
// src/types/{entityName}.ts

export interface ${EntityName} {
  id: string;
  projectId: string;
  // TODO: Add entity-specific fields
  createdAt: string;
  updatedAt: string;
}

export interface Create${EntityName}Input {
  projectId: string;
  // TODO: Add required creation fields
}

export interface Update${EntityName}Input {
  // TODO: Add updatable fields
}
```

### 3. 서비스 파일 생성

// turbo

```typescript
// src/services/${entityName}Service.ts
import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { ${EntityName}, Create${EntityName}Input, Update${EntityName}Input } from "@/types/${entityName}";

const BASE_URL = "/api";

export const ${entityName}Service = {
  getAll: async (projectId: string): Promise<ApiResponse<${EntityName}[]>> => {
    const response = await api.get(`${BASE_URL}/projects/${projectId}/${entityName}s`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<${EntityName}>> => {
    const response = await api.get(`${BASE_URL}/${entityName}s/${id}`);
    return response.data;
  },

  create: async (payload: Create${EntityName}Input): Promise<ApiResponse<${EntityName}>> => {
    const response = await api.post(
      `${BASE_URL}/projects/${payload.projectId}/${entityName}s`,
      payload
    );
    return response.data;
  },

  update: async (id: string, payload: Update${EntityName}Input): Promise<ApiResponse<${EntityName}>> => {
    const response = await api.patch(`${BASE_URL}/${entityName}s/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`${BASE_URL}/${entityName}s/${id}`);
    return response.data;
  },
};
```

### 4. 훅 파일 생성

`/add-hook use${EntityName}s --mutation` 워크플로우 실행

---

## 체크리스트

- [ ] 타입 파일에 필수 필드 정의
- [ ] 서비스 엔드포인트가 API_SPEC.md와 일치하는지 확인
- [ ] 훅에서 queryKey 상수 정의
- [ ] barrel export 추가 (index.ts)

---

## 예시

```
/add-service Bookmark
```

생성 결과:

- `src/types/bookmark.ts`
- `src/services/bookmarkService.ts`
- `src/hooks/useBookmarks.ts`
