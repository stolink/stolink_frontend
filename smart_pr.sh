#!/bin/bash
TARGET_BRANCH="dev"
CURRENT_BRANCH="feature/69"
MANAGEMENT_REPO="stolink/stolink-manage"
PROJECT_NUMBER="1"
PR_TITLE="docs: 데이터 모델 및 타입 정의 업데이트"

# Fetch and log
git fetch origin $TARGET_BRANCH

# Create Body
cat <<EOF > .pr_body_temp.md
## 📋 변경 사항

데이터 모델(DATA_MODEL.md) 및 TypeScript 타입 정의(src/types)를 업데이트했습니다.
AI 분석 결과 저장 방식 변경(PostgreSQL -> NoSQL) 및 관련 타입 정의가 수정되었습니다.

## 📁 변경된 파일

- docs/spec/DATA_MODEL.md
- src/types/document.ts
- src/types/foreshadowing.ts

## ✅ 체크리스트

- [ ] 빌드 성공 확인 (\`npm run build\`)
- [ ] 로컬 테스트 완료

## 🔀 Merge 가이드

- Target: \`$TARGET_BRANCH\`
- Squash and Merge 권장
EOF

# Handle Issue
DETECTED_ISSUE_NUM="69"
EXISTING_ISSUE_FOUND=false

echo "Checking issue #$DETECTED_ISSUE_NUM in $MANAGEMENT_REPO..."
if gh issue view "$DETECTED_ISSUE_NUM" --repo "$MANAGEMENT_REPO" > /dev/null 2>&1; then
    echo "Existing issue #$DETECTED_ISSUE_NUM found."
    ISSUE_NUM="$DETECTED_ISSUE_NUM"
    EXISTING_ISSUE_FOUND=true
else
    echo "Issue #$DETECTED_ISSUE_NUM not found."
fi

if [ "$EXISTING_ISSUE_FOUND" = false ]; then
    echo "Creating new issue..."
    ISSUE_URL=$(gh issue create \
    --repo "$MANAGEMENT_REPO" \
    --title "$PR_TITLE" \
    --body-file .pr_body_temp.md \
    --label "auto-generated" \
    --assignee "@me")
    ISSUE_NUM=${ISSUE_URL##*/}
    echo "Created issue #$ISSUE_NUM"

    gh project item-add "$PROJECT_NUMBER" --owner stolink --url "$ISSUE_URL" || echo "Project add failed or skipped"
fi

echo -e "\n\nCloses $MANAGEMENT_REPO#$ISSUE_NUM" >> .pr_body_temp.md

# Create PR
echo "Creating PR..."
gh pr create \
  --title "$PR_TITLE" \
  --body-file .pr_body_temp.md \
  --base $TARGET_BRANCH

rm .pr_body_temp.md
