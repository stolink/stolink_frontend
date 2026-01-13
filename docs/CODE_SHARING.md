# 코드 공유 가이드

## 📦 방법 비교

| 방법       | 난이도        | 유지보수     | 추천 상황          |
| ---------- | ------------- | ------------ | ------------------ |
| 직접 복사  | ⭐ 쉬움       | ❌ 어려움    | 프로토타입, 1회성  |
| NPM 패키지 | ⭐⭐ 보통     | ✅ 쉬움      | **현재 상황 권장** |
| Monorepo   | ⭐⭐⭐ 어려움 | ✅ 매우 쉬움 | 대규모 프로젝트    |

---

## 🎯 권장: NPM 패키지

### 빠른 시작

```bash
# 1. 공유 패키지 생성 스크립트 실행
chmod +x scripts/create-shared-package.sh
./scripts/create-shared-package.sh

# 2. 패키지 빌드
cd ../stolink-shared
npm install
npm run build

# 3. stolink_frontend에 설치
cd ../stolink_frontend
npm install ../stolink-shared

# 4. storead_frontend에 설치 (독자 플랫폼)
cd ../../storead_frontend  # 독자 플랫폼 경로로 이동
npm install ../stolink-shared
```

### 사용 방법

**Before** (직접 import):

```tsx
import NetworkGraph from "@/components/graph/NetworkGraph";
```

**After** (공유 패키지):

```tsx
import { NetworkGraph } from "@stolink/shared";
```

---

## 🔄 업데이트 방법

### stolink에서 컴포넌트 수정 시

```bash
# 1. stolink_frontend에서 수정
# src/components/graph/NetworkGraph.tsx 수정

# 2. 공유 패키지로 복사
cp src/components/graph/NetworkGraph.tsx \
   ../stolink-shared/src/components/graph/

# 3. 패키지 재빌드
cd ../stolink-shared
npm run build

# 4. 버전 업데이트 (선택)
npm version patch

# 5. 각 프로젝트에서 업데이트 (선택)
cd ../stolink_frontend && npm update @stolink/shared
cd ../storead_frontend && npm update @stolink/shared
```

---

## 🚀 대안: Git Submodule (추가 옵션)

공유 컴포넌트를 별도 Git 레포로 관리하고 싶다면:

```bash
# 1. 공유 레포 생성
git init stolink-shared-components

# 2. stolink_frontend에 추가
cd stolink_frontend
git submodule add ../stolink-shared-components shared

# 3. storead_frontend에 추가
cd storead_frontend
git submodule add ../stolink-shared-components shared
```

**장점**: Git으로 버전 관리  
**단점**: 서브모듈 관리 복잡

---

## 💡 실전 팁

1. **처음에는 복사로 시작**
   - 빠르게 프로토타입 만들기
   - 동작 확인

2. **안정화되면 NPM 패키지로 전환**
   - 반복 작업 줄이기
   - 일관성 보장

3. **장기적으로 Monorepo 고려**
   - 프로젝트가 5개 이상 될 때
   - 전문 DevOps 있을 때
