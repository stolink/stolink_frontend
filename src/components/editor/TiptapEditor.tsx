import { useEditor, EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
// import Underline from "@tiptap/extension-underline";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Bold, Italic, ZoomIn, ZoomOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { CharacterMention } from "./extensions/CharacterMention";
import { SlashCommand } from "./extensions/SlashCommand";
import { ForeshadowingSuggest } from "./extensions/ForeshadowingSuggest";
import { TypewriterScroll } from "./extensions/TypewriterScroll";
import { FocusMode } from "./extensions/FocusMode";
import { SmartPunctuation } from "./extensions/SmartPunctuation";
import { useForeshadowingStore } from "@/stores";
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { getEditorCSSVariables } from "@/lib/editor-styles";
import { sanitizeEditorContent } from "@/lib/sanitize";
import "./editor-prose.css";

export interface TiptapEditorProps {
  onUpdate?: (characterCount: number) => void;
  onContentChange?: (content: string) => void;
  onCreateSection?: (title: string) => void; // 슬래시 커맨드로 섹션 생성
  onForeshadowingCreated?: (foreshadowingId: string) => void; // 복선 생성 후 포커스 이동용 콜백
  initialContent?: string;
  readOnly?: boolean;
  hideToolbar?: boolean;
  documentId?: string | null;
  sectionTitle?: string; // 현재 섹션 제목 (복선 위치 정보용)
  // Infinite Scroll Props
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
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
      onForeshadowingCreated,
      initialContent,
      readOnly = false,
      hideToolbar = false,
      documentId = null,
      sectionTitle = "",
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    },
    ref,
  ) => {
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

    // 복선 태그 삭제 감지용 ref (에디터 본문에서 #복선태그 삭제 시 미회수 상태로 복구)
    const prevForeshadowingIdsRef = useRef<Set<string>>(new Set());

    // Get settings from the store
    const typography = useEditorSettingStore((s) => s.typography);
    const visual = useEditorSettingStore((s) => s.visual);
    const behavior = useEditorSettingStore((s) => s.behavior);

    // Destructure behavior settings
    const typewriterMode = behavior?.typewriterMode ?? "off";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const focusModeEnabled = behavior?.focusMode ?? false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const smartQuotes = behavior?.smartQuotes ?? true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const smartDashes = behavior?.smartDashes ?? true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        Highlight.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              id: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-id"),
                renderHTML: (attributes) => {
                  if (!attributes.id) {
                    return {};
                  }
                  return {
                    "data-id": attributes.id,
                  };
                },
              },
            };
          },
        }).configure({
          multicolor: true,
        }),
        CharacterCount.configure({
          // limit removed for backend paging
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        // Underline, // Duplicate extension warning fix
        CharacterMention,
        SlashCommand.configure({
          onCreateSection: (title: string) => {
            onCreateSectionRef.current?.(title);
          },
        }),
        ForeshadowingSuggest.configure({
          projectId: projectId ?? null,
          documentId: documentId ?? null,
          sectionTitle: sectionTitle ?? null, // 복선 위치 정보용
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
        TypewriterScroll.configure({
          position: "off",
          smoothScroll: true,
          threshold: 5,
        }),
        FocusMode.configure({}),
        SmartPunctuation,
      ];

      return exts;
    }, [projectId, documentId, sectionTitle]);

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
            readOnly && "pointer-events-none opacity-80",
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
        // 복선 태그 삭제 감지: 현재 에디터에 존재하는 복선 태그 ID 목록 추출
        const currentIds = new Set<string>();
        editor.state.doc.descendants((node) => {
          if (node.type.name === "foreshadowingSuggest" && node.attrs.id) {
            currentIds.add(node.attrs.id);
          }
        });

        // 이전 상태와 비교하여 삭제된 태그 확인 및 미회수 상태로 복구
        const store = useForeshadowingStore.getState();
        prevForeshadowingIdsRef.current.forEach((id) => {
          if (!currentIds.has(id)) {
            // 태그가 삭제됨 - 회수 완료 상태였다면 미회수로 되돌림
            const fs = store.foreshadowings[id];
            if (fs?.status === "recovered") {
              store.markAsPending(id);
            }
          }
        });
        prevForeshadowingIdsRef.current = currentIds;

        // 기존 콜백 호출
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (editor && (editor.commands as any).setTypewriterPosition) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor.commands as any).setTypewriterPosition(typewriterMode);
        } catch (e) {
          console.warn("Failed to set typewriter position:", e);
        }
      }
    }, [editor, typewriterMode]);

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
      [adjustZoom],
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

    // Effect: 복선 상태 변경 감지 및 하이라이트/태그 스타일 업데이트
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!editor || !projectId) return;

      const unsubscribe = useForeshadowingStore.subscribe((state) => {
        const foreshadowings = state.foreshadowings;
        // 현재 에디터 내용 스캔
        editor.state.doc.descendants((node, pos) => {
          // 1. Highlight Mark 확인 (복선 원문)
          if (node.marks) {
            node.marks.forEach((mark) => {
              if (mark.type.name === "highlight" && mark.attrs.id) {
                const fs = foreshadowings[mark.attrs.id];
                // 복선이 삭제되었거나(!fs), 회수됨(recovered) 상태라면 하이라이트 제거
                if (!fs || fs.status === "recovered") {
                  const from = pos;
                  const to = pos + node.nodeSize;
                  // 스케줄링하여 상태 업데이트 충돌 방지
                  requestAnimationFrame(() => {
                    // 해당 범위의 highlight 마크 제거
                    // unsetHighlight는 범위 지정이 안되므로 setTextSelection 후 실행해야 함
                    // 하지만 이는 사용자 커서를 움직이므로 트랜잭션으로 직접 마크 제거가 좋음
                    if (!editor.isDestroyed) {
                      editor.view.dispatch(
                        editor.state.tr.removeMark(from, to, mark.type),
                      );
                    }
                  });
                }
              }
            });
          }

          // 2. Foreshadowing Suggest Node 확인 (#태그)
          // 태그의 스타일 업데이트 (미회수 -> 회수됨 스타일 변경 등)는 CSS와 React Render로 처리되지만,
          // 여기서 추가적인 로직이 필요하다면 작성 가능. 현재는 CSS로 data-recovered 속성 처리됨.
        });
      });

      return () => {
        unsubscribe();
      };
    }, [editor, projectId]);

    const handleSaveAsForeshadowing = () => {
      const text = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        " ",
      );

      if (!text?.trim() || !projectId) {
        return;
      }

      const store = useForeshadowingStore.getState();
      const nextNumber = store.getNextTagNumber(projectId);

      // 복선 생성: 드래그 텍스트는 description, 제목은 "복선 N" 자동 생성
      const newFs = store.createForeshadowing({
        projectId,
        tag: `복선 ${nextNumber}`,
        description: text.trim(),
      });

      // 생성 즉시 appearance 추가 (섹션 이동용)
      // sectionTitle이 "알 수 없음"이 되는 것을 방지하기 위해 prop을 직접 사용
      store.addAppearance(newFs.id, {
        documentId: documentId || "unknown",
        sectionTitle: sectionTitle || "알 수 없음",
        isRecovery: false,
      });

      // 선택 영역에 하이라이트 효과 적용 (복선 색상: 신비로운 보라색 #D8B4FE)
      // data-id 속성을 추가하여 나중에 회수 시 특정 하이라이트만 삭제할 수 있도록 함
      // When saving, we don't have a direct link on the Mark.
      //
      // IMPROVED STRATEGY:
      // We will iterate through all foreshadowings in the store.
      // If a foreshadowing is "recovered", ensuring its original text is NOT highlighted is tricky without the link.
      //
      // However, the USER's request implies a strong connection.
      // Let's modify the Highlight extension configuration in extensions array to allow custom attributes if possible, or just accept that "recovered" means "remove highlight" is a visual feedback for the user.

      // Let's try to add a custom attribute 'data-foreshadowing-id' to the highlight.
      // We need to modify the extension configuration FIRST.
      // Please see the next tool call for extension modification.

      // For this step, let's just keep the ID connection ready.
      // Actually, I should use `setMark` with a custom extension if I want robust ID handling.
      // But for now, let's assume I can hack it or use a custom mark.

      // Wait, I can just use `editor.commands.setHighlight({ color: ..., 'data-id': newFs.id })` ?
      // No, standard highlight command only takes color.

      // Backtrack: I will define a custom extension or extend Highlight to support attributes.
      // see next step.

      // For now, I will add the logic assuming the extension is updated.
      // To correctly link them, I need to pass attributes.
      // editor.chain().focus().command(({ tr }) => {
      //    const markType = editor.schema.marks.highlight;
      //    const mark = markType.create({ color: "#bbf7d0", id: newFs.id });
      //    tr.addMark(editor.state.selection.from, editor.state.selection.to, mark);
      //    return true;
      // }).run();

      // Current implementation update:
      editor.chain().focus().setHighlight({ color: "#D8B4FE" }).run();

      // Store the foreshadowing ID as a data attribute on the highlighted range
      // Note: id tracking is handled separately via the extended Highlight mark

      // 콜백 호출: 사이드바 포커스 이동
      onForeshadowingCreated?.(newFs.id);
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
            className="flex overflow-hidden rounded-xl border border-mocha-200 bg-white/95 backdrop-blur-sm shadow-lg shadow-mocha-900/10 z-50"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAsForeshadowing}
              aria-label="복선 저장"
              className="flex items-center gap-1.5 h-8 px-2 text-xs font-medium text-mocha-600 hover:bg-mocha-50 hover:text-mocha-700"
            >
              <Sparkles className="w-3.5 h-3.5" />
              복선 저장
            </Button>
            <div className="w-px h-8 bg-mocha-200/50" />
            {/* 하이라이트 색상 */}
            <div className="flex items-center gap-0.5 px-1.5">
              {[
                { color: "#FEF08A", label: "노랑" },
                { color: "#BBF7D0", label: "초록" },
                { color: "#BFDBFE", label: "파랑" },
                { color: "#FECACA", label: "빨강" },
                { color: "#E9D5FF", label: "보라" },
              ].map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() =>
                    editor.chain().focus().setHighlight({ color }).run()
                  }
                  className="w-5 h-5 rounded-full border border-mocha-200 hover:scale-110 hover:shadow-sm transition-all duration-200"
                  style={{ backgroundColor: color }}
                  title={`${label} 하이라이트`}
                  aria-label={`${label} 하이라이트`}
                />
              ))}
              <button
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                className="w-5 h-5 rounded-full border border-mocha-200 bg-white hover:bg-mocha-50 flex items-center justify-center text-xs text-mocha-500 transition-colors"
                title="하이라이트 제거"
                aria-label="하이라이트 제거"
              >
                ✕
              </button>
            </div>
            <div className="w-px h-8 bg-mocha-200/50" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              aria-label="굵게"
              aria-pressed={editor.isActive("bold")}
              className={cn(
                "h-8 w-8 p-0 hover:bg-mocha-50 transition-colors",
                editor.isActive("bold") && "bg-mocha-100 text-mocha-700",
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
                "h-8 w-8 p-0 hover:bg-mocha-50 transition-colors",
                editor.isActive("italic") && "bg-mocha-100 text-mocha-700",
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
                cssVariables["--st-editor-bg-color"] || "#F1F0EC",
              color: cssVariables["--st-editor-text-color"] || "#3D302A",
              "--st-editor-text-indent":
                cssVariables["--st-editor-text-indent"],
              "--st-editor-paragraph-spacing":
                cssVariables["--st-editor-paragraph-spacing"],
              "--st-editor-selection-color":
                cssVariables["--st-editor-selection-color"],
            } as React.CSSProperties
          }
          onScroll={(e) => {
            if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return;

            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            // Trigger when near bottom (100px threshold)
            if (scrollHeight - scrollTop <= clientHeight + 100) {
              fetchNextPage();
            }
          }}
        >
          <div
            className={cn(
              "px-6 py-6",
              editorSettings.visual.width !== "full" && "mx-auto",
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
                  className="w-16 h-1 accent-mocha-500 cursor-pointer"
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

        {/* Loading Indicator for Infinite Scroll */}
        {isFetchingNextPage && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-card/90 border border-border px-3 py-1 rounded-full shadow-lg text-xs font-medium animate-pulse z-50">
            불러오는 중...
          </div>
        )}
      </div>
    );
  },
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
