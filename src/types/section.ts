// =====================================================
// 📄 Section Types - Matched with callback_result.json
// =====================================================

/**
 * 섹션/단락 엔티티 (AI 분석 결과)
 * Backend field: snake_case → Frontend field: camelCase
 */
export interface Section {
  /** sequence_order → sequenceOrder */
  sequenceOrder: number;

  /** nav_title → navTitle */
  navTitle: string;

  /** 섹션 본문 내용 */
  content: string;

  /** 임베딩 벡터 (선택적) */
  embedding?: number[];
}

/**
 * 백엔드 섹션 응답 타입 (snake_case)
 */
export interface BackendSection {
  sequence_order: number;
  nav_title: string;
  content: string;
  embedding?: number[];
}

/**
 * 백엔드 섹션 → 프론트엔드 섹션 변환
 */
export function transformBackendSection(
  backendSection: BackendSection,
): Section {
  return {
    sequenceOrder: backendSection.sequence_order,
    navTitle: backendSection.nav_title,
    content: backendSection.content,
    embedding: backendSection.embedding,
  };
}
