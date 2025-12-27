import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Bold, Italic, Clapperboard, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { CharacterMention } from "./extensions/CharacterMention";
import { SlashCommandExtension } from "./extensions/SlashCommand";
import { sanitizeEditorContent } from "@/lib/sanitize";
import "./editor-prose.css";

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

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 10;

export default function TiptapEditor({
  onUpdate,
  onContentChange,
  initialContent,
  readOnly = false,
  hideToolbar = false,
}: TiptapEditorProps) {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  // Use refs for callbacks to avoid dependency issues
  const onUpdateRef = useRef(onUpdate);
  const onContentChangeRef = useRef(onContentChange);

  // Update refs when callbacks change
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Memoize extensions to prevent duplicate registration
  const extensions = useMemo(() => {
    const exts = [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "마크다운(#, ##, > 등)으로 자유롭게 내용을 입력하세요...",
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CharacterCount,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      CharacterMention,
      SlashCommandExtension,
    ];

    return exts;
  }, []); // Empty deps - extensions are static

  const editor = useEditor(
    {
      editable: !readOnly,
      extensions,
      content: sanitizeEditorContent(initialContent || DEFAULT_CONTENT),
      editorProps: {
        attributes: {
          class: cn(
            // Remove prose class - use direct styling for full width
            "w-full",
            "focus:outline-none min-h-[500px] px-6 py-6",
            readOnly && "pointer-events-none opacity-80",
          ),
          spellcheck: "false",
        },
        handleDOMEvents: {
          beforeinput: () => {
            if (editorContainerRef.current) {
              scrollPositionRef.current = editorContainerRef.current.scrollTop;
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor }) => {
        if (onUpdateRef.current) {
          onUpdateRef.current(editor.storage.characterCount.characters());
        }
        if (onContentChangeRef.current) {
          onContentChangeRef.current(editor.getHTML());
        }
      },
      onTransaction: () => {
        requestAnimationFrame(() => {
          if (editorContainerRef.current && scrollPositionRef.current > 0) {
            editorContainerRef.current.scrollTop = scrollPositionRef.current;
          }
        });
      },
    },
    [extensions], // Add dependency array to prevent recreation
  );

  // Smooth zoom with bounds
  const adjustZoom = useCallback((delta: number) => {
    setZoom((prev) => {
      const newZoom = Math.round(prev + delta);
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    });
    setShowZoomControls(true);
  }, []);

  const handleZoomIn = useCallback(() => adjustZoom(ZOOM_STEP), [adjustZoom]);
  const handleZoomOut = useCallback(() => adjustZoom(-ZOOM_STEP), [adjustZoom]);

  // Hide zoom controls after inactivity
  useEffect(() => {
    if (showZoomControls) {
      const timer = setTimeout(() => setShowZoomControls(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showZoomControls, zoom]);

  // Trackpad pinch-to-zoom & Ctrl+scroll (smooth)
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Smooth zoom based on wheel delta
        const delta = -e.deltaY * 0.5; // Smaller multiplier for smoother zoom
        adjustZoom(delta);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [adjustZoom]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  useEffect(() => {
    if (editor && onUpdateRef.current) {
      requestAnimationFrame(() => {
        onUpdateRef.current?.(editor.storage.characterCount.characters());
      });
    }
  }, [editor]);

  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentHTML = editor.getHTML();
      const sanitizedContent = sanitizeEditorContent(initialContent);
      const isDifferent = currentHTML !== sanitizedContent;
      const isFocused = editor.isFocused;

      // Only update if content is different AND editor is not focused
      // If focused, we assume the user is typing and we shouldn't overwrite with old server data
      if (isDifferent && !isFocused) {
        editor.commands.setContent(sanitizedContent);
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

  // Base font size at 100% = 18px (1.125rem)
  const baseFontSize = 18;
  const fontSize = (zoom / 100) * baseFontSize;

  return (
    <div className="flex flex-col h-full relative">
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
            aria-label="Studio로 보내기"
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
            aria-label="굵게"
            aria-pressed={editor.isActive("bold")}
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
            aria-label="기울임"
            aria-pressed={editor.isActive("italic")}
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
      {!hideToolbar && !readOnly && <EditorToolbar editor={editor} />}

      {/* Editor Content - Full width with font-size based zoom */}
      <div
        ref={editorContainerRef}
        role="region"
        aria-label="편집 영역"
        className="flex-1 overflow-y-auto w-full"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.75,
        }}
      >
        <EditorContent editor={editor} className="w-full" />
      </div>

      {/* Minimal Zoom Indicator - Bottom right */}
      {!hideToolbar && (
        <div
          className={cn(
            "absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-stone-200 rounded-lg shadow-sm transition-all duration-200",
            showZoomControls
              ? "opacity-100 px-2 py-1.5"
              : "opacity-50 hover:opacity-100 px-2 py-1",
          )}
          onMouseEnter={() => setShowZoomControls(true)}
          onMouseLeave={() => setShowZoomControls(false)}
        >
          {showZoomControls ? (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="축소"
                className="p-1 hover:bg-stone-100 rounded disabled:opacity-30 transition-colors"
                title="축소 (Ctrl + 스크롤)"
              >
                <ZoomOut className="w-4 h-4 text-stone-600" />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                aria-label={`확대/축소: ${zoom}%`}
                className="w-16 h-1 accent-sage-500 cursor-pointer"
              />
              <button
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="확대"
                className="p-1 hover:bg-stone-100 rounded disabled:opacity-30 transition-colors"
                title="확대 (Ctrl + 스크롤)"
              >
                <ZoomIn className="w-4 h-4 text-stone-600" />
              </button>
              <span className="text-xs text-stone-500 ml-1 min-w-[36px] text-right">
                {zoom}%
              </span>
            </>
          ) : (
            <span className="text-xs text-stone-500">{zoom}%</span>
          )}
        </div>
      )}
    </div>
  );
}
