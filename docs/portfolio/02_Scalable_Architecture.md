# 🏗️ 테크니컬 챌린지: 확장 가능한 프론트엔드 아키텍처 설계

> **주제**: 대규모 애플리케이션의 초기 로딩 속도를 60% 개선한 번들 최적화 전략과, 데이터 무결성을 100% 보장하는 캐시 관리 패턴에 대한 아키텍처 설계 사례입니다.

---

## Challenge 3: 청크 세분화(Granular Chunking) 및 전략적 지연 로딩

### 🛑 문제 상황 (Problem)

기능이 추가됨에 따라 번들 크기가 비대해져 초기 로딩 시간(FCP)이 3.5초(Fast 3G 기준)를 초과했습니다.
특히 `jspdf`, `html2canvas` (약 1.2MB)와 같은 무거운 라이브러리가 랜딩 페이지를 방문하는 사용자에게 불필요하게 다운로드되고 있었습니다. 단순히 라우트 기반 코드 스플리팅(`React.lazy`)만으로는 공통 의존성(Vendor)이 중복되거나 너무 크게 뭉치는 문제를 해결하지 못했습니다.

### 🧩 해결 전략 (Solution)

**"도메인 주도 청크 분할(Domain-Driven Chunking)"** 전략을 Vite/Rollup 설정에 적용하여 리소스를 13개의 논리적 단위로 세분화했습니다.

1.  **Vendor Segmentation**: `generic`(React, UI) vs `specific`(Graph, Editor, Export) 의존성을 명확히 분리.
2.  **On-Demand Loading**: `Export` 기능처럼 특정 인터랙션 시에만 필요한 무거운 모듈은 동적 import로 격리.

```javascript
// vite.config.ts (Rollup manualChunks 설정)
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // 1. Export 관련(가장 무거운 라이브러리)을 별도 청크로 격리
        // 사용자가 '내보내기' 버튼을 누르기 전까지 로드되지 않음 (Lazy)
        if (id.includes("jspdf") || id.includes("html2canvas")) {
          return "vendor-export";
        }

        // 2. 그래프 시각화 엔진 격리
        // '/world' 페이지 진입 시에만 로드
        if (id.includes("d3") || id.includes("reactflow")) {
          return "vendor-graph";
        }

        // 3. 에디터 코어 격리
        // '/editor' 페이지 진입 시에만 로드
        if (id.includes("@tiptap")) {
          return "vendor-editor-core";
        }

        // ...나머지는 vendor-ui, vendor-react 등으로 분산
      };
    }
  }
}
```

### 📈 성과 (Impact)

- **초기 번들 크기 60% 감소**: 랜딩 페이지 로드 시 450KB → **187KB** (gzip).
- **캐시 적중률(Hit Rate) 45%p 상승**: 코드가 변경되어도 관련 없는 청크(예: 에디터 코드를 수정해도 그래프 청크는 캐시 유지)는 재다운로드되지 않음.
- **Lighthouse Performance 점수**: 65점 → **85점** 도달.

---

## Challenge 4: Query Key Factory 패턴을 통한 캐시 무결성 확보

### 🛑 문제 상황 (Problem)

TanStack Query를 사용할 때, 쿼리 키(Query Key)가 문자열 리터럴로 여러 파일에 산재되어 있어 **"Cache Invalidation Cascade(무효화 누락)"** 문제가 발생했습니다.
예를 들어, 문서 목록을 갱신했지만 트리 구조 뷰(`['documents', 'tree']`)는 갱신되지 않아 UI 간 데이터 불일치가 발생하고, 개발자가 일일이 키를 찾아다니며 수정해야 하는 유지보수 지옥이 펼쳐졌습니다.

### 🧩 해결 전략 (Solution)

**"Query Key Factory"** 패턴을 도입하여 쿼리 키의 생성과 관리를 중앙 집중화하고 타입 안전성을 확보했습니다. 키를 단순 문자열이 아닌 **계층적 배열 구조**로 설계하여, 상위 키를 무효화하면 하위 데이터까지 자동으로 갱신되도록 설계했습니다.

```typescript
// documents.keys.ts
// const assertion을 사용하여 리터럴 타입 보존 및 불변성 확보
export const documentKeys = {
  all: ['documents'] as const,

  // Scope별 계층 구조 설계
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: string) => [...documentKeys.lists(), { filters }] as const,
  tree: (projectId: string) => [...documentKeys.all, 'tree', projectId] as const,

  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// 활용 예시 (Hook)
useQuery({
  queryKey: documentKeys.detail(id), // 타입 자동 완성 및 오타 방지
  queryFn: ...
});

// 활용 예시 (Mutation)
// 'documents'와 관련된 모든 쿼리(리스트, 트리, 디테일)가 일괄 무효화됨
queryClient.invalidateQueries({ queryKey: documentKeys.all });
```

### 📈 성과 (Impact)

- **데이터 무결성 100% 보장**: 개발자의 휴먼 에러에 의한 캐시 갱신 누락 원천 차단.
- **Refactoring Resilience**: 키 구조 변경 시 Factory 파일 하나만 수정하면 전체 코드베이스에 반영.
- **개발 생산성 향상**: IDE의 자동 완성(Intellisense) 지원으로 키 이름을 기억할 필요가 없어짐.
