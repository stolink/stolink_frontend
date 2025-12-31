import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChapterTree, type ChapterNode } from "@/components/editor/sidebar";

interface EditorLeftSidebarProps {
  chapters: ChapterNode[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: (
    title: string,
    parentId?: string,
    type?: "chapter" | "section",
  ) => void;
  onRenameChapter?: (id: string, newTitle: string) => void;
  onDeleteChapter?: (id: string) => void;
  onReorderChapter?: (parentId: string | null, orderedIds: string[]) => void;
  onMoveToFolder?: (itemId: string, targetFolderId: string | null) => void;
  isOpen: boolean;
  onToggle?: () => void;
}

export default function EditorLeftSidebar({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapter,
  onMoveToFolder,
  isOpen,
  onToggle,
}: EditorLeftSidebarProps) {
  if (!isOpen) {
    return (
      <div className="w-10 border-r border-border bg-background hidden md:flex flex-col items-center py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle?.()}
          className="text-muted-foreground hover:text-foreground"
          title="사이드바 열기"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-56 border-r border-border bg-background hidden md:flex shrink-0 overflow-hidden relative">
      {/* Main Sidebar Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chapter Tree */}
        <div className="flex-1 overflow-y-auto pl-2 pr-1 py-2">
          <ChapterTree
            chapters={chapters}
            selectedChapterId={selectedChapterId || undefined}
            onSelectChapter={onSelectChapter}
            onAddChapter={onAddChapter}
            onRenameChapter={onRenameChapter}
            onDeleteChapter={onDeleteChapter}
            onReorderChapter={onReorderChapter}
            onMoveToFolder={onMoveToFolder}
          />
        </div>
      </div>

      {/* Toggle Button - Right Edge Strip */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="w-5 h-full border-l border-border/50 bg-muted/30 hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="사이드바 닫기"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      )}
    </aside>
  );
}
