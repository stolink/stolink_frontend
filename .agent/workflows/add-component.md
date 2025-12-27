---
description: 새 React 컴포넌트를 생성합니다 (shadcn/ui 스타일)
---

# /add-component 워크플로우

새 컴포넌트를 생성할 때 사용합니다. shadcn/ui 스타일과 프로젝트 컨벤션을 준수합니다.

## 사용법

```
/add-component ComponentName [directory]
```

- `ComponentName`: PascalCase 컴포넌트 이름 (예: `UserProfile`)
- `directory`: 선택사항, 기본값은 `src/components/` (예: `ui`, `editor`, `common`)

---

## 워크플로우 단계

### 1. 경로 결정

```bash
# 기본 경로
TARGET_DIR="src/components/${directory:-common}"
COMPONENT_FILE="$TARGET_DIR/${ComponentName}.tsx"
```

### 2. 컴포넌트 파일 생성

// turbo

```tsx
// src/components/{directory}/{ComponentName}.tsx
import { cn } from "@/lib/utils";

interface ${ComponentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${ComponentName}({ className, children }: ${ComponentName}Props) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
```

### 3. barrel export 확인/추가

// turbo

`index.ts`가 있으면 export 추가:

```ts
export * from "./${ComponentName}";
```

---

## 체크리스트

- [ ] Props 인터페이스 정의
- [ ] `cn()` 유틸리티 사용
- [ ] className prop 지원
- [ ] 기본 export는 named export 사용

---

## 예시

```
/add-component UserAvatar common
```

생성 결과:

- `src/components/common/UserAvatar.tsx`
- `src/components/common/index.ts` 업데이트
