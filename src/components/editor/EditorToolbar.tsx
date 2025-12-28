import { type Editor } from "@tiptap/react";
import {
  Bold,
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
  Code,
  Highlighter,
  Type,
  LineChart,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
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
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 w-8 p-0 text-stone-600 hover:text-stone-900",
        isActive && "bg-sage-100 text-sage-800 hover:bg-sage-200"
      )}
      title={tooltip}
    >
      {children}
    </Button>
  );
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  // Get current heading level
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
        "flex items-center gap-0.5 px-3 py-2 border-b bg-stone-50/80 backdrop-blur sticky top-0 z-10 flex-wrap",
        className
      )}
    >
      {/* History */}
      <div className="flex items-center gap-0.5 mr-1">
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

      <div className="w-px h-5 bg-stone-200 mx-1" />

      {/* Heading Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-xs font-medium",
              currentHeadingLevel > 0 && "bg-sage-100 text-sage-800"
            )}
          >
            <Type className="h-3.5 w-3.5 mr-1.5" />
            {currentHeadingLevel === 0
              ? "본문"
              : `제목 ${currentHeadingLevel}`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(!currentHeadingLevel && "bg-sage-50")}
          >
            <Pilcrow className="h-4 w-4 mr-2" />
            본문
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(currentHeadingLevel === 1 && "bg-sage-50")}
          >
            <Heading1 className="h-4 w-4 mr-2" />
            제목 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(currentHeadingLevel === 2 && "bg-sage-50")}
          >
            <Heading2 className="h-4 w-4 mr-2" />
            제목 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(currentHeadingLevel === 3 && "bg-sage-50")}
          >
            <Heading3 className="h-4 w-4 mr-2" />
            제목 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-stone-200 mx-1" />

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
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        tooltip="인라인 코드"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-stone-200 mx-1" />

      {/* Highlight Colors */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              editor.isActive("highlight") && "bg-sage-100 text-sage-800"
            )}
            title="하이라이트"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().unsetHighlight().run()}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-stone-300 rounded" />
              하이라이트 제거
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#E8EFE8" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E8EFE8] rounded border border-stone-300" />
              초록 (복선)
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#FFF4CE" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FFF4CE] rounded border border-stone-300" />
              노랑 (중요)
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#FFE5E5" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#FFE5E5] rounded border border-stone-300" />
              빨강 (수정 필요)
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: "#E5F3FF" }).run()
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E5F3FF] rounded border border-stone-300" />
              파랑 (정보)
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-stone-200 mx-1" />

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

      <div className="w-px h-5 bg-stone-200 mx-1" />

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
    </div>
  );
}
