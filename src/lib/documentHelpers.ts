import type { Document } from "@/types/document";

/**
 * 문서 헬퍼 유틸리티
 * Scrivener 방식의 뷰 모드 구현을 위한 핵심 로직
 */

/**
 * 선택된 항목에서 편집 가능한 섹션 찾기
 * - 텍스트 문서: 그 자체 반환
 * - 폴더: 첫 번째 텍스트 자식 반환
 */
export function findEditableSection(
  item: Document,
  documents: Document[],
): Document | null {
  if (item.type === "text") return item;

  // 폴더인 경우 첫 번째 텍스트 자식 찾기
  const children = documents
    .filter((d) => d.parentId === item.id && d.type === "text")
    .sort((a, b) => a.order - b.order);

  return children[0] || null;
}

/**
 * 직계 자식 찾기 (1단계만)
 * - Scrivenings 뷰, Outline 뷰에서 사용
 */
export function findDirectChildren(
  item: Document,
  documents: Document[],
): Document[] {
  return documents
    .filter((d) => d.parentId === item.id)
    .sort((a, b) => a.order - b.order);
}

/**
 * 형제 섹션들 찾기 (같은 부모의 자식들)
 * - Outline 뷰에서 섹션 선택 시 사용
 */
export function findSiblings(
  item: Document,
  documents: Document[],
): Document[] {
  if (!item.parentId) return [];

  return documents
    .filter((d) => d.parentId === item.parentId)
    .sort((a, b) => a.order - b.order);
}

/**
 * 현재 선택 항목의 부모 찾기
 */
export function findParent(
  item: Document,
  documents: Document[],
): Document | null {
  if (!item.parentId) return null;
  return documents.find((d) => d.id === item.parentId) || null;
}

/**
 * Breadcrumb 경로 생성 (루트부터 현재까지)
 */
export function buildBreadcrumbPath(
  itemId: string,
  documents: Document[],
): Array<{ id: string; title: string }> {
  const path: Array<{ id: string; title: string }> = [];
  let currentId: string | null = itemId;

  while (currentId) {
    const doc = documents.find((d) => d.id === currentId);
    if (!doc) break;

    path.unshift({ id: doc.id, title: doc.title });
    currentId = doc.parentId || null;
  }

  return path;
}
