// Types for the chapter tree sidebar

export interface ChapterNode {
  id: string;
  title: string;
  type: "part" | "chapter" | "section";
  characterCount?: number;
  isPlot?: boolean;
  isModified?: boolean;
  status?: "todo" | "inProgress" | "done" | "revised";
  children?: ChapterNode[];
}

export interface ChapterTreeProps {
  chapters?: ChapterNode[];
  selectedChapterId?: string;
  onSelectChapter?: (chapterId: string) => void;
  onAddChapter?: (title: string, parentId?: string) => void;
  onRenameChapter?: (id: string, newTitle: string) => void;
  onDeleteChapter?: (id: string) => void;
  onDuplicateChapter?: (id: string) => void;
}

// Status colors mapping
export const statusColors: Record<string, string> = {
  todo: "bg-stone-400",
  inProgress: "bg-amber-400",
  done: "bg-emerald-400",
  revised: "bg-blue-400",
};

// Character count formatter
export function formatCharCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}
