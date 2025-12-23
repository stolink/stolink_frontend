// Chapter Types with flexible extras pattern

export interface Chapter {
  // === 필수 필드 ===
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  type: ChapterType;

  // === 주요 선택 필드 ===
  parentId?: string; // For nested structure (Part > Chapter > Section)
  characterCount: number;
  isPlot: boolean; // 내용 없이 제목만 있는 플롯

  // === 동적 추가 정보 (메모, 상태, 태그 등) ===
  extras?: Record<string, string | number | boolean | string[]>;

  createdAt: string;
  updatedAt: string;
}

export type ChapterType = 'part' | 'chapter' | 'section';

export interface ChapterTreeNode extends Chapter {
  children: ChapterTreeNode[];
}

export interface CreateChapterInput {
  projectId: string;
  parentId?: string;
  title: string;
  type: ChapterType;
  extras?: Record<string, string | number | boolean | string[]>;
}

export interface UpdateChapterInput {
  title?: string;
  content?: string;
  order?: number;
  extras?: Record<string, string | number | boolean | string[]>;
}

// Delta for auto-save
export interface ChapterDelta {
  chapterId: string;
  changes: DeltaChange[];
  timestamp: string;
}

export interface DeltaChange {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}
