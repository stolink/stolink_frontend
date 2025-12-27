---
description: 내게 할당된 이슈를 선택하여 작업 브랜치를 자동으로 생성하고 이동합니다.
---

> **사용법:** `/start-work` (목록 보기) 또는 `/start-work <이슈번호>` (바로 시작)

// turbo-all

---

## 1. 작업 시작 스크립트 실행

```bash
ISSUE_NUM=$1
MANAGEMENT_REPO="stolink/stolink-manage"
PROJECT_NUMBER=1
STATUS_FIELD_ID="PVTSSF_lADODp_7s4BLZVLzg6-5Vg"
IN_PROGRESS_OPTION_ID="47fc9ee4"

# 인자 없으면 목록 출력
if [ -z "$ISSUE_NUM" ]; then
  echo "📋 작업 가능한 이슈:"
  gh project item-list $PROJECT_NUMBER --owner stolink --format json --limit 20 2>/dev/null | \
    jq -r '.items[] | select(.status == "Ready" or .status == "Open" or .status == null) | "  \(.content.number). \(.content.title)"'
  echo ""
  echo "👉 /start-work <번호>"
  exit 0
fi

# 이슈 정보 조회
ISSUE_DATA=$(gh issue view "$ISSUE_NUM" --repo "$MANAGEMENT_REPO" --json title,labels 2>/dev/null)
if [ -z "$ISSUE_DATA" ]; then
  echo "❌ 이슈 #$ISSUE_NUM 조회 실패"
  exit 1
fi

TITLE=$(echo "$ISSUE_DATA" | jq -r .title)
if [ -z "$TITLE" ] || [ "$TITLE" == "null" ]; then
  echo "❌ 이슈 정보 없음"
  exit 1
fi

# 브랜치 이름 생성
SAFE_TITLE=$(echo "$TITLE" | sed -e 's/[^a-zA-Z0-9가-힣 ]//g' | tr ' ' '-')
IS_BUG=$(echo "$ISSUE_DATA" | jq -r '.labels[].name' 2>/dev/null | grep -i "bug" || true)
if [ -n "$IS_BUG" ]; then
  PREFIX="fix"
else
  PREFIX="feature"
fi
BRANCH_NAME="${PREFIX}/${ISSUE_NUM}-${SAFE_TITLE}"

# 브랜치 생성/이동 (즉시 실행)
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git checkout "$BRANCH_NAME" >/dev/null 2>&1
  echo "✅ $BRANCH_NAME (기존)"
else
  git checkout -b "$BRANCH_NAME" >/dev/null 2>&1
  echo "✅ $BRANCH_NAME (신규)"
fi
echo "📝 $TITLE"

# 백그라운드: 작업자 할당 & 프로젝트 상태 변경
(
  gh issue edit "$ISSUE_NUM" --repo "$MANAGEMENT_REPO" --add-assignee "@me" >/dev/null 2>&1
  ITEM_ID=$(gh project item-list $PROJECT_NUMBER --owner stolink --format json 2>/dev/null | jq -r ".items[] | select(.content.number == $ISSUE_NUM) | .id")
  if [ -n "$ITEM_ID" ]; then
    gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_NUMBER" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$IN_PROGRESS_OPTION_ID" >/dev/null 2>&1
  fi
) &
disown
```
