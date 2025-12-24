import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SectionDividerView from "./SectionDividerView";

export interface SectionDividerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sectionDivider: {
      setSectionDivider: (attributes: {
        documentId: string;
        title: string;
      }) => ReturnType;
    };
  }
}

export const SectionDivider = Node.create<SectionDividerOptions>({
  name: "sectionDivider",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      documentId: {
        default: null,
      },
      title: {
        default: "Untitled",
      },
      level: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="section-divider"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "section-divider" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionDividerView);
  },

  addCommands() {
    return {
      setSectionDivider:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
