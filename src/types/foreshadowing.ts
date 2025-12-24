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
  sceneId?: string; // Scene 레벨 추적 (신규)
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string; // 주변 텍스트
  isRecovery: boolean; // 회수 지점인지

  // 동적 추가 정보
  extras?: Record<string, string | number | boolean>;
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
