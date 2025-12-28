import { useEditor, EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Bold, Italic, Clapperboard, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { CharacterMention } from "./extensions/CharacterMention";
import { SlashCommandExtension } from "./extensions/SlashCommand";
import { TypewriterScroll } from "./extensions/TypewriterScroll";
import { FocusMode } from "./extensions/FocusMode";
import { SmartPunctuation } from "./extensions/SmartPunctuation";
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { getEditorCSSVariables } from "@/lib/editor-styles";
import { sanitizeEditorContent } from "@/lib/sanitize";
import "./editor-prose.css";

export interface TiptapEditorProps {
  onUpdate?: (characterCount: number) => void;
  onContentChange?: (content: string) => void;
  onCreateSection?: (title: string) => void; // 슬래시 커맨드로 섹션 생성
  initialContent?: string;
  readOnly?: boolean;
  hideToolbar?: boolean;
  // Note: isTypewriterMode prop removed - now handled by useEditorSettingStore + TypewriterScroll extension
}

export interface TiptapEditorHandle {
  getSplitContent: () => { before: string; after: string } | null;
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

const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  (
    {
      onUpdate,
      onContentChange,
      onCreateSection,
      initialContent,
      readOnly = false,
      hideToolbar = false,
    },
    ref
  ) => {
    const navigate = useNavigate();
    const { id: projectId } = useParams<{ id: string }>();
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);

    // Use refs for callbacks to avoid dependency issues
    const onUpdateRef = useRef(onUpdate);
    const onContentChangeRef = useRef(onContentChange);
    const onCreateSectionRef = useRef(onCreateSection);

    // Update refs when callbacks change
    useEffect(() => {
      onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
      onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

    useEffect(() => {
      onCreateSectionRef.current = onCreateSection;
    }, [onCreateSection]);

    const [showZoomControls, setShowZoomControls] = useState(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number>(0);

    // Get settings from the store
    const typography = useEditorSettingStore((s) => s.typography);
    const visual = useEditorSettingStore((s) => s.visual);
    const behavior = useEditorSettingStore((s) => s.behavior);

    // Destructure behavior settings
    const typewriterMode = behavior?.typewriterMode ?? "off";
    const focusModeEnabled = behavior?.focusMode ?? false;
    const smartQuotes = behavior?.smartQuotes ?? true;
    const smartDashes = behavior?.smartDashes ?? true;
    const smartEllipsis = behavior?.smartEllipsis ?? true;

    // Get CSS variables and theme class from settings
    const editorSettings = {
      typography: typography ?? {
        fontFamily: "pretendard" as const,
        fontSize: 16,
        lineHeight: 1.8,
        letterSpacing: 0,
        paragraphSpacing: 0.5,
        indent: 0,
      },
      visual: visual ?? {
        theme: "light" as const,
        width: "standard" as const,
        showLineNumbers: false,
        highlightCurrentLine: true,
        caretStyle: { width: 2, blink: "blink" as const },
      },
      behavior: behavior ?? {
        typewriterMode: "off" as const,
        typewriterSmoothScroll: true,
        focusMode: false,
        zenMode: false,
        smartQuotes: true,
        smartDashes: true,
        smartEllipsis: true,
        linguisticMode: "off" as const,
      },
      system: {
        autoSaveInterval: "5s" as const,
        overscroll: true,
      },
    };

    const cssVariables = getEditorCSSVariables(editorSettings);

    // Memoize extensions - no dependencies to prevent editor recreation
    // Settings are applied via commands after editor creation
    const extensions = useMemo(() => {
      const exts = [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder:
            "마크다운(#, ##, > 등)으로 자유롭게 내용을 입력하세요...",
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
        SlashCommandExtension.configure({
          onCreateSection: (title: string) => {
            onCreateSectionRef.current?.(title);
          },
        }),
        TypewriterScroll.configure({
          position: "off",
          smoothScroll: true,
          threshold: 5,
        }),
        // FocusMode and SmartPunctuation disabled due to type compatibility issues
        // TODO: Fix these extensions in a future update
        // FocusMode.configure({
        //   enabled: false,
        // }),
        // SmartPunctuation.configure({
        //   smartQuotes,
        //   smartDashes,
        //   smartEllipsis,
        // }),
      ];

      return exts;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const editor = useEditor({
      editable: !readOnly,
      extensions,
      content: sanitizeEditorContent(initialContent || DEFAULT_CONTENT),
      editorProps: {
        attributes: {
          class: cn(
            // Remove prose class - use direct styling for full width
            "w-full",
            "focus:outline-none min-h-[500px] px-6 py-6",
            readOnly && "pointer-events-none opacity-80"
          ),
          spellcheck: "false",
        },
        // Note: handleScrollToSelection for typewriter mode now handled by TypewriterScroll extension
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
      // Note: Typewriter scroll now handled by TypewriterScroll extension
      onTransaction: () => {
        requestAnimationFrame(() => {
          if (editorContainerRef.current && scrollPositionRef.current > 0) {
            editorContainerRef.current.scrollTop = scrollPositionRef.current;
          }
        });
      },
    });

    // Apply typewriter mode setting when it changes
    useEffect(() => {
      if (editor && editor.commands.setTypewriterPosition) {
        try {
          editor.commands.setTypewriterPosition(typewriterMode);
        } catch (e) {
          console.warn("Failed to set typewriter position:", e);
        }
      }
    }, [editor, typewriterMode]);

    // Focus mode useEffect disabled - extension commented out
    // useEffect(() => {
    //   if (editor && editor.commands.setFocusMode) {
    //     try {
    //       editor.commands.setFocusMode(focusModeEnabled);
    //     } catch (e) {
    //       console.warn("Failed to set focus mode:", e);
    //     }
    //   }
    // }, [editor, focusModeEnabled]);

    // Expose split functionality via ref
    useImperativeHandle(ref, () => ({
      getSplitContent: () => {
        if (!editor) return null;

        const { from } = editor.state.selection;
        const json = editor.getJSON();

        // Create a temporary headless editor to safely update content
        // This ensures HTML structure is preserved when splitting
        // Note: Using the same extensions configuration
        const tempEditor = new Editor({
          extensions,
          content: json,
        });

        const totalSize = tempEditor.state.doc.content.size;

        // 1. Get content AFTER cursor (Back Part)
        // Delete everything before cursor
        tempEditor.commands.deleteRange({ from: 0, to: from });
        const after = tempEditor.getHTML();

        // Reset temporary editor
        tempEditor.commands.setContent(json);

        // 2. Get content BEFORE cursor (Front Part)
        // Delete everything after cursor
        // Note: from is now the end point
        tempEditor.commands.deleteRange({ from: from, to: totalSize });
        const before = tempEditor.getHTML();

        // Destroy temporary editor to free resources
        tempEditor.destroy();

        return { before, after };
      },
    }));

    // Smooth zoom with bounds
    const adjustZoom = useCallback((delta: number) => {
      setZoom((prev) => {
        const newZoom = Math.round(prev + delta);
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      });
      setShowZoomControls(true);
    }, []);

    const handleZoomIn = useCallback(() => adjustZoom(ZOOM_STEP), [adjustZoom]);
    const handleZoomOut = useCallback(
      () => adjustZoom(-ZOOM_STEP),
      [adjustZoom]
    );

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

    // Apply zoom to the base font size from settings
    const baseFontSize = editorSettings.typography.fontSize;
    const fontSize = (zoom / 100) * baseFontSize;

    // Editor width mapping
    const widthMap: Record<string, string> = {
      narrow: "640px",
      standard: "720px",
      wide: "960px",
      full: "100%",
    };
    const editorWidth = widthMap[editorSettings.visual.width] || "720px";

    return (
      <div className={cn("flex flex-col h-full relative")}>
        {/* Bubble Menu for Selection */}
        {editor && !readOnly && (
          <BubbleMenu
            editor={editor}
            className="flex overflow-hidden rounded-md border border-border bg-card shadow-md z-50"
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
            <div className="w-px h-8 bg-muted" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="굵게"
              aria-pressed={editor.isActive("bold")}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("bold") && "bg-muted"
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
                editor.isActive("italic") && "bg-muted"
              )}
            >
              <Italic className="w-3.5 h-3.5" />
            </Button>
          </BubbleMenu>
        )}

        {/* Toolbar */}
        {!hideToolbar && !readOnly && <EditorToolbar editor={editor} />}

        {/* Editor Content - Apply settings from store */}
        <div
          ref={editorContainerRef}
          role="region"
          aria-label="편집 영역"
          className="flex-1 overflow-y-auto w-full"
          style={
            {
              backgroundColor:
                cssVariables["--st-editor-bg-color"] || "#F8F8F7",
              color: cssVariables["--st-editor-text-color"] || "#2D2A28",
              "--st-editor-text-indent":
                cssVariables["--st-editor-text-indent"],
              "--st-editor-paragraph-spacing":
                cssVariables["--st-editor-paragraph-spacing"],
              "--st-editor-selection-color":
                cssVariables["--st-editor-selection-color"],
            } as React.CSSProperties
          }
        >
          <div
            className={cn(
              "px-6 py-6",
              editorSettings.visual.width !== "full" && "mx-auto"
            )}
            style={{
              maxWidth: editorWidth,
              fontFamily: cssVariables["--st-editor-font-family"],
              fontSize: `${fontSize}px`,
              lineHeight: editorSettings.typography.lineHeight,
              letterSpacing: `${editorSettings.typography.letterSpacing}em`,
            }}
          >
            <EditorContent editor={editor} className="w-full" />
          </div>
        </div>

        {/* Minimal Zoom Indicator - Bottom right */}
        {!hideToolbar && (
          <div
            className={cn(
              "absolute bottom-3 right-3 flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-sm transition-all duration-200",
              showZoomControls
                ? "opacity-100 px-2 py-1.5"
                : "opacity-50 hover:opacity-100 px-2 py-1"
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
                  className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors"
                  title="축소 (Ctrl + 스크롤)"
                >
                  <ZoomOut className="w-4 h-4 text-foreground" />
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
                  className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors"
                  title="확대 (Ctrl + 스크롤)"
                >
                  <ZoomIn className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-xs text-muted-foreground ml-1 min-w-[36px] text-right">
                  {zoom}%
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{zoom}%</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
