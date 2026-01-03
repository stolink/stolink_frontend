import { BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
}: EditorLeftSidebarProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 280, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="border-r border-mocha-100 bg-gradient-to-b from-cloud-50 to-mocha-50/30 hidden md:flex shrink-0 overflow-hidden relative"
      >
        {/* Decorative accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-mocha-300 via-mocha-500 to-mocha-300 opacity-60" />

        {/* Main Sidebar Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
      </motion.aside>
    </AnimatePresence>
  );
}
