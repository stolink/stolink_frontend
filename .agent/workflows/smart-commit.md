---
description: 변경사항을 분석하여 Conventional Commit 메시지를 자동 생성하고 커밋합니다.
---

> **참고:** 커밋 컨벤션은 `CLAUDE.md`를 따릅니다.
> **언어:** 모든 커밋 메시지는 **한글**로 작성합니다.

// turbo-all

1.  **변경사항 확인**:
    - `git status` 실행하여 변경된 파일 확인
    - 스테이징된 파일이 없으면 `git add .` 먼저 실행
    - `git diff --staged --stat` 실행하여 변경 요약 확인

2.  **변경 내용 분석**:
    - `git diff --staged` 실행하여 상세 변경 내용 확인
    - 변경의 의도 파악 (feat, fix, refactor 등)

3.  **커밋 메시지 생성**:
    - Conventional Commit 형식으로 메시지 생성
    - 형식: `<타입>(<범위>): <한글 설명>`
    - 타입: feat, fix, docs, style, refactor, test, chore, hotfix
    - 예시: `feat(editor): 하단 섹션 스트립 추가`

4.  **커밋 실행**:
    - `git commit -m "생성된_메시지"` 실행
    - 커밋 완료 후 `git log -1 --oneline` 으로 확인

5.  **푸시 (선택)**:
    - 현재 브랜치명 확인: `git rev-parse --abbrev-ref HEAD`
    - `git push origin <현재_브랜치>` 실행

> **참고**: PR 생성은 `/pr` 워크플로우를 사용하세요.
