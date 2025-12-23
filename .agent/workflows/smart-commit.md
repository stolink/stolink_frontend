---
description: Automatically generate commit messages, push changes, and guide PR creation.
---

> **참고:** 커밋 컨벤션과 브랜치 전략은 `CLAUDE.md`를 따릅니다.

1.  **Analyze Changes**:
    - Run `git diff --staged` (if nothing staged, run `git add .` first and then diff).
    - Analyze the changes to understand the intent (feat, fix, refactor, etc.).

2.  **Generate Commit Message**:
    - Create a Conventional Commit message based on the analysis.
    - Format: `<type>(<scope>): <description>`
    - Types: feat, fix, docs, style, refactor, test, chore, hotfix
    - Example: `feat(auth): implement login retry logic`

3.  **Commit and Push**:
    - Run `git commit -m "generated_message"`
    - Get current branch name: `git rev-parse --abbrev-ref HEAD`
    - Run `git push origin <current_branch>`

4.  **PR Creation & AI Review**:
    - If `gh` CLI is available, run `gh pr create --title "generated_message" --body "## 변경 사항\n- (AI가 분석한 한글 변경 내용 요약)\n\n## AI 리뷰\n이 PR은 AI 코드 리뷰를 자동 트리거합니다."`.
    - If not, generate a link to create a PR: `https://github.com/ssyy3034/sto-link-front/compare/main...<current_branch>?expand=1`
    - **Important**: Creating a PR will automatically trigger the AI Code Reviewer configured in `.github/workflows/ai-review.yml`.
    - **AI Review Reference**: The reviewer uses `CLAUDE.md` for project context and code review guidelines.
