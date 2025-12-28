# AI 코드 리뷰 반영 및 트러블슈팅 (PR #70)

## 1. CorkboardView 무한 재귀 위험 (🔴 Critical)

### Issue Description

`CorkboardView.tsx`의 `findChildDocuments` 함수가 트리 구조를 순회하면서, 만약 문서 트리 내에 순환 참조(Circular Reference)가 존재할 경우 무한 루프에 빠져 브라우저가 멈출 위험이 있음.

- 파일: `src/components/editor/CorkboardView.tsx`
- 라인: 67
- 에러 유형: 🔴 치명적

### Solution Strategy

DFS(깊이 우선 탐색) 수행 시 `visited` Set을 도입하여 이미 방문한 노드는 재방문하지 않도록 차단.

### 변경 전

```typescript
const findChildDocuments = (
  nodes: DocumentTreeNode[],
  parentId: string
): CorkboardCard[] => {
  for (const node of nodes) {
    if (node.id === parentId) {
      /* ... */
    }
    if (node.children?.length) {
      const found = findChildDocuments(node.children, parentId); // 무한 재귀 가능성
      if (found.length > 0) return found;
    }
  }
  return [];
};
```

### 변경 후

```typescript
const findChildDocuments = (
  nodes: DocumentTreeNode[],
  parentId: string,
  visited = new Set<string>() // Visited Set 추가
): CorkboardCard[] => {
  for (const node of nodes) {
    if (visited.has(node.id)) continue; // 방문 체크
    visited.add(node.id);

    // ... 기존 로직 ...

    if (node.children?.length) {
      const found = findChildDocuments(node.children, parentId, visited);
      if (found.length > 0) return found;
    }
  }
  return [];
};
```

## 2. CorkboardView 성능 최적화 (⚠️ Warning)

### Issue Description

`cards` 배열을 계산하는 로직이 컴포넌트 렌더링마다 매번 실행되어 불필요한 연산 부하 발생.

### Solution Strategy

`useMemo`를 사용하여 `tree`, `folderId`, `documents`가 변경될 때만 재계산하도록 최적화.

## 3. 기타 분석 결과

- **EditorRightSidebar Props 위험**: `documentId`가 `EditorPage`에서 `selectedSectionId` state를 통해 올바르게 전달되고 있으며, `InspectorPanel` 내부에서도 null 처리가 되어 있어 수정 불필요.
- **캐시 무효화**: `useDocumentMutations` 훅 내부에서 이미 `queryClient.invalidateQueries`를 수행하고 있어 추가 조치 불필요.

## Outcome

- **상태**: ✅ 해결됨 및 검증 완료
- **조치**:
  - `CorkboardView.tsx` 수정 (재귀 방지, 메모이제이션, 타입 안전성 강화)
  - `task.md` 업데이트
