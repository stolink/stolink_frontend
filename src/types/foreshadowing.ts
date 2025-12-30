// Foreshadowing (복선) Types with flexible extras pattern

export interface Foreshadowing {
  // === 필수 필드 ===
  id: string;
  projectId: string;
  tag: string; // e.g., "전설의검"
  status: ForeshadowingStatus;

  // === 주요 선택 필드 ===
  description?: string;
  importance?: ForeshadowingImportance; // 중요도
  relatedCharacterIds?: string[]; // 관련 캐릭터

  // === 동적 추가 정보 ===
  extras?: Record<string, string | number | boolean>;

  // === 등장 위치들 ===
  appearances: ForeshadowingAppearance[];

  createdAt: string;
  updatedAt: string;
}

export type ForeshadowingStatus = "pending" | "recovered" | "ignored";
export type ForeshadowingImportance = "major" | "minor";

export interface ForeshadowingAppearance {
  // === 위치 정보 ===
  sectionTitle: string; // 섹션 제목 (필수)
  documentId?: string; // 섹션 ID (선택, 레거시)

  // === 상태 ===
  isRecovery: boolean; // 회수 지점인지

  // === 레거시 호환 ===
  sceneId?: string;
  chapterId?: string;
  chapterTitle?: string;
}

export interface CreateForeshadowingInput {
  projectId: string;
  tag: string;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}

export interface UpdateForeshadowingInput {
  status?: ForeshadowingStatus;
  description?: string;
  extras?: Record<string, string | number | boolean>;
}
