# 트러블슈팅: 테스트 모듈 경로 해결 (Module Resolution)

**날짜:** 2026-01-10
**문제:** IDE 및 테스트 실행 시 `@/test/mocks/server` 모듈을 찾을 수 없는 오류 발생
**원인:** `tsconfig.app.json`이 빌드 최적화를 위해 `src/test` 및 `**/*.test.ts` 파일을 제외(`exclude`)하고 있어, TypeScript 컴파일러가 해당 파일들의 경로 별칭(`@/`)을 인식하지 못함.

---

## 해결 방법

테스트 파일들을 위한 전용 TypeScript 설정 파일(`tsconfig.test.json`)을 생성하고, 루트 설정에 등록하여 IDE와 컴파일러가 테스트 파일의 컨텍스트를 인식하도록 수정했습니다.

### 1. `tsconfig.test.json` 생성

`tsconfig.app.json`을 확장하되, 테스트 파일들을 포함(`include`)하고 제외 설정(`exclude`)을 초기화했습니다.

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### 2. `tsconfig.json` 업데이트

루트 설정 파일의 `references`에 테스트 설정을 추가했습니다.

```diff
   "references": [
     { "path": "./tsconfig.app.json" },
     { "path": "./tsconfig.node.json" },
+    { "path": "./tsconfig.test.json" }
   ]
```

### 3. 추가 수정 사항 (테스트 유틸리티)

`src/test/utils.tsx`에서 발생하는 타입 오류 및 `verbatimModuleSyntax` 관련 린트 오류를 수정했습니다.

- Deprecated `QueryClient` `logger` 옵션 제거
- `import type` 문법 적용

## 결과

- `@/test/mocks/server` 모듈 인식 성공
- `npm run type-check` 실행 시 테스트 파일까지 정상적으로 타입 검사가 수행됨 (현재 발견되는 타입 에러들은 실제 코드 이슈이므로 수정 필요)
