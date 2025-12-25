---
description: 변경사항 분석, 커밋, 푸시 후 PR 상태를 확인하여 생성하거나 최신화합니다.
---

> **참고:** 커밋 컨벤션은 `CLAUDE.md`를 따릅니다.
> **언어:** 모든 결과 보고 및 PR 본문은 **한글**로 작성합니다.

// turbo-all

1.  **현재 상태 및 변경사항 확인**:
    - 현재 브랜치명 확인: `CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)`
    - `git status` 및 `git add .` (필요 시) 수행
    - 스테이징된 변경사항이 있는지 확인

2.  **조건부 커밋 및 푸시**:
    - **변경사항이 있는 경우**:
      - `git diff --staged` 분석 후 Conventional Commit 메시지 생성 및 실행
      - `git push origin $CURRENT_BRANCH` 실행
    - **변경사항이 없는 경우**:
      - "커밋할 내용이 없습니다. PR 상태 체크로 넘어갑니다." 안내 후 바로 다음 단계 진행

3.  **PR 상태 체크 및 타겟 결정**:
    - **Target Branch 결정**:
      - `hotfix/*` 브랜치인 경우 -> `main`
      - 그 외 모든 경우 (`feature/*`, `develop` 본체 등) -> **`develop`** (기본)
    - **PR 존재 확인**: `gh pr view --json url,state --jq 'select(.state == "OPEN") | .url'` 실행

4.  **PR 생성 또는 최신화 (Idempotent Management)**:
    - **로컬 vs 원격 비교**: `git fetch origin` 후 `git log origin/$TARGET_BRANCH..$CURRENT_BRANCH`를 통해 PR에 포함될 전체 변경 내역 분석
    - **분석 결과가 비어있는 경우**: "원격 기준 브랜치 대비 새로운 커밋이 없습니다." 보고 후 종료 가능 (단, PR 제목/본문 최신화가 필요하다면 진행)
    - **PR 본문 생성**: `.pr_body_temp.md` 파일에 변경 사항, 파일 목록, 머지 가이드라인 작성

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
    - 수행된 작업 (커밋 여부, 푸시 여부)
    - PR URL 안내 (신규 생성 또는 기존 PR 확인)
