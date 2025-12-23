---
description: Automatically generate commit messages, push changes, and guide PR creation.
---

1.  **Analyze Changes**:
    - Run `git diff --staged` (if nothing staged, run `git add .` first and then diff).
    - Analyze the changes to understand the intent (feat, fix, refactor, etc.).

2.  **Generate Commit Message**:
    - Create a Conventional Commit message based on the analysis.
    - Format: `<type>(<scope>): <description>`
    - Example: `feat(auth): implement login retry logic`

3.  **Commit and Push**:
    - Run `git commit -m "generated_message"`
    - Get current branch name: `git rev-parse --abbrev-ref HEAD`
    - Run `git push origin <current_branch>`

4.  **PR Creation & AI Review**:
    - If `gh` CLI is available, run `gh pr create --title "generated_message" --body "Auto-generated PR for AI Review"`.
    - If not, generate a link to create a PR: `https://github.com/ssyy3034/sto-link-front/compare/main...<current_branch>?expand=1`
    - **Important**: Creating a PR will automatically trigger the AI Code Reviewer configured in `.github/workflows/ai-review.yml`.
