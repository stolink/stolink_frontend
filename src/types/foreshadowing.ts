// Foreshadowing (복선) Types with flexible extras pattern

// 작가가 직접 관리하는 상태값: 설정됨(setup) -> 회수됨(resolved) 또는 폐기됨(dropped)
export type ForeshadowingStatus =
  | "setup"
  | "resolved"
  | "dropped"
  | "pending"
  | "ignored"
  | "recovered"; // Expanded to support legacy store values
export type ForeshadowingImportance = "major" | "minor"; // Added missing type

export type ForeshadowingCategory =
  | "dialogue"
  | "props"
  | "scene"
  | "symbol"
  | "other";

export interface ForeshadowLocation {
  documentId: string;
  selectionStart?: number;
  selectionEnd?: number;
  quote?: string;
  chapterName?: string;
  desc?: string; // 추가 설명
}

export interface ForeshadowingAppearance {
  sceneId: string;
  chapterId: string;
  chapterTitle: string;
  line: number;
  context: string;
  isRecovery: boolean;
}

export interface Foreshadowing {
  id: string;
  projectId: string;

  // === Manual Management Fields ===
  title: string; // 식별용 제목 (ex: "회중시계의 이니셜")
  description?: string; // 작가 메모/설명

  status: ForeshadowingStatus;
  importance: ForeshadowingImportance;
  category?: ForeshadowingCategory;

  // === Connections ===
  relatedEntities: {
    characterIds?: string[];
    placeIds?: string[];
    itemIds?: string[];
  };
  // Legacy/Store support
  relatedCharacterIds?: string[];
  appearances: ForeshadowingAppearance[]; // Made required to match store usage

  // === Locations ===
  createdIn?: ForeshadowLocation; // 투척(Setup) 위치
  resolvedIn?: ForeshadowLocation; // 회수(Payoff) 위치

  createdAt: string;
  updatedAt: string;
}

export interface CreateForeshadowingInput {
  projectId: string;
  title: string;
  description?: string;
  status?: ForeshadowingStatus;
  importance?: number;
  category?: ForeshadowingCategory;
  createdIn?: ForeshadowLocation;
}

export interface UpdateForeshadowingInput {
  title?: string;
  description?: string;
  status?: ForeshadowingStatus;
  importance?: number;
  category?: ForeshadowingCategory;
  relatedEntities?: {
    characterIds?: string[];
    placeIds?: string[];
    itemIds?: string[];
  };
  createdIn?: ForeshadowLocation;
  resolvedIn?: ForeshadowLocation;
}
