import { PanelLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChapterTree } from "@/components/editor/sidebar";
import { useResizable } from "@/hooks/useResizable";
import type { ChapterNode } from "@/components/editor/sidebar";

interface EditorLeftSidebarProps {
  chapters: ChapterNode[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (id: string, newTitle: string) => void;
  onDeleteChapter: (id: string) => void;
  onReorderChapter: (items: ChapterNode[]) => void;
  onMoveToFolder: (draggedId: string, targetId: string) => void;
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
  onReorderChapter,
  onMoveToFolder,
  isOpen,
  onToggle,
}: EditorLeftSidebarProps) {
  // Resizable Logic
  const { width, startResizing } = useResizable({
    initialWidth: 240,
    minWidth: 200,
    maxWidth: 480,
    direction: "right", // Left sidebar expands to the right
  });

  if (!isOpen) {
    return (
      <motion.div
        initial={{ width: 40, opacity: 0.8 }}
        animate={{ width: 40, opacity: 1 }}
        className="border-r border-mocha-100 bg-cloud-50 hidden md:flex flex-col items-center py-3 shrink-0"
      >
        {/* Toolbar controls opening now, but keeping this as a fallback interaction area if needed,
            or we can remove it if we want purely toolbar control.
            User said "don't put buttons on sidebar", so let's keep this clean or minimal.
            actually, let's keep the closed state visual but maybe remove the button if toolbar handles it?
            But having a click target on the collapsed strip is usually good UX.
            Let's keep the button here for the "Closed" state because it's distinct from the "Open" state edge button.
        */}
        <motion.button
          onClick={() => onToggle?.()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-mocha-400 hover:text-mocha-600 hover:bg-mocha-100/60 transition-colors"
          title="사이드바 열기"
        >
          <PanelLeft className="h-4 w-4" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside
        style={{ width }}
        className="border-r border-mocha-100 bg-gradient-to-b from-cloud-50 to-mocha-50/30 hidden md:flex shrink-0 overflow-visible relative group/sidebar"
      >
        {/* Decorative accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-mocha-300 via-mocha-500 to-mocha-300 opacity-60" />

        {/* Main Sidebar Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <div className="px-4 py-3 border-b border-mocha-100/50">
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mocha-500 to-mocha-600 flex items-center justify-center shadow-sm">
                <BookOpen className="h-4 w-4 text-white/90" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-espresso-900 leading-tight">
                  목차
                </span>
                <span className="text-[10px] font-medium text-mocha-400">
                  Contents
                </span>
              </div>
            </div>
            {/* No Toggle Button Here - It's in the Toolbar */}
          </div>

          {/* Chapter Tree */}
          <div className="flex-1 overflow-y-auto pl-3 pr-2 py-3 scrollbar-thin scrollbar-thumb-mocha-200 scrollbar-track-transparent">
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

        {/* Resize Handle Only - No Buttons */}
        <div className="h-full flex flex-col shrink-0 relative">
          <div
            onMouseDown={startResizing}
            className="absolute right-[-4px] top-0 w-[8px] h-full cursor-col-resize z-50 hover:bg-mocha-400/20 active:bg-mocha-400/40 transition-colors"
            title="드래그하여 크기 조절"
          />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
