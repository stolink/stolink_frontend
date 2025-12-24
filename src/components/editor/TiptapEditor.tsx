import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { Bold, Italic, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { EditorToolbar } from "@/components/editor/EditorToolbar";

export interface TiptapEditorProps {
  onUpdate?: (characterCount: number) => void;
  onContentChange?: (content: string) => void;
  initialContent?: string;
  readOnly?: boolean;
  hideToolbar?: boolean;
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
  onContentChange,
  initialContent,
  readOnly = false,
  hideToolbar = false,
}: TiptapEditorProps) {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();

  const editor = useEditor({
    editable: !readOnly,
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
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content: initialContent || DEFAULT_CONTENT,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-stone prose-lg max-w-none focus:outline-none min-h-[500px] px-12 py-8",
          readOnly && "pointer-events-none opacity-80", // 읽기 전용 스타일
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Character count is cheap - update immediately
      if (onUpdate) {
        onUpdate(editor.storage.characterCount.characters());
      }
      // getHTML is expensive - only call if needed
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Initial character count (only on mount)
  useEffect(() => {
    if (editor && onUpdate) {
      // Use requestAnimationFrame to defer
      requestAnimationFrame(() => {
        onUpdate(editor.storage.characterCount.characters());
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]); // Intentionally exclude onUpdate to prevent loops

  // initialContent 변경 감지하여 에디터 내용 업데이트 (씬 전환 시)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== initialContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  const handleSendToStudio = () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    if (!text?.trim()) {
      return;
    }

    if (projectId) {
      navigate(`/projects/${projectId}/studio`, {
        state: { selectedText: text },
      });
    }
  };

  return (
    <div className="flex flex-col h-full relative group">
      {/* Bubble Menu for Selection */}
      {editor && !readOnly && (
        <BubbleMenu
          editor={editor}
          className="flex overflow-hidden rounded-md border border-stone-200 bg-white shadow-md z-50"
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

      {/* Toolbar - Focus Mode 혹은 readOnly일 때 숨김 가능 or readOnly여도 툴바는 볼 수 있음?
          보통 readOnly는 툴바도 안 보임. */}
      {!hideToolbar && !readOnly && <EditorToolbar editor={editor} />}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
