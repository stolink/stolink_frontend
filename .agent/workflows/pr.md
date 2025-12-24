---
description: main 브랜치 대비 모든 커밋을 분석하여 PR을 생성하거나 업데이트합니다.
---

> **언어:** 모든 PR 내용은 **한글**로 작성합니다.

// turbo-all

1.  **현재 상태 확인**:
    - `git rev-parse --abbrev-ref HEAD` 실행하여 현재 브랜치 확인
    - main 브랜치인 경우 중단하고 feature 브랜치에서 실행하라고 안내

2.  **커밋 히스토리 분석**:
    - `git log main..HEAD --oneline` 실행하여 main 이후 모든 커밋 확인
    - `git diff main..HEAD --stat` 실행하여 변경된 파일 요약 확인
    - 각 커밋 메시지와 변경 내용을 종합 분석

3.  **PR 상태 확인**:
    - `gh pr view --json state,title,body` 실행
    - PR 존재 여부 및 상태 확인

4.  **PR 생성 또는 업데이트**:

    **새 PR 생성 (PR이 없거나 MERGED/CLOSED인 경우)**:

    ```
    gh pr create \
      --title "<종합된 변경 제목>" \
      --body "## 변경 사항

    <커밋들을 분석하여 주요 변경사항 bullet point로 정리>

    ## 변경된 파일
    <주요 파일 목록>

    ## AI 리뷰
    AI 코드 리뷰가 자동으로 실행됩니다."
    ```

    **기존 PR 업데이트 (OPEN 상태인 경우)**:

    ```
    gh pr edit --title "<업데이트된 제목>" --body "<업데이트된 본문>"
    ```

5.  **결과 안내**:
    - PR URL 표시
    - `gh pr view --web` 으로 브라우저에서 열기 제안
