// Project Types with flexible extras pattern

export interface Project {
  // === 필수 필드 ===
  id: string;
  userId: string;
  title: string;

  // === 주요 선택 필드 ===
  genre: Genre;
  description?: string;
  coverImage?: string;
  status: ProjectStatus;

  // === 동적 추가 정보 (세계관 설정, 메모 등) ===
  extras?: Record<string, string | number | boolean | string[]>;

  // === 통계 ===
  stats: ProjectStats;

  createdAt: string;
  updatedAt: string;
}

export type Genre = 'fantasy' | 'romance' | 'sf' | 'mystery' | 'other';

export type ProjectStatus = 'writing' | 'completed';

export interface ProjectStats {
  totalCharacters: number;
  totalWords: number;
  chapterCount: number;
  characterCount: number;
  foreshadowingRecoveryRate: number;
  consistencyScore: number;
}

export interface CreateProjectInput {
  title: string;
  genre: Genre;
  description?: string;
  extras?: Record<string, string | number | boolean | string[]>;
}
