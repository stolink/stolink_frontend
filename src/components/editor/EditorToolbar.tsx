import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
        isActive && "bg-sage-100 text-sage-800 hover:bg-sage-200",
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

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 px-2 py-1.5 border-b bg-stone-50/80 backdrop-blur sticky top-0 z-10",
        className,
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

      {/* Typography */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-stone-600 gap-1 font-normal"
          >
            {editor.isActive("heading", { level: 1 })
              ? "제목 1"
              : editor.isActive("heading", { level: 2 })
                ? "제목 2"
                : editor.isActive("heading", { level: 3 })
                  ? "제목 3"
                  : "본문"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            본문
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4 mr-2" /> 제목 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4 mr-2" /> 제목 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4 mr-2" /> 제목 3
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
