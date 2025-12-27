# 인라인 타입 확장을 별도 인터페이스로 분리

## Issue Description

AI 코드 리뷰에서 `useCharacterGraphSimulation.ts` 파일의 타입 정의 불완전 경고 발생

- 파일: `src/hooks/useCharacterGraphSimulation.ts`
- 라인: 39
- 에러 유형: ⚠️ 경고

> `UseForceSimulationOptions & { enableGrouping?: boolean }` 인라인 타입 확장은 유지보수 어려움. 별도 인터페이스로 정의 필요

## Solution Strategy

인라인 타입 확장 대신 `UseForceSimulationOptionsWithGrouping` 인터페이스를 별도로 정의하여 타입 안전성과 유지보수성 향상

### 변경 전

```typescript
export function useForceSimulation(
  initialNodes: CharacterNode[],
  initialLinks: RelationshipLink[],
  options: UseForceSimulationOptions & { enableGrouping?: boolean }
): UseForceSimulationReturn {
```

### 변경 후

```typescript
interface UseForceSimulationOptionsWithGrouping extends UseForceSimulationOptions {
  enableGrouping?: boolean;
}

export function useForceSimulation(
  initialNodes: CharacterNode[],
  initialLinks: RelationshipLink[],
  options: UseForceSimulationOptionsWithGrouping
): UseForceSimulationReturn {
```

## 참고: 이미 해결된 치명적 이슈 (3건)

리뷰 시점과 현재 코드 사이에 이미 수정되어 있던 사항들:

| 이슈                        | 리뷰 지적 라인 | 현재 상태                                                      |
| --------------------------- | -------------- | -------------------------------------------------------------- |
| `as any` 사용               | 70-84          | ✅ `Record<string, unknown>`으로 수정됨                        |
| `relationTypeFilter` 미정의 | 213            | ✅ props에 `relationTypeFilter?: RelationType \| "all"` 정의됨 |
| SVG id 불일치               | 269-289        | ✅ 일관된 패턴 `config.name.replace(/\s+/g, "-")` 사용 확인    |

## Outcome

- **상태**: ✅ 해결됨
- **빌드 결과**: `npm run build` 성공
- **검증 방법**: TypeScript 컴파일 및 Vite 프로덕션 빌드 통과
