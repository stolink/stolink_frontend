import Mention from "@tiptap/extension-mention";
import { ReactRenderer, ReactNodeViewRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { SuggestionList, type SuggestionListProps } from "./SuggestionList";
import type { SuggestionListRef } from "./SuggestionList";
import CharacterNodeView from "./CharacterNodeView";
import { DEMO_CHARACTERS } from "@/data/demoData";

// Re-export for use in CharacterNodeView and hover cards
export { DEMO_CHARACTERS };

export const CharacterMention = Mention.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CharacterNodeView);
  },
}).configure({
  HTMLAttributes: {
    class: "character-mention",
  },
  renderLabel({ node }) {
    return node.attrs.label ?? node.attrs.id;
  },
  suggestion: {
    char: "@",
    items: ({ query }) => {
      return DEMO_CHARACTERS.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      );
    },
    render: () => {
      let component: ReactRenderer<SuggestionListRef, SuggestionListProps>;
      let popup: TippyInstance[];

      return {
        onStart: (props) => {
          component = new ReactRenderer(SuggestionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getReferenceClientRect: props.clientRect as any,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate(props) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getReferenceClientRect: props.clientRect as any,
          });
        },

        onKeyDown(props) {
          if (props.event.key === "Escape") {
            popup[0].hide();
            return true;
          }

          return component.ref?.onKeyDown(props) || false;
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  },
});
