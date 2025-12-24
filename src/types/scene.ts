// Scene Types - 실제 집필 단위
// Chapter > Scene 계층 구조

export interface Scene {
  // === 필수 필드 ===
  id: string;
  chapterId: string;
  projectId: string;
  title: string;
  content: string;
  order: number;

  // === 메타데이터 ===
  metadata: SceneMetadata;

  // === 연결 관계 ===
  characterIds: string[]; // 등장 캐릭터
  foreshadowingIds: string[]; // 관련 복선

  createdAt: string;
  updatedAt: string;
}

export interface SceneMetadata {
  label?: string; // POV 캐릭터, 위치 등 (색상 매핑)
  labelColor?: string; // 라벨 색상
  status: SceneStatus;
  keywords: string[]; // 복선, 테마 태그
  synopsis: string; // 인덱스 카드에 표시될 요약
  notes: string; // 작가 메모
  wordCount: number;
  targetWordCount?: number;
  includeInCompile: boolean; // 컴파일(내보내기) 시 포함 여부
}

export type SceneStatus = "draft" | "revised" | "final";

// Chapter 하위에 중첩될 때 사용
export type SceneTreeNode = Scene;

export interface CreateSceneInput {
  chapterId: string;
  projectId: string;
  title: string;
  synopsis?: string;
  targetWordCount?: number; // Added as per instruction
  characterIds?: string[];
}

export interface UpdateSceneInput {
  title?: string;
  content?: string;
  order?: number;
  metadata?: Partial<SceneMetadata>;
  characterIds?: string[];
  foreshadowingIds?: string[];
}
