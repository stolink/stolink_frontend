import type { Section, BackendSection } from "@/types/section";

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

export const sectionService = {
  // Placeholder for future API integration
  transform: transformBackendSection,
};
