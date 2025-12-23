import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Clapperboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";

interface TiptapEditorProps {
  onUpdate?: (characterCount: number) => void;
  initialContent?: string;
}

// ToolbarButton을 컴포넌트 외부에 정의
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, children }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-8 w-8", isActive && "bg-sage-100 text-sage-700")}
    >
      {children}
    </Button>
  );
}

const DEFAULT_CONTENT = `
  <h2>2장: 출발</h2>
  <p>"이 검을 가져가거라." 노인이 말했다. <mark data-color="#E8EFE8">#복선:전설의검</mark></p>
  <p>주인공은 아직 이 검의 진정한 힘을 알지 못했다. 그것이 세상을 바꿀 열쇠라는 것을...</p>
  <p></p>
  <p>여명이 밝아오자, 마을 사람들이 하나둘 모여들기 시작했다. 주인공은 배낭을 챙기며 창밖을 바라보았다.</p>
  <p></p>
  <p>"정말 떠나실 건가요?" 어린 소녀가 물었다.</p>
  <p></p>
  <p>"약속했잖아. 꼭 돌아올게."</p>
`;

export default function TiptapEditor({
  onUpdate,
  initialContent,
}: TiptapEditorProps) {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "이야기를 시작하세요... #복선:태그명 형식으로 복선을 추가할 수 있습니다.",
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CharacterCount,
      BubbleMenuExtension,
    ],
    content: initialContent || DEFAULT_CONTENT,
    editorProps: {
      attributes: {
        class:
          "prose prose-stone prose-lg max-w-none focus:outline-none min-h-[500px] px-12 py-8",
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.storage.characterCount.characters());
      }
    },
  });

  useEffect(() => {
    if (editor && onUpdate) {
      onUpdate(editor.storage.characterCount.characters());
    }
  }, [editor, onUpdate]);

  if (!editor) {
    return null;
  }

  const handleSendToStudio = () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    if (text && projectId) {
      navigate(`/projects/${projectId}/studio`, {
        state: { selectedText: text },
      });
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Bubble Menu for Selection */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex overflow-hidden rounded-md border border-stone-200 bg-white shadow-md"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSendToStudio}
            className="flex items-center gap-1.5 h-8 px-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Studio로 보내기
          </Button>
          <div className="w-px h-8 bg-stone-100" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") && "bg-stone-100",
            )}
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") && "bg-stone-100",
            )}
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
        </BubbleMenu>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b bg-stone-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-stone-300 mx-2" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-stone-300 mx-2" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
