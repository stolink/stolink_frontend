# Git 브랜치 관리 및 협업 전략 (3-Layer Strategy)

이 프로젝트는 안정적인 배포와 효율적인 기능 통합을 위해 **"3-Layer 브랜치 전략"**을 따릅니다.

---

## 1. 브랜치 계층 구조 (3-Layer)

### Layer 1: 영구 브랜치 (Permanent)

- **`main`**: 상용(Production) 서버에 배포되는 최상위 신뢰 브랜치입니다.
- **`develop`**: 모든 개발 작업이 통합되는 기준 브랜치입니다. 스테이징 환경 배포의 기준이 됩니다.

### Layer 2: 카테고리 (Category)

- 브랜치 이름의 접두어로만 사용하며, 독립적인 브랜치로 생성하지 않습니다.
  - `feature/`: 신규 기능 개발
  - `fix/`: 버그 수정
  - `refactor/`: 코드 개선 및 최적화
  - `hotfix/`: 운영 환경용 긴급 수정

### Layer 3: 상세 작업 (Detail)

- 실제 개발 활동이 일어나는 작업 브랜치입니다.
  - 예: `feature/editor/mention`, `fix/ui/button-alignment`

---

## 2. 3대 핵심 머지 원칙

프로젝트의 역사를 깔끔하게 유지하기 위해 아래 원칙을 반드시 준수합니다.

### ① Squash and Merge (`feature` → `develop`)

- 자잘한 커밋 이력들을 하나로 뭉쳐서 `develop`에 병합합니다.
- 목적: `develop`의 히스토리를 기능 단위로 깔끔하게 유지.

### ② Non-Fast-Forward (`develop` → `main`)

- 릴리즈 시 반드시 `git merge develop --no-ff`를 사용합니다.
- 목적: "이 시점에 특정 버전이 배포되었다"는 병합 지점(Merge Point)을 명시적으로 기록.

### ③ Hotfix Back-porting (`hotfix` → both)

- 운영 서버(`main`) 수정을 리포팅한 후, 해당 내용을 반드시 `develop`에도 즉시 병합해야 합니다.
- 목적: `main`과 `develop` 사이의 코드 괴리 방지 및 향후 머지 충돌 예방.

---

## 3. 워크플로우 가이드 (Antigravity 전용)

개발자는 별도의 복잡한 명령어를 외울 필요 없이 통합된 커맨드를 사용합니다.

- **`/smart-commit`**: 현재 작업을 분석하여 커밋하고, 원격에 푸시하며, 필요 시 PR을 자동으로 생성하거나 최신화합니다.
  - `hotfix/*` 브랜치는 자동으로 `main`을 타겟팅합니다.
  - 그 외는 `develop`을 타겟으로 PR을 생성합니다.

---

## 4. 커밋 컨벤션 (Conventional Commits)

문서의 일관성을 위해 `CLAUDE.md`에 명시된 규칙을 따릅니다.

- 형식: `<type>(scope): <description>`
- 타입: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `hotfix`
