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
import { debounce } from "lodash-es";
import { Bold, Italic, ZoomIn, ZoomOut, Sparkles } from "lucide-react";
import { Button } from "@stolink/ui";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { CharacterMention } from "./extensions/CharacterMention";
import { SlashCommandExtension } from "./extensions/SlashCommand";
import { ForeshadowingSuggest } from "./extensions/ForeshadowingSuggest";
import { TypewriterScroll } from "./extensions/TypewriterScroll";
import { FocusMode } from "./extensions/FocusMode";
import { SmartPunctuation } from "./extensions/SmartPunctuation";
import { AutoFormatter } from "./extensions/AutoFormatter";
import { useForeshadowingStore } from "@/stores";
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import { useToast } from "@/hooks/useToast";
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
  onEditorCreate?: (editor: Editor) => void;
}

export interface TiptapEditorHandle {
  getSplitContent: () => { before: string; after: string } | null;
  getContent: () => string;
  scrollToLine: (line: number) => void;
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
      onEditorCreate,
    },
    ref,
  ) => {
    const { id: projectId } = useParams<{ id: string }>();
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const { toast } = useToast();

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
    // Track last HTML sent to parent to prevent sync focus loops
    const lastEmittedHTMLRef = useRef<string>("");

    // 복선 태그 삭제 감지용 ref (에디터 본문에서 #복선태그 삭제 시 미회수 상태로 복구)
    const prevForeshadowingIdsRef = useRef<Set<string>>(new Set());

    // Get settings from the store
    const typography = useEditorSettingStore((s) => s.typography);
    const visual = useEditorSettingStore((s) => s.visual);
    const behavior = useEditorSettingStore((s) => s.behavior);

    // Destructure behavior settings
    const typewriterMode = behavior?.typewriterMode ?? "off";

    // useRef for typewriter mode to use in callbacks without dependencies
    const typewriterModeRef = useRef(typewriterMode);
    useEffect(() => {
      typewriterModeRef.current = typewriterMode;
    }, [typewriterMode]);

    // Note: focusModeEnabled, smartQuotes, smartDashes, maxEmptyLines are intentionally not destructured as they are not yet implemented.

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
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
        Placeholder.configure({
          placeholder:
            "마크다운(#, ##, > 등)으로 자유롭게 내용을 입력하세요...",
        }),
        Highlight.extend({
          addAttributes() {
            return {
              color: {
                default: null,
                parseHTML: (element) =>
                  element.getAttribute("data-color") ||
                  element.style.backgroundColor,
                renderHTML: (attributes) => {
                  if (!attributes.color) {
                    return {};
                  }

                  let color = attributes.color;
                  const isDarkMode =
                    editorSettings.visual.theme === "dark" ||
                    editorSettings.visual.theme === "true-black";

                  // Dark Mode: Add 40% opacity to preserve white text readability
                  // Pastel colors on dark background can be too bright/low-contrast against white text.
                  // Making them semi-transparent allows the dark background to dim them.
                  if (
                    isDarkMode &&
                    color.startsWith("#") &&
                    color.length === 7
                  ) {
                    color = `${color}66`; // Hex alpha for ~40% opacity
                  }

                  return {
                    style: `background-color: ${color} !important; color: inherit;`,
                  };
                },
              },
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
        CharacterCount.configure({}),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        // Underline, // Duplicate extension warning fix
        CharacterMention,
        SlashCommandExtension.configure({
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
        AutoFormatter.configure({
          maxEmptyLines: 1, // 최대 연속 빈 줄 1개 까지만 허용 (가독성 최적화)
          enableAdvancedFormatting: true,
          smartParagraphBreaks: true,
        }),
      ];

      return exts;
    }, [projectId, documentId, sectionTitle, editorSettings.visual.theme]);

    const editor = useEditor({
      editable: !readOnly,
      extensions,
      content: sanitizeEditorContent(initialContent ?? DEFAULT_CONTENT),
      editorProps: {
        /**
         * 스크롤 동작을 가로채서 제어합니다.
         * 타자기 모드가 활성화된 경우(off가 아님), 기본 스크롤 동작을 차단(return true)하고
         * TypewriterScroll 확장이 스크롤을 전담하도록 하여 화면 흔들림(널뛰기)을 방지합니다.
         */
        handleScrollToSelection: (_view) => {
          if (typewriterModeRef.current !== "off") {
            return true; // Prevent default scroll behavior in typewriter mode
          }
          return false;
        },
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
          focus: () => {
            // Update scroll position ref on focus to prevent jumping back to stale values
            if (editorContainerRef.current) {
              scrollPositionRef.current = editorContainerRef.current.scrollTop;
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor }) => {
        // Immediate update for character count (lightweight)
        // 순수 텍스트만 계산 (줄바꿈 제외, 띄어쓰기 포함)
        if (onUpdateRef.current) {
          const textContent = editor.state.doc.textContent;
          // 줄바꿈만 제외 (띄어쓰기는 포함)
          const pureCharCount = textContent.replace(/[\r\n]/g, "").length;
          onUpdateRef.current(pureCharCount);
        }

        // Trigger debounced heavy updates
        debouncedUpdates(editor);
      },
      // Note: Typewriter scroll now handled by TypewriterScroll extension
      onTransaction: ({ transaction, editor }) => {
        // Detect Undo/Redo (history transactions) and sync foreshadowing immediately
        const isHistoryTransaction = transaction.getMeta("history$");
        if (isHistoryTransaction && !editor.isDestroyed) {
          // Immediately sync foreshadowing state on Undo/Redo
          const currentIds = new Set<string>();
          editor.state.doc.descendants((node) => {
            if (node.type.name === "foreshadowingSuggest" && node.attrs.id) {
              currentIds.add(node.attrs.id);
            }
          });

          const store = useForeshadowingStore.getState();
          // Check for removed tags (Undo of add)
          prevForeshadowingIdsRef.current.forEach((id) => {
            if (!currentIds.has(id)) {
              const fs = store.foreshadowings[id];
              if (fs?.status === "recovered") {
                store.markAsPending(id);
              }
            }
          });
          prevForeshadowingIdsRef.current = currentIds;
        }

        // Prevent scroll resetting when transactions occur (like clicking/selection)
        // Only force scroll if we have a captured position and content might have jumped
        requestAnimationFrame(() => {
          // 타자기 모드 사용 중일 때는 스크롤이 자동으로 제어되므로 간섭하지 않음
          if (typewriterModeRef.current !== "off") return;

          if (editorContainerRef.current && scrollPositionRef.current > 0) {
            // If the current scroll is significantly different from what we expect,
            // it means a transaction might have reset it (e.g. setContent)
            const currentScroll = editorContainerRef.current.scrollTop;
            if (Math.abs(currentScroll - scrollPositionRef.current) > 10) {
              // Only restore if it actually jumped (likely to 0)
              if (currentScroll === 0) {
                editorContainerRef.current.scrollTop =
                  scrollPositionRef.current;
              }
            }
          }
        });
      },
      onCreate: ({ editor }) => {
        onEditorCreate?.(editor);
      },
    });

    // Debounced Heavy Updates (Foreshadowing Scan + HTML Generation)
    // 500ms debounce to prevent frame drops during rapid typing
    const debouncedUpdates = useMemo(
      () =>
        debounce((editor: Editor) => {
          if (editor.isDestroyed) return;

          // 1. Scan Foreshadowing Tags
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

          // 2. Content Change (HTML Generation is expensive)
          if (onContentChangeRef.current) {
            const html = editor.getHTML();
            lastEmittedHTMLRef.current = html;
            onContentChangeRef.current(html);
          }
        }, 500),
      [],
    );

    // Cancel debounce on unmount
    useEffect(() => {
      return () => {
        debouncedUpdates.cancel();
      };
    }, [debouncedUpdates]);

    // Apply typewriter mode setting when it changes
    useEffect(() => {
      // editor.view.dom checking prevents "editor view is not available" error
      if (
        editor &&
        !editor.isDestroyed &&
        editor.view &&
        editor.view.dom &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor.commands as any).setTypewriterPosition
      ) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor.commands as any).setTypewriterPosition(typewriterMode);
        } catch (_e) {
          /* Ignored */
        }
      }
    }, [editor, typewriterMode]);

    // Apply focus mode setting when it changes
    const focusModeEnabled = behavior?.focusMode ?? false;
    useEffect(() => {
      if (
        editor &&
        !editor.isDestroyed &&
        editor.view &&
        editor.view.dom &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor.commands as any).setFocusMode
      ) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor.commands as any).setFocusMode(focusModeEnabled);
        } catch (_e) {
          /* Ignored */
        }
      }
    }, [editor, focusModeEnabled]);

    // Expose split functionality via ref
    useImperativeHandle(ref, () => ({
      getContent: () => {
        return editor?.getHTML() || "";
      },
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
      scrollToLine: (line: number) => {
        if (!editor || line <= 0) return;

        // Tiptap doesn't have a direct "line" concept in ProseMirror,
        // so we find the N-th block node that isn't the document itself.
        let currentLine = 0;
        let pos = -1;

        editor.state.doc.descendants((node, nodePos) => {
          // Only count top-level blocks or meaningful blocks
          // We want to avoid counting every single list item AND the list itself if possible,
          // but matches what typical AI line counting does (usually counts by \n separator)
          if (node.isBlock && node.type.name !== "doc") {
            // Only count nodes that are direct children of doc or nested meaningful blocks
            // This is a heuristic that works for most simple documents
            currentLine++;
            if (currentLine === line) {
              pos = nodePos;
              return false; // Found it
            }
          }
        });

        if (pos !== -1) {
          editor.commands.focus();
          editor.commands.setTextSelection(pos);

          // Use Tiptap's built-in scrollIntoView which is more reliable for ProseMirror
          editor.commands.scrollIntoView();

          // Fallback if the built-in doesn't work well with our container
          setTimeout(() => {
            const dom = editor.view.nodeDOM(pos) as HTMLElement;
            if (dom && typeof dom.scrollIntoView === "function") {
              dom.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 50);
        }
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
          const textContent = editor.state.doc.textContent;
          const pureCharCount = textContent.replace(/[\r\n]/g, "").length;
          onUpdateRef.current?.(pureCharCount);
        });
      }
    }, [editor]);

    useEffect(() => {
      if (editor && initialContent !== undefined) {
        const currentHTML = editor.getHTML();
        const sanitizedContent = sanitizeEditorContent(initialContent);

        // Check if content is actually different from current OR last saved content
        // This prevents the "Save -> Refetch -> setContent -> Change Event -> Save" loop
        const isDifferentFromCurrent = currentHTML !== sanitizedContent;
        const isDifferentFromLastSaved =
          lastEmittedHTMLRef.current !== sanitizedContent;
        const isFocused = editor.isFocused;

        // Only update if content is different AND editor is not focused
        if (isDifferentFromCurrent && isDifferentFromLastSaved && !isFocused) {
          editor.commands.setContent(sanitizedContent);
          lastEmittedHTMLRef.current = sanitizedContent;
        }
      }
    }, [editor, initialContent, documentId]);

    // Effect: 복선 상태 변경 감지 및 하이라이트/태그 스타일 업데이트
    useEffect(() => {
      if (!editor || !projectId) return;

      const unsubscribe = useForeshadowingStore.subscribe((state) => {
        const foreshadowings = state.foreshadowings;
        let hasChanges = false;
        let lastTr = editor.state.tr;

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
                  lastTr = lastTr.removeMark(from, to, mark.type);
                  hasChanges = true;
                }
              }
            });
          }
        });

        if (hasChanges && !editor.isDestroyed) {
          // 상태 업데이트 충돌 방지를 위해 다음 틱에 실행
          requestAnimationFrame(() => {
            if (!editor.isDestroyed) {
              editor.view.dispatch(lastTr);
            }
          });
        }
      });

      return () => {
        unsubscribe();
      };
    }, [editor, projectId]);

    if (!editor) {
      return null;
    }

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
      editor
        .chain()
        .focus()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .setHighlight({ color: "#D8B4FE", id: newFs.id } as any)
        .run();

      // Store the foreshadowing ID as a data attribute on the highlighted range
      // Note: id tracking is handled separately via the extended Highlight mark

      // 콜백 호출: 사이드바 포커스 이동
      onForeshadowingCreated?.(newFs.id);

      // 성공 토스트 표시
      toast({
        title: "복선이 생성되었습니다",
        description: `"${newFs.tag}" 항목이 사이드바에 추가되었습니다.`,
        variant: "success",
      });
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
            className="flex overflow-hidden rounded-xl border border-mocha-200 bg-white/95 backdrop-blur-sm shadow-lg shadow-mocha-900/10 z-50 px-1"
          >
            <Button
              intent="ghost"
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
              intent="ghost"
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
              intent="ghost"
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

        {/* Internal Formatting Toolbar */}
        {!readOnly && (
          <div className="sticky top-0 z-50">
            <EditorToolbar editor={editor} />
          </div>
        )}

        {/* Editor Content - Apply settings from store */}
        <div
          ref={editorContainerRef}
          role="region"
          aria-label="편집 영역"
          className={cn(
            "flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-mocha-200 scrollbar-track-transparent hover:scrollbar-thumb-mocha-300 transition-colors",
            // Apply theme class for CSS selector support (.theme-dark .ProseMirror)
            `theme-${editorSettings.visual.theme}`,
            focusModeEnabled && "focus-mode-active",
          )}
          style={
            {
              //cssVariables["--st-editor-bg-color"] ||
              backgroundColor: "#FAFAF9", // Theme-aware background
              // color: cssVariables["--st-editor-text-color"] || "#3D302A",
              "--st-editor-text-indent":
                cssVariables["--st-editor-text-indent"],
              "--st-editor-paragraph-spacing":
                cssVariables["--st-editor-paragraph-spacing"],
              "--st-editor-selection-color":
                cssVariables["--st-editor-selection-color"],
            } as React.CSSProperties
          }
          onScroll={(e) => {
            // Keep scroll position ref in sync with manual scrolling
            scrollPositionRef.current = e.currentTarget.scrollTop;

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
              "px-8 py-10 min-h-screen", // Removed transition-all to prevent focus scroll jumps
              editorSettings.visual.width !== "full" &&
                "mx-auto my-4 shadow-sm rounded-lg", // Paper sheet look for non-full width
              editorSettings.visual.width === "full" && "px-12",
              !readOnly &&
                "focus-within:ring-1 focus-within:ring-mocha-200/50 focus-within:shadow-md", // Subtle focus effect
            )}
            style={{
              maxWidth: editorWidth,
              fontFamily: cssVariables["--st-editor-font-family"],
              fontSize: `${fontSize}px`,
              lineHeight: editorSettings.typography.lineHeight,
              letterSpacing: `${editorSettings.typography.letterSpacing}em`,
              // Theme-aware paper styling
              backgroundColor:
                editorSettings.visual.width !== "full"
                  ? cssVariables["--st-editor-bg-color"] || "#FFFFFF"
                  : "transparent",
              borderWidth: editorSettings.visual.width !== "full" ? "1px" : "0",
              borderColor:
                editorSettings.visual.theme === "dark" ||
                editorSettings.visual.theme === "true-black"
                  ? "#5D504A" // Darker border for dark themes
                  : "#E8E4E0", // Light border for light themes
            }}
          >
            <EditorContent editor={editor} className="w-full" />
            <style>{`
              .ProseMirror p {
                line-height: ${editorSettings.typography.lineHeight} !important;
              }
            `}</style>
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
