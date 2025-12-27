---
description: 내게 할당된 이슈를 선택하여 작업 브랜치를 자동으로 생성하고 이동합니다.
---

> **목적:** 중앙 레포지토리의 이슈를 확인하고, 규칙에 맞는 브랜치를 자동 생성하여 휴먼 에러를 방지합니다.

// turbo-all

---

## 0. 설정

```bash
MANAGEMENT_REPO="stolink/stolink-manage"
```

---

## 1. 할당된 이슈 목록 조회

PROJECT_NUMBER=1

echo "📡 'Ready' 상태의 이슈 목록을 불러오는 중... (Project #$PROJECT_NUMBER)"

# 1. 프로젝트 아이템 가져오기

# 2. Status가 'Ready'인 것만 필터링

# 3. 결과 출력 (Number, Title)

gh project item-list $PROJECT_NUMBER --owner stolink --format json --limit 20 | \
 jq -r '.items[] | select(.status == "Ready") | "Issue #\(.content.number): \(.content.title)"'

echo -e "\n(위 목록에 없는 경우, 번호를 직접 입력하셔도 됩니다)"

---

## 2. 이슈 선택 및 정보 추출

작업할 이슈 번호를 입력받아 상세 정보를 가져옵니다.

```bash
# 사용자 입력 요청
echo -e "\n작업할 이슈 번호를 입력하세요 (예: 12):"
read ISSUE_NUM

if [ -z "$ISSUE_NUM" ]; then
  echo "❌ 이슈 번호가 입력되지 않았습니다."
  exit 1
fi

# 이슈 정보 조회 (Title, Labels)
echo "🔍 이슈 #$ISSUE_NUM 정보 조회 중..."
ISSUE_DATA=$(gh issue view "$ISSUE_NUM" --repo "$MANAGEMENT_REPO" --json title,labels)

# Title 추출
TITLE=$(echo "$ISSUE_DATA" | jq -r .title)
if [ -z "$TITLE" ] || [ "$TITLE" == "null" ]; then
  echo "❌ 이슈 #$ISSUE_NUM 정보를 찾을 수 없습니다."
  exit 1
fi

echo "✅ 선택된 이슈: $TITLE"
```

---

## 3. 브랜치 이름 생성

이슈 제목을 영어/한글 Slug로 변환하여 브랜치 이름을 만듭니다.

```bash
# 1. 제목 정리: 특수문자 제거, 공백을 하이픈으로 변경
SAFE_TITLE=$(echo "$TITLE" | sed -e 's/[^a-zA-Z0-9가-힣 ]//g' | tr ' ' '-')

# 2. 접두사 결정 (버그 라벨이 있으면 fix/, 아니면 feature/)
IS_BUG=$(echo "$ISSUE_DATA" | jq -r '.labels[].name' | grep -i "bug")

if [ -n "$IS_BUG" ]; then
  PREFIX="fix"
else
  PREFIX="feature"
fi

BRANCH_NAME="${PREFIX}/${ISSUE_NUM}-${SAFE_TITLE}"

echo "🔨 생성할 브랜치 이름: $BRANCH_NAME"
```

---

## 4. 작업자 할당 및 상태 변경

```bash
# 1. 이슈에 작업자(나) 할당
echo "👤 이슈 #$ISSUE_NUM 에 작업자(@me)를 할당합니다..."
gh issue edit "$ISSUE_NUM" --repo "$MANAGEMENT_REPO" --add-assignee "@me"

# 2. (선택) 프로젝트 상태 변경 -> 'In Progress'
# 주의: 'gh auth refresh -s project' 권한이 필요합니다.
PROJECT_NUMBER=1
STATUS_FIELD_ID="PVTSSF_lADODvp_7s4BLZVLzg6-5Vg"
IN_PROGRESS_OPTION_ID="47fc9ee4"

ITEM_ID=$(gh project item-list $PROJECT_NUMBER --owner stolink --format json | jq -r ".items[] | select(.content.number == $ISSUE_NUM) | .id")

if [ -n "$ITEM_ID" ]; then
  echo "🚀 프로젝트 카드를 'In progress'로 이동합니다..."
  gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_NUMBER" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$IN_PROGRESS_OPTION_ID"
fi
```

## 5. 브랜치 생성 및 이동

```bash
# 이미 존재하는지 확인
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "⚠️ 이미 존재하는 브랜치입니다. 해당 브랜치로 이동합니다."
  git checkout "$BRANCH_NAME"
else
  echo "🚀 새 브랜치를 생성하고 이동합니다..."
  git checkout -b "$BRANCH_NAME"
fi
```

---

## 5. 완료 메시지

```bash
echo -e "\n✅ 작업 준비 완료!"
echo "이제 코드를 작성하고, 완료되면 '/smart-commit'을 실행하세요."
```
