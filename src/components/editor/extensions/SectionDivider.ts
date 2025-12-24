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
        getAttrs: (dom) => {
          if (typeof dom === "string") return false;
          return {
            documentId: dom.getAttribute("data-document-id"),
            title: dom.getAttribute("data-title"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "section-divider",
        "data-document-id": node.attrs.documentId,
        "data-title": node.attrs.title,
      }),
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
