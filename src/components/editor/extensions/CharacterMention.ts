import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { SuggestionList } from "./SuggestionList";
import type { SuggestionListRef } from "./SuggestionList";

// Mock data - In real app, this would come from a store or API
const MOCK_CHARACTERS = [
  { id: "1", name: "주인공", role: "주인공", avatar: null },
  { id: "2", name: "스승", role: "조력자", avatar: null },
  { id: "3", name: "악당", role: "반동인물", avatar: null },
  { id: "4", name: "소녀", role: "조연", avatar: null },
];

export const CharacterMention = Mention.configure({
  HTMLAttributes: {
    class: "character-mention",
  },
  renderLabel({ options, node }) {
    return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
  },
  suggestion: {
    char: "[[", // Trigger character
    items: ({ query }) => {
      return MOCK_CHARACTERS.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
    },
    render: () => {
      let component: ReactRenderer<SuggestionListRef, any>;
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
