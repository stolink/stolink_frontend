/**
 * Stats Page Type Definitions
 *
 * Types for chapter balance analysis and writing patterns.
 */

/**
 * Chapter statistics for balance analysis
 */
export interface ChapterStats {
  id: string;
  title: string;
  wordCount: number;
  order: number;
}

/**
 * Writing activity patterns
 */
export interface WritingActivity {
  byDayOfWeek: Record<string, number>; // { mon: 2000, tue: 1500, ... }
  byTimeOfDay: Record<string, number>; // { morning: 1000, afternoon: 2000, ... }
  last30Days: { date: string; wordCount: number }[];
}

/**
 * Extended project statistics including chapter details and writing patterns
 */
export interface ExtendedProjectStats {
  totalWords: number;
  chapterCount: number;
  characterCount: number;
  chapters: ChapterStats[];
  writingActivity: WritingActivity;
}

/**
 * Chapter balance analysis result (computed on frontend)
 */
export interface ChapterBalanceAnalysis {
  chapters: Array<{
    id: string;
    title: string;
    wordCount: number;
    deviation: number; // Percentage deviation from average
    isUnbalanced: boolean; // True if deviation > 50%
  }>;
  average: number;
  longest: ChapterStats;
  shortest: ChapterStats;
  unbalancedCount: number;
}

/**
 * Foreshadowing statistics for stats page
 */
export interface ForeshadowingStats {
  totalCount: number;
  pendingCount: number;
  recoveredCount: number;
  ignoredCount: number;
  recoveryRate: number; // Percentage (0-100)
  unresolvedItems: Array<{
    id: string;
    tag: string;
    description?: string;
    appearances: unknown[];
    createdAt: string;
  }>;
}
