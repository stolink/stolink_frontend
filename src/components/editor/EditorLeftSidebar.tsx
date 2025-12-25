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
  onDuplicateChapter?: (id: string) => void;
  onConvertType?: (id: string, type: "chapter" | "section") => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function EditorLeftSidebar({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onDuplicateChapter,
  onConvertType,
  isOpen,
  onToggle,
}: EditorLeftSidebarProps) {
  if (!isOpen) {
    return (
      <div className="w-10 border-r border-stone-200 bg-paper flex flex-col items-center py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-stone-500 hover:text-stone-900"
          title="사이드바 열기"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-64 min-w-[240px] max-w-xs border-r border-stone-200 bg-paper flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-3 border-b border-stone-100 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-sm text-stone-800">챕터 목록</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-stone-400 hover:text-stone-600"
          title="사이드바 닫기"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Chapter Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <ChapterTree
          chapters={chapters}
          selectedChapterId={selectedChapterId || undefined}
          onSelectChapter={onSelectChapter}
          onAddChapter={onAddChapter}
          onRenameChapter={onRenameChapter}
          onDeleteChapter={onDeleteChapter}
          onDuplicateChapter={onDuplicateChapter}
          onConvertType={onConvertType}
        />
      </div>
    </aside>
  );
}
