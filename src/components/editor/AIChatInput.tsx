import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import {
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import { Send, Square, Sparkles, BookOpen, User, Feather } from "lucide-react";
import { Button } from "@stolink/ui";
import { createSuggestionConfig } from "./ai-chat/mentionSuggestion";
import { cn } from "@/lib/utils";
import type { SuggestionItem } from "./ai-chat/MentionList";
import type { Character } from "@/types/character";
import type { Event } from "@/types/event";
import type { Conflict } from "@/types/analysisResult";
import type { ConsistencyReport } from "@/types/analysisResult";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";

// Quick Actions Definition
const QUICK_ACTIONS = [
  {
    icon: Sparkles,
    label: "개연성 체크",
    description: "논리적 오류와 설정 충돌을 분석합니다.",
    prompt:
      "현재 작성된 내용의 개연성을 분석하고, 논리적 오류가 있다면 지적해줘.",
    color: "text-amber-600",
  },
  {
    icon: BookOpen,
    label: "다음 전개 제안",
    description: "흥미로운 스토리 진행 방향을 추천합니다.",
    prompt:
      "이 다음 장면으로 이어질 수 있는 흥미로운 전개 방향을 3가지만 제안해줘.",
    color: "text-blue-600",
  },
  {
    icon: User,
    label: "캐릭터 심리 분석",
    description: "등장인물의 숨겨진 의도와 감정을 파악합니다.",
    prompt: "현재 장면에서 등장인물들의 심리 상태와 숨겨진 의도를 분석해줘.",
    color: "text-rose-600",
  },
  {
    icon: Feather,
    label: "문체 교정",
    description: "더 매끄럽고 문학적인 문장으로 다듬습니다.",
    prompt: "작성된 문장을 더 매끄럽고 문학적인 표현으로 다듬어줘.",
    color: "text-emerald-600",
  },
];

interface AIChatInputProps {
  characters: Character[] | undefined;
  events: Event[] | undefined;
  consistencyReport: ConsistencyReport | null;
  onSend: (message: string, contextData: Record<string, unknown>) => void;
  disabled?: boolean;
  placeholder?: string;
  projectId: string | null;
  streaming: boolean;
  onCancel: () => void;
}

export interface AIChatInputRef {
  clear: () => void;
  focus: () => void;
  setInput: (text: string) => boolean;
}

export const AIChatInput = forwardRef(
  (props: AIChatInputProps, ref: ForwardedRef<AIChatInputRef>) => {
    // 0. Get processed conflicts status
    // Refs for props to access in imperative getters
    const reportRef = useRef(props.consistencyReport);

    useEffect(() => {
      reportRef.current = props.consistencyReport;
    }, [props.consistencyReport]);

    // [FIX] Dynamic Getter: Fetches fresh data on invoke (bypassing React render/ref lag)
    const getFreshConflictOptions = () => {
      const report = reportRef.current;
      const processedConflicts =
        useAnalysisBufferStore.getState().processedConflicts;

      if (!report?.conflicts) return [];

      // 1. Filter first: Only show items visible in InsightsPanel (FLAG_FOR_HUMAN)
      // This prevents showing internal/auto-resolved conflicts that the user can't see in the panel.
      const visibleConflicts = report.conflicts.filter(
        (c) => c.suggestedAction === "FLAG_FOR_HUMAN",
      );

      // 2. Map processed list to preserve display index based on FULL REPORT (Standardized Numbering)
      const mapped = visibleConflicts.map((c) => {
        // Find stored original index in the full report so numbers match InsightsPanel (e.g. #3 stays #3)
        // InsightsPanel logic: fullConflicts.findIndex(fc => fc.id === c.id) + 1
        const originalIndex = report.conflicts.findIndex(
          (fc) => fc.id === c.id,
        );
        const displayIndex = originalIndex >= 0 ? originalIndex + 1 : 0;

        return {
          id: c.id,
          label: `개연성리포트_${displayIndex}`,
          subLabel: c.description,
          type: "conflict",
          data: { ...c, displayIndex },
        };
      });

      // 3. Filter using fresh store state (Resolved/Deleted)
      return mapped.filter((item) => {
        const c = item.data as Conflict;
        return !processedConflicts[c.id]; // Exclude resolved/deleted/ignored
      }) as SuggestionItem[];
    };

    // Character & Event options are static enough to keep as useMemo/Ref or similar pattern if needed.
    // For consistency, we can keep them as refs or move to getter pattern if they had dynamic filtering.
    // Keeping existing pattern for others for now.

    const characterOptions: SuggestionItem[] = useMemo(() => {
      if (!props.characters) return [];
      return props.characters.map((c) => ({
        id: c._id,
        label: c.profile.name,
        subLabel: c.role,
        type: "character",
        data: c,
      }));
    }, [props.characters]);

    const eventOptions: SuggestionItem[] = useMemo(() => {
      if (!Array.isArray(props.events)) return [];
      return props.events
        .filter(
          (e) => e && (e.eventId || (e as { event_id?: string }).event_id),
        )
        .map((e) => {
          const id = e.eventId || (e as { event_id?: string }).event_id || "";
          const summary =
            e.narrativeSummary ||
            (e as { narrative_summary?: string }).narrative_summary ||
            `Event ${id.slice(0, 6)}...`;
          return {
            id: id,
            label: summary,
            subLabel: typeof e.eventType === "string" ? e.eventType : "Event",
            type: "event",
            data: e,
          };
        });
    }, [props.events]);

    // Refs for options to be used in imperative handle and config
    const characterOptionsRef = useRef(characterOptions);
    const eventOptionsRef = useRef(eventOptions);

    useEffect(() => {
      characterOptionsRef.current = characterOptions;
      eventOptionsRef.current = eventOptions;
    }, [characterOptions, eventOptions]);

    const slashOptions: SuggestionItem[] = useMemo(
      () =>
        QUICK_ACTIONS.map((action) => ({
          id: action.label,
          label: action.label,
          subLabel: action.description,
          type: "action",
          data: action as unknown as Character | Event | Conflict,
        })),
      [],
    );

    // 2. Configure Extensions
    const extensions = useMemo(() => {
      return [
        StarterKit.configure({}),
        Placeholder.configure({
          placeholder:
            props.placeholder ||
            "메시지를 입력하세요... ('/'를 눌러 빠른 메뉴)",
        }),
        Mention.extend({ name: "slashCommand" }).configure({
          suggestion: {
            char: "/",
            command: ({ editor, range, props }) => {
              // Custom command to insert text instead of node
              const prompt =
                (props as { data?: { prompt?: string } }).data?.prompt || "";
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent(prompt)
                .run();
            },
            ...createSuggestionConfig(slashOptions),
          },
        }),
        Mention.extend({ name: "conflictMention" }).configure({
          HTMLAttributes: {
            class:
              "inline-flex items-center px-3 py-1.5 mx-0.5 text-sm font-semibold tracking-wide text-rose-700 bg-gradient-to-br from-rose-50/90 via-white/60 to-rose-50/20 border border-rose-200/60 rounded-full shadow-sm backdrop-blur-md select-none align-middle box-decoration-clone transition-all hover:shadow-md hover:scale-105 cursor-default",
          },
          renderLabel: ({ node }) => node.attrs.label,
          suggestion: {
            char: "#",
            // eslint-disable-next-line react-hooks/refs
            ...createSuggestionConfig(getFreshConflictOptions),
          },
        }),
        Mention.extend({ name: "characterMention" }).configure({
          HTMLAttributes: {
            class:
              "inline-flex items-center px-3 py-1.5 mx-0.5 text-sm font-semibold tracking-wide text-sage-700 bg-gradient-to-br from-sage-50/90 via-white/60 to-sage-50/20 border border-sage-200/60 rounded-full shadow-sm backdrop-blur-md select-none align-middle box-decoration-clone transition-all hover:shadow-md hover:scale-105 cursor-default",
          },
          renderLabel: ({ node }) => node.attrs.label,
          suggestion: {
            char: "@",
            // eslint-disable-next-line react-hooks/refs
            ...createSuggestionConfig(() => characterOptionsRef.current, {
              allCharacters: props.characters,
            }),
          },
        }),
        Mention.extend({ name: "eventMention" }).configure({
          HTMLAttributes: {
            class:
              "inline-flex items-center px-3 py-1.5 mx-0.5 text-sm font-semibold tracking-wide text-mocha-700 bg-gradient-to-br from-mocha-50/90 via-white/60 to-mocha-50/20 border border-mocha-200/60 rounded-full shadow-sm backdrop-blur-md select-none align-middle box-decoration-clone transition-all hover:shadow-md hover:scale-105 cursor-default",
          },
          renderLabel: ({ node }) => node.attrs.label,
          suggestion: {
            char: "!",
            // eslint-disable-next-line react-hooks/refs
            ...createSuggestionConfig(() => eventOptionsRef.current),
          },
        }),
      ];
    }, [props.placeholder, props.characters, slashOptions]);

    const handleSend = () => {
      if (!editor || editor.isEmpty) return;

      const json = editor.getJSON();
      let textContent = "";
      const contextData = {
        conflicts: [] as Conflict[],
        characters: [] as Character[],
        events: [] as Event[],
      };

      // Helper to process nodes recursively
      const processNode = (node: JSONContent) => {
        if (node.type === "text") {
          textContent += node.text;
        } else if (node.type === "conflictMention") {
          const conflictId = node.attrs?.id;
          // [FIX] Use getFreshConflictOptions() or reportRef logic
          // Since suggestions might be filtered, we blindly trust the ID from the node attributes
          // and look it up in the FULL report (reportRef) to get the data object.

          const report = reportRef.current;
          // Find the conflict object from the full report
          const conflictIndex =
            report?.conflicts?.findIndex((c) => c.id === conflictId) ?? -1;
          const conflict =
            conflictIndex >= 0 ? report?.conflicts[conflictIndex] : undefined;

          if (conflict) {
            const label = node.attrs?.label || "개연성리포트";
            textContent += `[#${label}]`;

            // [FIX] Inject displayIndex so backend prompt numbering matches UI
            // We use the 1-based index from the full list
            contextData.conflicts.push({
              ...conflict,
              displayIndex: conflictIndex + 1,
            });
          } else {
            // Fallback if not found (e.g. stale ID)
            const label = node.attrs?.label || "Unknown";
            textContent += `[#${label}]`;
          }
        } else if (node.type === "characterMention") {
          const charId = node.attrs?.id;
          const charOption = characterOptionsRef.current.find(
            (c) => (c.data as Character)._id === charId,
          );
          if (charOption) {
            textContent += `[@${charOption.label}]`;
            contextData.characters.push(charOption.data as Character);
          } else {
            textContent += `[@${node.attrs?.label || "User"}]`;
          }
        } else if (node.type === "eventMention") {
          const eventId = node.attrs?.id;
          const eventOption = eventOptionsRef.current.find((e) => {
            const d = e.data as Event;
            return (
              d.eventId === eventId ||
              (d as { event_id?: string }).event_id === eventId
            );
          });
          if (eventOption) {
            textContent += `[!${eventOption.label}]`; // Use ! for event to distinct
            contextData.events.push(eventOption.data as Event);
          } else {
            textContent += `[!${node.attrs?.label || "Event"}]`;
          }
        }

        if (node.content) {
          node.content.forEach(processNode);
        } else if (node.type === "paragraph") {
          textContent += "\n";
        }
      };

      if (json.content) {
        json.content.forEach(processNode);
      }

      props.onSend(
        textContent.trim(),
        contextData as unknown as Record<string, unknown>,
      );
      editor.commands.clearContent();
    };

    const propsRef = useRef(props);
    const handleSendRef = useRef<() => void>(() => {});

    useEffect(() => {
      propsRef.current = props;
    });

    const [, forceUpdate] = useState({});

    const editor = useEditor({
      extensions,
      content: "",
      onUpdate: () => forceUpdate({}),
      editorProps: {
        attributes: {
          class:
            "prose prose-sm max-w-none focus:outline-none min-h-[36px] max-h-[160px] overflow-y-auto w-full resize-none bg-white py-2 pl-3 pr-10 text-[11px] rounded-xl shadow-sm border border-mocha-200 focus:ring-1 focus:ring-mocha-300 focus:border-mocha-400 transition-all font-serif text-espresso-900 scrollbar-thin scrollbar-thumb-mocha-100 placeholder:text-mocha-300/80 placeholder:italic placeholder:font-sans leading-relaxed",
        },
        handleKeyDown: (view, event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            if (document.querySelector("[data-tippy-root]")) return false;
            event.preventDefault();
            if (!propsRef.current.disabled && !propsRef.current.streaming) {
              if (view.state.doc.textContent.trim().length > 0) {
                handleSendRef.current();
              }
            }
            return true;
          }
          return false;
        },
      },
      editable: !props.disabled,
    });

    useEffect(() => {
      handleSendRef.current = handleSend;
    });

    const setEditorContent = (content: string) => {
      if (!editor) return false;

      // [FIX] Use getFreshConflictOptions() instead of removed conflictOptionsRef
      const conflicts = getFreshConflictOptions();
      const chars = characterOptionsRef.current;
      const evts = eventOptionsRef.current;

      let html = content;
      // Basic escaping to prevent XSS if content comes from untrusted source,
      // though typically this content comes from internal prompts.
      html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      conflicts.forEach((opt: SuggestionItem) => {
        const pattern = `[#${opt.label}]`;
        if (html.includes(pattern)) {
          html = html
            .split(pattern)
            .join(
              `<span data-type="conflictMention" data-id="${opt.id}" data-label="${opt.label}"></span>`,
            );
        }
      });

      chars.forEach((opt: SuggestionItem) => {
        const pattern = `[@${opt.label}]`;
        if (html.includes(pattern)) {
          html = html
            .split(pattern)
            .join(
              `<span data-type="characterMention" data-id="${opt.id}" data-label="${opt.label}"></span>`,
            );
        }
      });

      evts.forEach((opt: SuggestionItem) => {
        const pattern = `[!${opt.label}]`;
        if (html.includes(pattern)) {
          html = html
            .split(pattern)
            .join(
              `<span data-type="eventMention" data-id="${opt.id}" data-label="${opt.label}"></span>`,
            );
        }
      });

      editor.commands.setContent(html, { emitUpdate: true });
      return true;
    };

    useImperativeHandle(ref, () => ({
      clear: () => editor?.commands.clearContent(),
      focus: () => editor?.commands.focus(),
      setInput: (text: string) => setEditorContent(text),
    }));

    useEffect(() => {
      return () => {
        editor?.destroy();
      };
    }, [editor]);

    if (!editor) return null;

    return (
      <div className="relative group w-full">
        <EditorContent editor={editor} />

        {/* Right: Send / Cancel Button */}
        <div className="absolute right-2 bottom-1.5 z-10 bg-transparent">
          {props.streaming ? (
            <Button
              type="button"
              size="icon"
              intent="ghost"
              onClick={props.onCancel}
              className="h-10 w-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300"
            >
              <Square className="h-4.5 w-4.5 fill-current animate-pulse" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSend}
              size="icon"
              disabled={props.disabled || editor.isEmpty}
              className={cn(
                "h-9 w-9 rounded-xl transition-all duration-500 flex items-center justify-center border shadow-sm",
                !editor.isEmpty && !props.disabled
                  ? "bg-espresso-900 border-espresso-900 text-white shadow-espresso-900/10 hover:bg-black"
                  : "bg-white border-mocha-100 text-mocha-200",
              )}
            >
              <Send
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  !editor.isEmpty && "translate-x-0.5 -translate-y-0.5",
                )}
              />
            </Button>
          )}
        </div>
      </div>
    );
  },
);

AIChatInput.displayName = "AIChatInput";
