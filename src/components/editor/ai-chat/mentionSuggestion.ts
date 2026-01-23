import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance } from "tippy.js";
import { MentionList, type SuggestionItem } from "./MentionList";
import { matchKorean } from "@/lib/korean-search";

import { Editor } from "@tiptap/core";

export interface MentionRendererProps {
  editor: Editor;
  range: { from: number; to: number };
  query: string;
  text: string;
  items: SuggestionItem[];
  command: (props: { id: string; label: string }) => void;
  decorationNode: Element | null;
  // Tippy.js GetReferenceClientRect 타입 호환을 위해 any 사용 (null 허용 필요)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientRect?: any;
  event?: KeyboardEvent;
}

export const createSuggestionConfig = (
  itemsOrGetter: SuggestionItem[] | (() => SuggestionItem[]),
  extraProps?: Record<string, unknown>,
) => {
  return {
    items: ({ query }: { query: string }) => {
      // Resolve items: support both array and getter function
      const items =
        typeof itemsOrGetter === "function" ? itemsOrGetter() : itemsOrGetter;

      // Filter items using Korean Regex (Chosung + Space insensitive)
      return items
        .filter(
          (item) =>
            matchKorean(item.label, query) ||
            (item.subLabel && matchKorean(item.subLabel, query)),
        )
        .slice(0, 10);
    },

    render: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let component: ReactRenderer<any, any>;
      let popup: Instance[];

      return {
        onStart: (props: MentionRendererProps) => {
          component = new ReactRenderer(MentionList, {
            props: { ...props, ...extraProps }, // Merge extra props
            editor: props.editor,
          });

          if (!props.clientRect) {
            console.warn("No clientRect for suggestion popup");
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "top-start", // Prefer top-start to open upwards
            maxWidth: "calc(100vw - 20px)", // Prevent horizontal overflow
            offset: [0, 8],
            arrow: false,
            theme: "glass", // Use custom transparent theme defined in index.css
            // Backup manual override (optional, but harmless to keep)
            onMount(instance) {
              const box = instance.popper.querySelector(
                ".tippy-box",
              ) as HTMLElement;
              if (box) {
                box.style.backgroundColor = "transparent";
                box.style.boxShadow = "none";
                box.style.border = "none";
              }
            },
            popperOptions: {
              modifiers: [
                {
                  name: "preventOverflow",
                  options: {
                    boundary: "viewport",
                    padding: 10,
                  },
                },
                {
                  name: "flip",
                  options: {
                    fallbackPlacements: [
                      "top-end",
                      "bottom-start",
                      "bottom-end",
                    ],
                  },
                },
              ],
            },
          });
        },

        onUpdate(props: MentionRendererProps) {
          component.updateProps({ ...props, ...extraProps }); // Update merged props

          if (!props.clientRect) {
            return;
          }

          // Safety check: popup might not be initialized if onStart failed or was skipped
          if (popup && popup[0]) {
            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
          }
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            if (popup && popup[0]) {
              popup[0].hide();
            }
            return true;
          }
          // Delegate key events to the React component
          return component.ref?.onKeyDown(props) || false;
        },

        onExit() {
          if (popup && popup[0]) {
            popup[0].destroy();
          }
          component.destroy();
        },
      };
    },
  };
};
