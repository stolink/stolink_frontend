# 2026-01-21 AI 코드 리뷰 피드백 반영 (관계 분석 로직 개선)

## Issue Description

AI 코드 리뷰(Gemini)를 통해 `analysisUtils.ts`의 관계 분석(Diff) 로직에서 발생할 수 있는 잠재적 결함 2건과 경고 사항 2건이 식별되었습니다.

- 파일: `src/utils/analysisUtils.ts`, `src/stores/useAnalysisBufferStore.ts`
- 에러 유형: 🔴 치명적 (2건), ⚠️ 경고 (2건)

1. **🔴 관계 Diff 스킵 조건 미비**: `prevLinks`가 0일 때 무조건 스킵하면, 데이터 소스 불일치나 초기 분석 외 상황에서 오탐지가 발생할 수 있음.
2. **🔴 getLinkId Fallback 취약성**: 유효하지 않은 D3 객체 대응 시 `String(val)` 폴백이 매칭 오류를 유발할 수 있음.
3. **⚠️ 관계 유형 하드코딩**: `"ally" -> "friendly"` 매핑이 로직 내에 하드코딩되어 확장성이 떨어짐.
4. **⚠️ 상태 삭제 시점 정당성**: `pendingAnalysisResults` 삭제 시점이 사용자 확인 전일 가능성 제기 (검토 결과 정상).

## Solution Strategy

1. **조합 조건 가드**: `shouldSkipRelationsDiff` 판단 시 `prevLinks`뿐만 아니라 `prevCharacters`의 길이도 함께 체크하여 명시적인 '최초 분석' 상황으로 한정함.
2. **엄격한 Fallback**: `getLinkId`에서 ID 속성이 없는 객체는 빈 문자열을 반환하고 콘솔 경고를 남기도록 수정.
3. **상수화**: `RELATION_TYPE_MAPPING` 상수를 도입하여 관계 유형 정규화 로직을 분리.
4. **사용처 보강**: `calculateAnalysisDiff`와 `calculateDiffFromSnapshot` 양쪽 모두에 정규화 로직을 일관되게 적용.

### 변경 전 (핵심 로직 예시)

```typescript
const shouldSkipRelationsDiff = prevLinks.length === 0 && nextLinks.length > 0;

const normalizeRelation = (t: string) => (t === "ally" ? "friendly" : t);
```

### 변경 후

```typescript
const isInitialAnalysis = prevLinks.length === 0 && prevCharacters.length === 0;
const shouldSkipRelationsDiff = isInitialAnalysis && nextLinks.length > 0;

const RELATION_TYPE_MAPPING: Record<string, string> = { ally: "friendly" };
const normalizeRelationType = (t: string) => {
  const normalized = t.toLowerCase().trim();
  return RELATION_TYPE_MAPPING[normalized] || normalized;
};
```

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공 (v22.63s)
- **검증 방법**: `type-check` 통과 및 실제 빌드 아티팩트 생성 확인
