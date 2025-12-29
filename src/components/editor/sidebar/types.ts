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
  onAddChapter?: (
    title: string,
    parentId?: string,
    type?: "chapter" | "section"
  ) => void;
  onRenameChapter?: (id: string, newTitle: string) => void;
  onDeleteChapter?: (id: string) => void;
  onReorderChapter?: (parentId: string | null, orderedIds: string[]) => void;
  onMoveToFolder?: (itemId: string, targetFolderId: string | null) => void;
}

// Status colors mapping
export const statusColors: Record<string, string> = {
  todo: "bg-relation-neutral",
  inProgress: "bg-status-warning",
  done: "bg-status-success",
  revised: "bg-relation-family",
};

// Character count formatter
export function formatCharCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}
