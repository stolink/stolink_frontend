import { Extension, type CommandProps } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    autoFormatter: {
      formatDocument: () => ReturnType;
    };
  }
}

export interface AutoFormatterOptions {
  /**
   * Maximum integer number of consecutive empty paragraphs allowed.
   * Default: 1
   */
  maxEmptyLines: number;
  enableAdvancedFormatting?: boolean;
  smartParagraphBreaks?: boolean;
}

export const AutoFormatter = Extension.create<AutoFormatterOptions>({
  name: "autoFormatter",

  addOptions() {
    return {
      maxEmptyLines: 1,
      enableAdvancedFormatting: true,
      smartParagraphBreaks: true,
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-s": () => {
        this.editor.commands.formatDocument();
        return true; // Prevent default browser save behavior
      },
    };
  },

  addCommands() {
    return {
      formatDocument:
        () =>
        ({ tr, state, dispatch }: CommandProps) => {
          if (!dispatch) return true;

          const { doc } = state;
          // Deletions for empty lines (backwards compatible logic)
          const deletions: { from: number; to: number }[] = [];

          // Transformations for text content
          const replacements: { from: number; to: number; text: string }[] = [];

          // Split positions
          const splits: number[] = [];

          let emptyLineCount = 0;

          // Process document
          doc.descendants((node: Node, pos: number) => {
            // 1. Handle Empty Lines (Block nodes)
            if (node.isBlock) {
              const isEmpty = node.content.size === 0;

              if (isEmpty) {
                emptyLineCount++;
              } else {
                emptyLineCount = 0;
              }

              if (emptyLineCount > this.options.maxEmptyLines) {
                deletions.push({ from: pos, to: pos + node.nodeSize });
              }
            }

            // 2. Handle Text Formatting (Text nodes)
            // Skip code blocks or other special nodes if strictly needed, but roughly safe for prose
            if (
              this.options.enableAdvancedFormatting &&
              node.isText &&
              node.text
            ) {
              const text = node.text;

              // Rule A: Multiple spaces -> Single space
              // Note: We use a regex global replace loop to find positions
              const multiSpaceRegex = / {2,}/g;
              let match;
              while ((match = multiSpaceRegex.exec(text)) !== null) {
                replacements.push({
                  from: pos + match.index,
                  to: pos + match.index + match[0].length,
                  text: " ",
                });
              }

              // Rule B: Ellipsis normalization (...... -> …)
              // Handle 3 or more dots
              const ellipsisRegex = /\.{3,}/g;
              while ((match = ellipsisRegex.exec(text)) !== null) {
                replacements.push({
                  from: pos + match.index,
                  to: pos + match.index + match[0].length,
                  text: "…",
                });
              }

              // Rule C: Fix missing space after punctuation
              // Korean: [char][,.?!][char] -> insert space
              // Caution: Don't break numbers (3.14) or URLs.
              // Safe subset: Punctuation followed by Hangul start
              const safePunctuationRegex = /([,.?!])(?=[가-힣])/g;
              while ((match = safePunctuationRegex.exec(text)) !== null) {
                replacements.push({
                  from: pos + match.index,
                  to: pos + match.index + 1, // replace the punctuation with itself + space
                  text: match[0] + " ",
                });
              }

              // Rule D: Weird arrow normalization (--> -> →)
              const arrowRegex = /-->/g;
              while ((match = arrowRegex.exec(text)) !== null) {
                replacements.push({
                  from: pos + match.index,
                  to: pos + match.index + match[0].length,
                  text: "→",
                });
              }
            }
          });

          // 3. Handle Smart Paragraph Breaks
          // We need a separate pass or careful handling because splits change document structure
          // It's safer to analyze for splits on the *original* doc structure
          if (this.options.smartParagraphBreaks) {
            doc.descendants((node: Node, pos: number) => {
              if (node.type.name === "paragraph" && node.textContent) {
                const text = node.textContent;

                // Pattern 1: Sentence End + Space + Quote Start (e.g., ...했다. "그러면...)
                // This effectively moves dialogue to a new line
                const dialogueStartRegex = /([.?!])\s+(?=["'])/g;
                let match;
                while ((match = dialogueStartRegex.exec(text)) !== null) {
                  // Split AT the space. match.index is start of punctuation.
                  // punctuation is 1 char (usually). space is following.
                  // match[0] is ".[space]"
                  // We want to split after the space? No, typically before the quote.
                  // If we split at `pos + match.index + 1` (after punctuation), the space remains in the second paragraph?
                  // Better to delete the space and split.
                  // But splitting implies a new block.
                  // Let's just split at the position of the quote.

                  // match.index + match[1].length + (space length)
                  // We want the split to happen exactly where the Quote starts.
                  const splitPos = pos + 1 + match.index + match[0].length; // pos + 1 for start of node
                  // Wait, regex match includes lookahead? No, lookahead is zero-width.
                  // text: `End. "Start`
                  // match: `. ` (dot + space)
                  // match.index: 0
                  // splitPos should be at `"`.

                  // But wait, `split` operation requires a position strictly inside the node or at boundaries?
                  // tr.split(pos) splits the node *containing* pos.

                  // Simpler logic:
                  // If we find `End. "Start`, we want to turn it into:
                  // `End.`
                  // `"Start`
                  // So we arguably want to delete the space and split.

                  // For now, let's just mark the split position.
                  // Splitting deeply nested nodes might be tricky, but for top-level paragraphs it's fine.

                  splits.push(splitPos);
                }

                // Pattern 2: Quote End + Space + Quote Start (e.g., "Hi." "Hello.")
                // Dialogue exchange on same line -> split
                const quoteExchangeRegex = /(['"])\s+(?=["'])/g;
                while ((match = quoteExchangeRegex.exec(text)) !== null) {
                  const splitPos = pos + 1 + match.index + match[0].length;
                  splits.push(splitPos);
                }
              }
            });
          }

          // Apply changes
          // We must apply them in reverse order of position to preserve indices

          // Combine all changes
          // Note: Replacements within the same text node might conflict if not careful.
          // BUT, since we iterate linearly and push specific ranges, we just need to ensure
          // we don't overlappingly modify.
          // The current simple regexes might overlap if we are not careful (e.g. "  ..." -> space + ellipsis).
          // But our loops run independently.
          // Better strategy: Apply replacements in one go or use a robust "update text" approach.

          // For simplicity and safety in Tiptap/ProseMirror:
          // It's often better to gather all changes and sort by index Descending.

          const allChanges: {
            type: "delete" | "replace" | "split";
            from: number;
            to?: number; // Optional for split
            text?: string;
          }[] = [
            ...deletions.map((d) => ({
              type: "delete" as const,
              ...d,
              to: d.to,
            })),
            ...replacements.map((r) => ({
              type: "replace" as const,
              ...r,
              to: r.to,
            })),
            ...splits.map((s) => ({ type: "split" as const, from: s, to: s })),
          ];

          // Sort descending
          // Use 'from' as primary sort key
          allChanges.sort((a, b) => b.from - a.from);

          let validChangeCount = 0;

          allChanges.forEach((change) => {
            if (change.type === "delete" && change.to !== undefined) {
              tr.delete(change.from, change.to);
              validChangeCount++;
            } else if (
              change.type === "replace" &&
              change.to !== undefined &&
              change.text !== undefined
            ) {
              tr.replaceWith(
                change.from,
                change.to,
                state.schema.text(change.text),
              );
              validChangeCount++;
            } else if (change.type === "split") {
              // Verify position is still valid/mappable?
              // Since we sort descending, previous operations (higher pos) shouldn't affect lower pos logic
              // BUT text replacements might coincide locally.
              // It's risky to split blindly if a replacement touched the same area.
              // However, replacements are mostly character-level.
              // We should just attempt split.
              // tr.split(pos) expects pos to be *inside* the node to split?
              // Yes.
              try {
                tr.split(change.from);
                validChangeCount++;
              } catch {
                // ignore split errors (e.g. invalid pos)
              }
            }
          });

          if (validChangeCount > 0) {
            tr.setMeta("autoFormat", true);
            return true;
          }

          return false;
        },
    };
  },
});
