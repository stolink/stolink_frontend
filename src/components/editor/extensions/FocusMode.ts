import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface FocusModeOptions {
  /**
   * Enable focus mode
   */
  enabled: boolean;
  /**
   * CSS class for unfocused nodes
   */
  unfocusedClass: string;
  /**
   * CSS class for focused node
   */
  focusedClass: string;
  /**
   * Number of nodes around the focused node to keep visible
   */
  range: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    focusMode: {
      setFocusMode: (enabled: boolean) => ReturnType;
      toggleFocusMode: () => ReturnType;
    };
  }
}

export const FocusMode = Extension.create<FocusModeOptions>({
  name: "focusMode",

  addOptions() {
    return {
      enabled: false,
      unfocusedClass: "unfocused-node",
      focusedClass: "focused-node",
      range: 0, // Only focus current paragraph
    };
  },

  addCommands() {
    return {
      setFocusMode:
        (enabled: boolean) =>
        ({ editor }) => {
          this.options.enabled = enabled;

          // Toggle class on editor container
          const editorElement = editor.view.dom.closest(".stolink-editor");
          if (editorElement) {
            editorElement.classList.toggle("focus-mode-active", enabled);
          }

          // Force decoration update
          editor.view.dispatch(editor.state.tr);

          return true;
        },
      toggleFocusMode:
        () =>
        ({ commands }) => {
          return commands.setFocusMode(!this.options.enabled);
        },
    };
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey("focusMode"),
        props: {
          decorations: (state) => {
            if (!extension.options.enabled) {
              return DecorationSet.empty;
            }

            const { doc, selection } = state;
            const { from } = selection;
            const decorations: Decoration[] = [];

            // Find the block node containing the cursor
            const $from = doc.resolve(from);
            const focusedBlockStart = $from.start(1); // Depth 1 = top-level block
            const focusedBlockEnd = $from.end(1);

            doc.descendants((node: ProseMirrorNode, pos: number) => {
              // Only decorate top-level block nodes
              if (!node.isBlock) return;

              const nodeEnd = pos + node.nodeSize;
              const isFocused =
                pos >= focusedBlockStart - 1 && nodeEnd <= focusedBlockEnd + 1;

              // Apply range if specified
              let isInRange = isFocused;
              if (extension.options.range > 0 && !isFocused) {
                // Check if node is within range of focused node
                const nodeIndex = getBlockIndex(doc, pos);
                const focusedIndex = getBlockIndex(doc, focusedBlockStart);
                isInRange =
                  Math.abs(nodeIndex - focusedIndex) <= extension.options.range;
              }

              if (isInRange) {
                decorations.push(
                  Decoration.node(pos, nodeEnd, {
                    class: extension.options.focusedClass,
                  }),
                );
              } else {
                decorations.push(
                  Decoration.node(pos, nodeEnd, {
                    class: extension.options.unfocusedClass,
                  }),
                );
              }

              return false; // Don't descend into children
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * Helper to get the index of a block node in the document
 */
function getBlockIndex(doc: ProseMirrorNode, pos: number): number {
  let index = 0;
  doc.descendants((node: ProseMirrorNode, nodePos: number) => {
    if (node.isBlock && nodePos < pos) {
      index++;
    }
    return false;
  });
  return index;
}
