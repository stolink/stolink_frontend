---
description: 변경사항 분석, 커밋, 푸시 후 PR 상태를 확인하여 생성하거나 최신화합니다.
---

> **참고:** 커밋 컨벤션은 `CLAUDE.md`를 따릅니다.
> **언어:** 모든 결과 보고 및 PR 본문은 **한글**로 작성합니다.

// turbo-all

1.  **현재 상태 및 변경사항 확인**:
    - 현재 브랜치명 확인: `git rev-parse --abbrev-ref HEAD`
    - `git status` 실행하여 변경된 파일 확인 후 `git add .` 실행 (필요 시)
    - `git diff --staged --stat` 실행하여 변경 요약 확인

2.  **커밋 메시지 생성 및 실행**:
    - `git diff --staged` 분석 후 Conventional Commit 메시지 생성
    - 타입: feat, fix, docs, style, refactor, test, chore, **hotfix**
    - `git commit -m "<생성된_메시지>"` 실행

3.  **푸시 및 PR 상태 체크**:
    - `git push origin <현재_브랜치>` 실행
    - **PR 존재 확인**: `gh pr view --json url,state --jq 'select(.state == "OPEN") | .url'` 실행

4.  **PR 생성 또는 최신화 (Full Management)**:
    _PR의 존재 여부와 상관없이 항상 최신 커밋 이력을 반영하여 본문을 업데이트합니다._
    - **Target Branch 결정**: `hotfix/*`는 `main`, 그 외는 `develop`
    - **통합 분석**: 기준 브랜치 대비 전체 변경 내용(`git log develop..HEAD` / `git diff develop..HEAD`) 분석
    - **PR 본문 생성**: `.pr_body_temp.md` 파일에 변경 사항, 파일 목록, 머지 가이드라인(Squash for develop, --no-ff for main) 작성

    **A. PR이 없는 경우 (신규 생성)**:

    ```bash
    GH_EDITOR=true gh pr create \
      --title "<종합된 변경 제목>" \
      --body-file .pr_body_temp.md \
      --base <타겟_브랜치>
    ```

    **B. PR이 이미 있는 경우 (업데이트)**:

    ```bash
    GH_EDITOR=true gh pr edit \
      --title "<종합된 변경 제목>" \
      --body-file .pr_body_temp.md
    ```

    - **정리**: `rm .pr_body_temp.md`

5.  **최종 보고**:
    - 커밋 메시지 안내
    - PR URL 안내
