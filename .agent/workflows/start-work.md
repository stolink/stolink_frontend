---
description: 내게 할당된 이슈를 선택하여 작업 브랜치를 자동으로 생성하고 이동합니다.
---

> **사용법:** `/start-work` (목록) 또는 `/start-work <이슈번호>` (작업 시작)

// turbo-all

---

## 0. 브랜치명 생성 (AI 단계)

이슈 번호가 주어지면, 스크립트를 실행하기 **전에**:

1. `gh issue view <번호> --repo stolink/stolink-manage --json title -q .title` 로 제목 확인
2. 한글 제목 → **영어 kebab-case** 변환 (예: "로그인 기능 추가" → "add-login")
3. 변환된 이름을 **두 번째 인자**로 전달: `<번호> <영문이름>`

---

## 1. 작업 시작 스크립트 실행

```bash
ISSUE_NUM=$1
BRANCH_SUFFIX=$2
MANAGEMENT_REPO="stolink/stolink-manage"
PROJECT_NUMBER=1
PROJECT_ID="PVT_kwDODvp_7s4BLZVL"
STATUS_FIELD_ID="PVTSSF_lADODp_7s4BLZVLzg6-5Vg"
IN_PROGRESS_OPTION_ID="47fc9ee4"

# 인자 없으면 목록 출력
if [ -z "$ISSUE_NUM" ]; then
  echo "📋 작업 가능한 이슈:"
  gh project item-list $PROJECT_NUMBER --owner stolink --format json --limit 20 2>/dev/null | \
    jq -r '.items[] | select(.status == "Ready" or .status == "Open" or .status == null) | "  \(.content.number). \(.content.title)"'
  echo ""
  echo "👉 /start-work <번호> [영문이름]"
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

# 브랜치 prefix 결정 (bug 라벨이면 fix, 아니면 feature)
IS_BUG=$(echo "$ISSUE_DATA" | jq -r '.labels[].name' 2>/dev/null | grep -i "bug" || true)
if [ -n "$IS_BUG" ]; then
  PREFIX="fix"
else
  PREFIX="feature"
fi

# 브랜치 이름: 영문 suffix가 있으면 사용, 없으면 번호만
if [ -n "$BRANCH_SUFFIX" ]; then
  SAFE_SUFFIX=$(echo "$BRANCH_SUFFIX" | sed -e 's/[^a-zA-Z0-9-]//g' | tr '[:upper:]' '[:lower:]')
  BRANCH_NAME="${PREFIX}/${ISSUE_NUM}-${SAFE_SUFFIX}"
else
  BRANCH_NAME="${PREFIX}/${ISSUE_NUM}"
fi

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
    gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$IN_PROGRESS_OPTION_ID" >/dev/null 2>&1
  fi
) &
disown
```
