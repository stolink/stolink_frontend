# AI 코드 리뷰 이슈 수정

## Issue Description

PR #83 AI 코드 리뷰에서 발견된 3건의 치명적(🔴) 이슈와 5건의 경고(⚠️) 처리

### 🔴 치명적 이슈

1. **distSq 조건 부적절** (`index.tsx:229`)
   - 문제: `distSq < 1`은 거리 1px 미만에서만 직선, 매우 짧은 거리에서 불필요한 곡선 생성
   - 해결: `distSq < MIN_CURVE_DISTANCE_SQ (100)`으로 변경

2. **매직 넘버 하드코딩** (`index.tsx:238`)
   - 문제: `60`, `100` 등 상수가 코드에 직접 하드코딩
   - 해결: `constants.ts`에 `MIN_CURVE_DISTANCE_SQ`, `MAX_CURVE_OFFSET` 상수 추가

### ⚠️ 경고 이슈

3. **SVG textShadow 미지원** (`NodeRenderer.tsx:196`)
   - 문제: CSS `textShadow`는 SVG `<text>`에서 작동하지 않음
   - 해결: SVG `<filter>` 정의(`textLabelShadow`)로 대체

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공
