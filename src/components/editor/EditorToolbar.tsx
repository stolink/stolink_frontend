import { type Editor } from "@tiptap/react";
import {
  Bold,
  PanelLeft,
  PanelRight,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Highlighter,
  Type,
  Minimize2,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  // Others passed but not previously typed? We should type them all to avoid TS errors.
  // Based on usage in EditorPage.tsx line 636+:
  currentFolderTitle?: string;
  currentSectionTitle?: string;
  sectionPath?: Array<{ id: string; title: string }>;
  isEditingTitle?: boolean;
  editedTitle?: string;
  onEditedTitleChange?: (val: string) => void;
  onStartEditTitle?: () => void;
  onSaveTitle?: () => void;
  onCancelEditTitle?: () => void;
  isDemo?: boolean;
  selectedSectionId?: string | null;
  characterCount?: number;
  viewMode?: "editor" | "board"; // simplified
  onViewModeChange?: (mode: "editor" | "board") => void;
  splitViewEnabled?: boolean;
  onToggleSplitView?: () => void;
  onToggleFocusMode?: () => void;
  isTypewriterMode?: boolean;
  onToggleTypewriterMode?: () => void;
  onShowReader?: () => void;
  onToggleSnapshot?: () => void;
  onExport?: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.08 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={cn(
        "h-8 w-8 p-0 rounded-lg flex items-center justify-center transition-colors duration-200",
        "text-mocha-500 hover:text-espresso-900 hover:bg-mocha-400/20",
        isActive && "bg-mocha-400/30 text-mocha-900 shadow-sm",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      title={tooltip}
    >
      {children}
    </motion.button>
  );
}

export function EditorToolbar({
  editor,
  className,
  isSidebarVisible,
  onToggleSidebar,
  rightSidebarOpen,
  onToggleRightSidebar,
  onToggleFocusMode,
  onExport,
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const currentHeadingLevel = editor.isActive("heading", { level: 1 })
    ? 1
    : editor.isActive("heading", { level: 2 })
      ? 2
      : editor.isActive("heading", { level: 3 })
        ? 3
        : 0;

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 px-4 py-[9px] border-b-2 border-mocha-400/30 bg-white shadow-sm sticky top-0 z-10 flex-wrap transition-all",
        className,
      )}
    >
      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-mocha-300 via-mocha-500 to-mocha-300 opacity-60" />

      {/* Left Sidebar Toggle */}
      {onToggleSidebar && (
        <ToolbarButton
          onClick={onToggleSidebar}
          isActive={isSidebarVisible}
          tooltip="목차 (Cmd/Ctrl+\)"
        >
          <PanelLeft className="h-4 w-4" />
        </ToolbarButton>
      )}

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* History */}
      <div className="flex items-center gap-0.5 mr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="실행 취소 (Cmd+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="다시 실행 (Cmd+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Heading Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors",
              currentHeadingLevel > 0
                ? "bg-mocha-400/30 text-mocha-900"
                : "text-mocha-500 hover:bg-mocha-400/20 hover:text-espresso-900",
            )}
          >
            <Type className="h-3.5 w-3.5" />
            {currentHeadingLevel === 0 ? "본문" : `제목 ${currentHeadingLevel}`}
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-40 border-mocha-100 shadow-lg shadow-mocha-200/20"
        >
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(!currentHeadingLevel && "bg-mocha-400/10")}
          >
            <Pilcrow className="h-4 w-4 mr-2 text-mocha-500" />
            본문
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-mocha-400/20" />
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={cn(currentHeadingLevel === 1 && "bg-mocha-400/10")}
          >
            <Heading1 className="h-4 w-4 mr-2 text-mocha-500" />
            제목 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(currentHeadingLevel === 2 && "bg-mocha-400/10")}
          >
            <Heading2 className="h-4 w-4 mr-2 text-mocha-500" />
            제목 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={cn(currentHeadingLevel === 3 && "bg-mocha-400/10")}
          >
            <Heading3 className="h-4 w-4 mr-2 text-mocha-500" />
            제목 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Basic Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        tooltip="굵게 (Cmd+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        tooltip="이탤릭 (Cmd+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        tooltip="밑줄 (Cmd+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        tooltip="취소선"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Highlight Colors */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
              editor.isActive("highlight")
                ? "bg-mocha-400/30 text-mocha-900"
                : "text-mocha-500 hover:bg-mocha-400/20 hover:text-espresso-900",
            )}
            title="하이라이트"
          >
            <Highlighter className="h-4 w-4" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-48 border-mocha-100 shadow-lg shadow-mocha-200/20"
        >
          <DropdownMenuItem
            onClick={() => editor.chain().focus().unsetHighlight().run()}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-mocha-200 rounded" />
              하이라이트 제거
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-mocha-100" />
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#E8EFE8" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E8EFE8] rounded border border-mocha-200" />
              초록 (복선)
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#FFF4CE" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FFF4CE] rounded border border-mocha-200" />
              노랑 (중요)
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#FFE5E5" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FFE5E5] rounded border border-mocha-200" />
              빨강 (수정 필요)
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#E5F3FF" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E5F3FF] rounded border border-mocha-200" />
              파랑 (정보)
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        tooltip="왼쪽 정렬"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        tooltip="가운데 정렬"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        tooltip="오른쪽 정렬"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Lists & Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        tooltip="글머리 기호 목록"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        tooltip="번호 매기기 목록"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        tooltip="인용구"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        tooltip="구분선 삽입"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <div className="flex items-center gap-1 ml-2">
        {onToggleFocusMode && (
          <ToolbarButton onClick={onToggleFocusMode} tooltip="집중 모드 (F11)">
            <Minimize2 className="h-4 w-4" />
          </ToolbarButton>
        )}
        {onExport && (
          <ToolbarButton onClick={onExport} tooltip="내보내기">
            <Share2 className="h-4 w-4" />
          </ToolbarButton>
        )}
      </div>

      <div className="flex-1" />
      <motion.div
        initial={false}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.3, repeat: 0 }}
        key={editor.storage.characterCount.characters()}
        className="text-[10px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-cloud-50 to-white text-mocha-700 border border-mocha-400/50 shadow-sm shrink-0"
      >
        {editor.storage.characterCount.characters().toLocaleString()}자 ·{" "}
        {editor.storage.characterCount.words().toLocaleString()}단어
      </motion.div>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Right Sidebar Toggle */}
      {onToggleRightSidebar && (
        <ToolbarButton
          onClick={onToggleRightSidebar}
          isActive={rightSidebarOpen}
          tooltip="도구 패널 (Cmd/Ctrl+])"
        >
          <PanelRight className="h-4 w-4" />
        </ToolbarButton>
      )}
    </div>
  );
}
