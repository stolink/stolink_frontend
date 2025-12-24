---
description: 커밋 메시지 자동 생성, 푸시, PR 생성을 수행합니다.
---

> **참고:** 커밋 컨벤션과 브랜치 전략은 `CLAUDE.md`를 따릅니다.
> **언어:** 모든 커밋 메시지와 PR 내용은 **한글**로 작성합니다.

1.  **변경사항 분석**:
    - `git diff --staged` 실행 (스테이징된 파일이 없으면 `git add .` 먼저 실행).
    - 변경 내용을 분석하여 의도 파악 (feat, fix, refactor 등).

2.  **커밋 메시지 생성**:
    - Conventional Commit 형식의 메시지 생성.
    - 형식: `<타입>(<범위>): <한글 설명>`
    - 타입: feat, fix, docs, style, refactor, test, chore, hotfix
    - 예시: `feat(인증): 로그인 재시도 로직 구현`

3.  **커밋 및 푸시**:
    - `git commit -m "생성된_메시지"` 실행
    - 현재 브랜치명 확인: `git rev-parse --abbrev-ref HEAD`
    - `git push origin <현재_브랜치>` 실행

4.  **PR 생성 및 AI 리뷰**:
    - `gh` CLI 사용 가능 시: `gh pr create --title "생성된_메시지" --body "## 변경 사항\n- (변경 내용 한글 요약)\n\n## AI 리뷰\nAI 코드 리뷰가 자동으로 실행됩니다."` 실행.
    - 사용 불가 시: PR 생성 링크 제공: `https://github.com/ssyy3034/sto-link-front/compare/main...<현재_브랜치>?expand=1`
    - **중요**: PR 생성 시 `.github/workflows/ai-review.yml`에 설정된 AI 코드 리뷰어가 자동으로 실행됩니다.
