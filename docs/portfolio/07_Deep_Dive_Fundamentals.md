# 🧠 테크니컬 딥다이브: 프론트엔드 코어 & 아키텍처

> **주제**: "단순히 라이브러리를 사용하는 것을 넘어, **자바스크립트 동작 원리(Event Loop)**와 **웹 생태계(Bundling, CSR)**를 깊이 이해하고 설계했는가?"에 대한 답변입니다. 현업에서 요구하는 **Core Fundamentals**를 이 프로젝트에 어떻게 녹여냈는지 증명합니다.

---

## 1. Event Loop & Non-Blocking Architecture

> **Requirement**: 자바스크립트는 싱글 스레드 언어입니다. 무거운 연산이 메인 스레드를 점유할 때 발생하는 문제와 해결책을 설명할 수 있습니까?

### 🎯 Project Case: D3.js 하이브리드 스케줄링

StoLink의 캐릭터 관계도(Graph)는 1,000개 이상의 노드에 대한 물리 연산(`forceSimulation`)을 수행합니다. 초기 구현에서는 매 프레임(16ms)마다 $O(N^2)$ 복잡도의 연산이 실행되어 **UI 블로킹(Typing Lag)**이 발생했습니다.

**해결책: Task Splitting & Scheduling**
이벤트 루프의 **Call Stack**이 비워져야 **Render Queue**가 동작한다는 원리를 이용하여, 무거운 연산을 프레임 단위로 분산시켰습니다.

1.  **Critical Task**: 노드 위치 업데이트 (매 프레임 실행)
2.  **Deferred Task**: 그룹(Hull) 영역 계산 (3 프레임마다, `requestAnimationFrame`을 통해 실행)

```typescript
// Main Thread Blocking 방지 패턴
simulation.on("tick", () => {
  updateNodes(); // Light Task

  if (frameCount % 3 === 0) {
    // Heavy Task: 이벤트 루프의 틱을 분산시켜 Janky Frame 방지
    requestIdleCallback(() => updateGroupClouds());
  }
});
```

---

## 2. Bundling & Module System

> **Requirement**: 번들링 전후의 차이와, 트랜스파일링/폴리필의 목적을 이해하고 최적화할 수 있습니까?

### 🎯 Project Case: Domain-Driven Chunking (Vite/Rollup)

일반적인 `React.lazy`를 넘어, **"비즈니스 도메인"**에 기반하여 번들 전략을 수립했습니다. 단순히 파일을 쪼개는 것이 아니라, 사용자의 **진입 시점**과 **기능 사용 빈도**를 분석하여 의존성 그래프를 재구성했습니다.

- **Problem**: `jspdf`, `html2canvas` 등 무거운 라이브러리가 메인 번들(`index.js`)에 포함되어 초기 로딩(TBT) 저하.
- **Solution**: Rollup `manualChunks` 설정을 통해 의존성을 논리적 그룹으로 격리.

| Chunk Name      | 포함 라이브러리    | 로딩 시점               | 전략적 의도                                         |
| :-------------- | :----------------- | :---------------------- | :-------------------------------------------------- |
| `vendor-react`  | React, DOM         | FCP (즉시)              | 코어 프레임워크                                     |
| `vendor-graph`  | D3, ReactFlow      | `/world` 진입 시        | 특정 페이지 전용 거대 라이브러리 격리               |
| `vendor-export` | jsPDF, html2canvas | '내보내기' 버튼 클릭 시 | 사용 빈도가 낮은 무거운 기능을 **On-Demand**로 지연 |

이 설정을 통해 **초기 번들 사이즈를 450KB → 187KB로 60% 감량**했으며, 이는 브라우저가 파싱(Parsing)하고 실행(Execution)해야 할 JS 양을 물리적으로 줄인 성과입니다.

---

## 3. TypeScript Core & Type Safety

> **Requirement**: Generic, Utility Type 등을 활용하여 런타임 에러를 컴파일 타임에 방지할 수 있습니까?

### 🎯 Project Case: Recursive Data Structures & Query Key Factory

StoLink의 문서는 **무한 재귀(Recursive)** 구조를 가집니다. 이를 안전하게 다루기 위해 고급 타입 패턴을 적용했습니다.

**1. Recursive Type Definition**

```typescript
// Scrivener 스타일의 재귀적 문서 구조 정의
export interface DocumentTreeNode {
  id: string;
  children: DocumentTreeNode[]; // 자기 자신을 참조
  type: "folder" | "text";
  // ...
}
```

**2. Template Literal Types & Query Key Factory**
TanStack Query의 키 관리를 위해 TypeScript의 **Template Literal Types**와 **Const Assertions**를 활용하여, 오타를 원천 차단했습니다.

```typescript
// 컴파일 타임에 쿼리 키 구조가 고정됨 (String Literal 아님)
export const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  detail: (id: string) => [...characterKeys.all, "detail", id] as const,
} as const;
```

이 패턴은 개발 편의성(자동완성)뿐만 아니라, 리팩토링 시 **타입 추론**을 통해 영향 범위를 즉시 파악할 수 있게 해줍니다.

---

## 4. CSR vs SSR & Architecture Choice

> **Requirement**: 무조건적인 SSR/Next.js 선호가 아닌, 프로젝트 성격에 맞는 렌더링 방식을 선택할 수 있습니까?

### 🎯 Project Case: Why CSR (SPA) for StoLink?

StoLink는 Next.js(SSR)가 아닌 **React + Vite (CSR)** 아키텍처를 의도적으로 선택했습니다.

**의사결정 배경 (Trade-off Analysis):**

1.  **High Interactivity**: 에디터와 그래프는 초당 수십 번의 인터랙션과 리렌더링이 발생합니다. 서버 왕복(Hydration) 비용보다 클라이언트의 즉각적인 반응성이 중요합니다.
2.  **Data Persistence Model**: 사용자가 작성 중인 글은 로컬(Client) 상태가 우선이며, 서버 동기화는 백그라운드에서 낙관적(Optimistic)으로 이루어집니다. SSR의 장점인 초기 로딩(TTFB)보다 **앱 사용 중의 퍼포먼스**가 핵심 KPI입니다.
3.  **Cost Efficiency**: 정적 파일(S3/CloudFront)로 배포되는 CSR은, WAS(Node.js 서버)가 필요한 SSR보다 운영 비용과 복잡도가 현저히 낮습니다. 스타트업 환경에서 **DevOps 효율성**을 고려한 선택입니다.

> **Conclusion**: SEO가 중요하지 않은(로그인 기반 SaaS) 서비스이자, 데스크탑 애플리케이션에 가까운 UX가 요구되는 프로젝트 특성상 **CSR**이 기술적으로 더 적합함을 논리적으로 입증했습니다.
