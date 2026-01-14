# 📂 StoLink Technical Challenges Portfolio

> **개요**: StoLink 프로젝트를 개발하며 직면했던 핵심적인 기술적 난제들과 이를 해결한 엔지니어링 솔루션을 5가지 핵심 주제로 정리한 포트폴리오 문서입니다.
> **문서 위치**: `docs/portfolio/`

---

## 📚 목차 (Index)

### 1. [고성능 그래프 시각화 엔진 최적화](./01_Graph_Engine_Performance.md)

- **Challenge 1**: 물리 엔진(D3 Force) 프레임 예산 최적화 (Hybrid Tick Scheduling)
- **Challenge 2**: React(선언형) vs D3(명령형) 생명주기 동기화 및 Race Condition 해결

### 2. [확장 가능한 프론트엔드 아키텍처 설계](./02_Scalable_Architecture.md)

- **Challenge 3**: 번들 크기 60% 감소를 위한 청크 세분화 및 도메인 주도 지연 로딩
- **Challenge 4**: 데이터 무결성을 위한 Query Key Factory 패턴 및 캐시 관리 전략

### 3. [에디터 안정성 및 자료구조 최적화](./03_Editor_and_Algorithms.md)

- **Challenge 5**: useRef 패턴을 이용한 Rich Text Editor 인스턴스 재생성 방지
- **Challenge 6**: 대규모 트리 구조(Recursive Tree) 변환 알고리즘의 O(n log n) 메모이제이션

### 4. [보안 아키텍처 및 런타임 안정성](./04_Security_and_Stability.md)

- **Challenge 7**: 사용자 생성 콘텐츠(UGC)를 위한 Zero-Trust XSS 방어 아키텍처
- **Challenge 8**: `axios.isAxiosError` 및 타입 가드를 활용한 런타임 API 계약 검증

### 5. [고성능 그래픽스 및 UX 엔지니어링](./05_UX_and_Graphics.md)

- **Challenge 9**: SVG 필터 파이프라인 최적화 및 좌표계 무결성 가드(Integrity Guard)
- **Challenge 10**: 비동기 데이터 변이(Mutation)와 UI 동기화를 위한 Invalidation Chaining

### 6. [렌더링 엔진 교체 (SVG → Canvas)](./06_Rendering_Migration.md)

- **Challenge 11**: 30 Node 한계를 500+ Node로 확장한 렌더링 엔진 교체 (Capacity 16x)

---

## 🎯 핵심 역량 요약 (Core Competencies)

이 문서들은 다음과 같은 핵심 엔지니어링 역량을 증명합니다:

1.  **Performance Tuning**: 프레임 드랍, 로딩 속도, 메모리 누수를 정량적으로 분석하고 해결하는 능력.
2.  **Architecture Design**: 단순 기능 구현을 넘어, 유지보수성과 확장성을 고려한 시스템 설계 능력.
3.  **Problem Solving**: 라이브러리 간 충돌, 보안 위협 등 복잡한 문제를 근본 원인(Root Cause)부터 해결하는 능력.
4.  **Quality Engineering**: 타입 안전성, 테스트 커버리지, 에러 처리를 통해 견고한 소프트웨어를 만드는 능력.
