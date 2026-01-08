import { type Editor } from "@tiptap/react";
import { motion } from "framer-motion";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Minus,
  Pilcrow,
  Highlighter,
  Type,
  PanelRight,
  Share2,
  Minimize2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/design-system/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      intent="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg",
        "text-mocha-500 hover:text-espresso-900 hover:bg-mocha-400/20",
        isActive && "bg-mocha-400/30 text-mocha-900 shadow-sm"
      )}
      title={tooltip}
    >
      {children}
    </Button>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
  characterCount?: number;
  analysisStatus?: "idle" | "analyzing" | "completed" | "error";
  analysisProgress?: number;
  onToggleFocusMode?: () => void;
  onExport?: () => void;
  onToggleRightSidebar?: () => void;
  rightSidebarOpen?: boolean;
}

export function EditorToolbar({
  editor,
  className,
  characterCount,
  analysisStatus = "idle",
  analysisProgress,
  onToggleFocusMode,
  onExport,
  onToggleRightSidebar,
  rightSidebarOpen = false,
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const currentHeadingLevel =
    [1, 2, 3, 4, 5, 6].find((level) => editor.isActive("heading", { level })) ||
    0;

  const headingIcons: { [key: number]: React.ReactNode } = {
    1: <Heading1 className="h-4 w-4" />,
    2: <Heading2 className="h-4 w-4" />,
    3: <Heading3 className="h-4 w-4" />,
    4: <Heading4 className="h-4 w-4" />,
    5: <Heading5 className="h-4 w-4" />,
    6: <Heading6 className="h-4 w-4" />,
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 px-4 py-[9px] border-b-2 border-mocha-400/30 bg-white shadow-sm sticky top-0 z-10 flex-wrap transition-all",
        className
      )}
    >
      {/* Progress Bar or Decorative Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
        {analysisStatus === "idle" || analysisStatus === "error" ? (
          <div className="w-full h-full bg-gradient-to-r from-transparent via-mocha-400/30 to-transparent" />
        ) : (
          <motion.div
            className={cn(
              "h-full",
              analysisStatus === "completed" ? "bg-green-500" : "bg-mocha-500"
            )}
            initial={{ width: 0, opacity: 1 }}
            animate={{
              width: `${analysisProgress || 0}%`,
              opacity: analysisStatus === "completed" ? [1, 1, 0] : 1, // Fade out after completion
            }}
            transition={{
              width: { duration: 0.5, ease: "easeInOut" },
              opacity: { duration: 0.5, delay: 2 }, // Wait 2s then fade out
            }}
          />
        )}
      </div>

      {/* Undo/Redo */}
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

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Headings Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            intent="ghost"
            size="sm"
            className={cn(
              "px-3 text-small font-bold",
              currentHeadingLevel > 0
                ? "bg-mocha-400/30 text-mocha-900"
                : "text-mocha-500 hover:bg-mocha-400/20 hover:text-espresso-900"
            )}
          >
            <Type className="h-3.5 w-3.5" />
            <span>
              {currentHeadingLevel > 0 ? `H${currentHeadingLevel}` : "본문"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            본문
          </DropdownMenuItem>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <DropdownMenuItem
              key={level}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                  .run()
              }
            >
              <div className="flex items-center gap-2">
                {headingIcons[level]}
                <span>Heading {level}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Text Styles */}
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
        tooltip="기울임 (Cmd+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        tooltip="취소선"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        tooltip="코드"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      {/* Highlight Button */}
      <Button
        intent="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={cn(
          "rounded-lg",
          editor.isActive("highlight")
            ? "bg-mocha-400/30 text-mocha-900"
            : "text-mocha-500 hover:bg-mocha-400/20 hover:text-espresso-900"
        )}
        title="하이라이트"
      >
        <Highlighter className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-mocha-400/30 mx-1" />

      {/* Paragraph Styles */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive("paragraph")}
        tooltip="문단"
      >
        <Pilcrow className="h-4 w-4" />
      </ToolbarButton>

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        tooltip="글머리 기호"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        tooltip="번호 매기기"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        tooltip="인용문"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        tooltip="구분선"
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

      {/* Analysis Status Indicator */}
      {analysisStatus === "analyzing" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5 mr-2 px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100"
          title="AI가 변경사항을 분석 중입니다..."
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs font-bold">분석 중</span>
        </motion.div>
      )}
      {analysisStatus === "completed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }} // 2초 후 사라짐 (부모에서 제어하거나 여기서 exit 처리)
          className="flex items-center gap-1.5 mr-2 px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span className="text-xs font-bold">분석 완료</span>
        </motion.div>
      )}

      {characterCount !== undefined && (
        <motion.div
          initial={false}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3, repeat: 0 }}
          key={characterCount}
          className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-cloud-50 to-white text-mocha-700 border border-mocha-400/50 shadow-sm shrink-0"
        >
          {characterCount.toLocaleString()}자
        </motion.div>
      )}

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
