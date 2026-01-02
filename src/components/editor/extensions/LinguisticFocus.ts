import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type LinguisticMode = "off" | "dialogue" | "adverb-adjective" | "paragraph-length";

export interface LinguisticFocusOptions {
  /**
   * Current linguistic focus mode
   */
  mode: LinguisticMode;
  /**
   * Opacity for dimmed text
   */
  dimOpacity: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linguisticFocus: {
      setLinguisticMode: (mode: LinguisticMode) => ReturnType;
      cycleLinguisticMode: () => ReturnType;
    };
  }
}

// Korean dialogue patterns: "..." or '...' or 「...」 or 『...』
const DIALOGUE_PATTERN = /["'「『"][^"'」』"]*["'」』"]/g;

// Common Korean adverbs and adjectives patterns (simplified)
const ADVERB_PATTERNS = [
  /\b(?:매우|정말|아주|너무|참|꽤|상당히|굉장히|엄청|무척)\s/g,
  /(?:게|이|히|으로)\s/g, // Adverb endings
];

const ADJECTIVE_PATTERNS = [
  /(?:ㄴ|은|는)\s(?:것|게|듯|채)/g, // Adjective patterns
];

export const LinguisticFocus = Extension.create<LinguisticFocusOptions>({
  name: "linguisticFocus",

  addOptions() {
    return {
      mode: "off",
      dimOpacity: 0.3,
    };
  },

  addCommands() {
    return {
      setLinguisticMode:
        (mode: LinguisticMode) =>
        ({ editor }) => {
          this.options.mode = mode;
          // Force decoration update
          editor.view.dispatch(editor.state.tr);
          return true;
        },
      cycleLinguisticMode:
        () =>
        ({ commands }) => {
          const modes: LinguisticMode[] = ["off", "dialogue", "adverb-adjective", "paragraph-length"];
          const currentIndex = modes.indexOf(this.options.mode);
          const nextIndex = (currentIndex + 1) % modes.length;
          return commands.setLinguisticMode(modes[nextIndex]);
        },
    };
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey("linguisticFocus"),
        props: {
          decorations: (state) => {
            if (extension.options.mode === "off") {
              return DecorationSet.empty;
            }

            const { doc } = state;
            const decorations: Decoration[] = [];

            if (extension.options.mode === "dialogue") {
              // Highlight dialogue, dim narrative
              doc.descendants((node, pos) => {
                if (!node.isText || !node.text) return;

                const text = node.text;
                let match;

                // Find dialogue matches
                DIALOGUE_PATTERN.lastIndex = 0;
                const dialogueRanges: Array<{ from: number; to: number }> = [];

                while ((match = DIALOGUE_PATTERN.exec(text)) !== null) {
                  dialogueRanges.push({
                    from: pos + match.index,
                    to: pos + match.index + match[0].length,
                  });
                }

                // If no dialogue in this text node, dim the entire node
                if (dialogueRanges.length === 0) {
                  decorations.push(
                    Decoration.inline(pos, pos + text.length, {
                      style: `opacity: ${extension.options.dimOpacity}`,
                    })
                  );
                } else {
                  // Dim non-dialogue parts
                  let lastEnd = 0;
                  for (const range of dialogueRanges) {
                    const localFrom = range.from - pos;
                    if (localFrom > lastEnd) {
                      decorations.push(
                        Decoration.inline(pos + lastEnd, range.from, {
                          style: `opacity: ${extension.options.dimOpacity}`,
                        })
                      );
                    }
                    // Highlight dialogue
                    decorations.push(
                      Decoration.inline(range.from, range.to, {
                        class: "linguistic-dialogue",
                        style: "opacity: 1; color: inherit;",
                      })
                    );
                    lastEnd = range.to - pos;
                  }
                  // Dim remaining text after last dialogue
                  if (lastEnd < text.length) {
                    decorations.push(
                      Decoration.inline(pos + lastEnd, pos + text.length, {
                        style: `opacity: ${extension.options.dimOpacity}`,
                      })
                    );
                  }
                }
              });
            } else if (extension.options.mode === "adverb-adjective") {
              // Highlight adverbs/adjectives for overuse detection
              doc.descendants((node, pos) => {
                if (!node.isText || !node.text) return;

                const text = node.text;

                // Find adverbs
                for (const pattern of ADVERB_PATTERNS) {
                  pattern.lastIndex = 0;
                  let match;
                  while ((match = pattern.exec(text)) !== null) {
                    decorations.push(
                      Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                        class: "linguistic-adverb",
                        style: "background-color: rgba(239, 68, 68, 0.2); border-radius: 2px;",
                      })
                    );
                  }
                }

                // Find adjectives
                for (const pattern of ADJECTIVE_PATTERNS) {
                  pattern.lastIndex = 0;
                  let match;
                  while ((match = pattern.exec(text)) !== null) {
                    decorations.push(
                      Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                        class: "linguistic-adjective",
                        style: "background-color: rgba(59, 130, 246, 0.2); border-radius: 2px;",
                      })
                    );
                  }
                }
              });
            } else if (extension.options.mode === "paragraph-length") {
              // Color-code paragraphs by length
              doc.descendants((node, pos) => {
                if (node.type.name !== "paragraph") return false;

                const textLength = node.textContent.length;
                let bgColor: string;

                if (textLength < 50) {
                  bgColor = "rgba(34, 197, 94, 0.1)"; // Short - green
                } else if (textLength < 150) {
                  bgColor = "rgba(234, 179, 8, 0.1)"; // Medium - yellow
                } else if (textLength < 300) {
                  bgColor = "rgba(249, 115, 22, 0.1)"; // Long - orange
                } else {
                  bgColor = "rgba(239, 68, 68, 0.15)"; // Very long - red
                }

                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    style: `background-color: ${bgColor}; border-radius: 4px;`,
                  })
                );

                return false;
              });
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
