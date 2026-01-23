export interface WritingGoal {
  id: string;
  projectId: string;
  type: "daily" | "weekly" | "monthly";
  targetCount: number; // 목표 글자/단어 수
  unit: "characters" | "words";
  currentCount: number; // 현재 달성량
  startDate: string;
  endDate: string;
  isAchieved: boolean;
}

export type ProjectSettings = WritingGoal;
// Future extensions can be added to the type intersection

export interface ShareConfig {
  password?: string;
  expiresAt?: string; // ISO Date string
}
