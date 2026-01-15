import { PanelLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChapterTree } from "@/components/editor/sidebar";
import { useResizable } from "@/hooks/useResizable";
import type { ChapterNode } from "@/components/editor/sidebar";

import type { Document } from "@/types/document";

interface EditorLeftSidebarProps {
  chapters: ChapterNode[];
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: (
    title: string,
    parentId?: string,
    type?: "chapter" | "section",
  ) => Promise<Document | null>;
  onRenameChapter: (id: string, newTitle: string) => void;
  onDeleteChapter: (id: string) => void;
  onReorderChapter: (parentId: string | null, orderedIds: string[]) => void;
  onMoveToFolder: (itemId: string, targetFolderId: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
  projectTitle?: string;
  totalChars?: number;
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
  projectTitle,
  totalChars = 0,
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
        className="hidden md:flex shrink-0 overflow-visible relative group/sidebar z-20"
      >
        {/* Organic Background: No hard border, subtle glass or just transparent */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-500 rounded-r-2xl" />

        {/* Main Sidebar Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10">
          {/* Header - Expanded to cover Toolbar + Formatting Bar (~104px) */}
          <div className="h-[104px] min-h-[104px] px-5 pb-3 pt-5 flex flex-col justify-between shrink-0 relative bg-gradient-to-b from-white/60 to-transparent group/header">
            {/* Elegant Separator Line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mocha-200/50 to-transparent opacity-80" />

            {/* Top Row: Icon + Title */}
            <div className="flex items-start gap-3 select-none">
              <div className="w-9 h-9 mt-0.5 rounded-xl bg-gradient-to-br from-white to-cloud-50 shadow-sm flex items-center justify-center ring-1 ring-black/5 shrink-0">
                <BookOpen className="h-4.5 w-4.5 text-mocha-700" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-mocha-400 uppercase tracking-widest mb-0.5">
                  Project
                </span>
                <h2
                  className="text-base font-bold text-espresso-900 font-serif leading-tight truncate pr-2"
                  title={projectTitle}
                >
                  {projectTitle || "제목 없음"}
                </h2>
              </div>
            </div>

            {/* Bottom Row: Minimal Stats */}
            <div className="flex items-center gap-3 pl-1">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-mocha-50/50 rounded-md border border-mocha-100/30">
                <span className="text-[10px] font-bold text-mocha-400 uppercase">
                  Total
                </span>
                <span className="text-xs font-semibold text-espresso-800 font-mono">
                  {totalChars.toLocaleString()}자
                </span>
              </div>
            </div>
          </div>

          {/* Chapter Tree */}
          <div className="flex-1 overflow-y-auto pl-3 pr-2 py-3 scrollbar-thin scrollbar-thumb-mocha-200/50 scrollbar-track-transparent">
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

        {/* Resize Handle - Invisible but interactable */}
        <div className="h-full flex flex-col shrink-0 relative w-[4px]">
          <div
            onMouseDown={startResizing}
            className="absolute right-0 top-0 w-[4px] h-full cursor-col-resize z-50 hover:bg-mocha-400/20 active:bg-mocha-400/40 transition-colors rounded-full my-auto h-[90%]"
            title="드래그하여 크기 조절"
          />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
