---
description: 기존 기능 수정 시 프로젝트 컨텍스트를 빠르게 참조합니다
---

# /fix 워크플로우

버그 수정 또는 기능 개선 시 프로젝트 맥락을 빠르게 파악하고 일관된 수정을 진행합니다.

## 사용법

```
/fix [이슈 설명]
```

예시:

```
/fix 로그아웃 시 랜딩 페이지 대신 로그인 페이지로 이동하는 문제
/fix 캐릭터 관계도에서 노드 클릭이 안 됨
```

---

## 워크플로우 단계

### 1. 컨텍스트 수집

// turbo

```bash
# CLAUDE.md 빠른 참조 (이미 알고 있다면 생략)
view_file CLAUDE.md
```

**확인 항목:**

- `<tech_stack>`: 사용 기술 확인
- `<file_structure>`: 관련 파일 위치 파악
- `<domain_glossary>`: 도메인 용어 이해

### 2. 유사 트러블슈팅 확인

// turbo

```bash
# 과거 이슈 검색
grep_search ".troubles/" [관련 키워드]
cat troubleshooting.md
```

### 3. 관련 코드 분석

// turbo

```bash
# 관련 파일 탐색
grep_search "src/" [관련 함수/컴포넌트명]
view_file [관련 파일]
```

### 4. 수정 계획 수립

수정 전 영향 범위 확인:

- [ ] 해당 파일을 import하는 다른 파일
- [ ] 관련 타입 정의 (src/types/)
- [ ] 관련 훅/서비스 (src/hooks/, src/services/)

### 5. 수정 및 검증

```bash
# 수정 후 타입 체크
npm run type-check

# 린트 확인
npm run lint
```

### 6. 트러블슈팅 문서화 (선택)

중요한 수정이면 `.troubles/YYYY-MM-DD_이슈명.md` 작성

---

## Quick Reference (CLAUDE.md 요약)

| 상태 관리       | 파일 위치                     |
| :-------------- | :---------------------------- |
| 서버 상태       | `src/hooks/` (TanStack Query) |
| 클라이언트 상태 | `src/stores/` (Zustand)       |
| API 호출        | `src/services/`               |
| 타입            | `src/types/`                  |

| 주요 금지 사항                          |
| :-------------------------------------- |
| `any`, `as any` 사용 금지               |
| useQuery 내부에서 Zustand 업데이트 금지 |
| 500줄 이상 단일 파일 지양               |

---

## 체크리스트

- [ ] CLAUDE.md 컨벤션 준수
- [ ] 유사 과거 이슈 확인
- [ ] 타입 에러 없음
- [ ] 린트 에러 없음
