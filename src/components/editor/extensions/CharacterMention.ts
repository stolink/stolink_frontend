import Mention from "@tiptap/extension-mention";
import { ReactRenderer, ReactNodeViewRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { SuggestionList, type SuggestionListProps } from "./SuggestionList";
import type { SuggestionListRef, MentionItem } from "./SuggestionList";
import CharacterNodeView from "./CharacterNodeView";
import { DEMO_CHARACTERS, DEMO_ITEMS } from "@/data/demoData";

// Re-export for use in CharacterNodeView and hover cards
export { DEMO_CHARACTERS, DEMO_ITEMS };

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
    deleteTriggerWithBackspace: true,
    items: ({ query }): MentionItem[] => {
      const lowerQuery = query.toLowerCase();

      // 캐릭터 필터링
      const characters: MentionItem[] = DEMO_CHARACTERS.filter((char) =>
        char.name.toLowerCase().includes(lowerQuery),
      ).map((char) => ({
        id: char.id,
        name: char.name,
        type: "character" as const,
        imageUrl: char.imageUrl,
        role: char.role,
      }));

      // 아이템 필터링
      const items: MentionItem[] = DEMO_ITEMS.filter((item) =>
        item.name.toLowerCase().includes(lowerQuery),
      ).map((item) => ({
        id: item.id,
        name: item.name,
        type: "item" as const,
        itemType: item.type,
      }));

      // 캐릭터 먼저, 그 다음 아이템 순서로 반환
      return [...characters, ...items];
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
            getReferenceClientRect: props.clientRect as (() => DOMRect) | null,
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
            getReferenceClientRect: props.clientRect as (() => DOMRect) | null,
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
