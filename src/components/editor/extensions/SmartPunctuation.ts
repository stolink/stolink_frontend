import { Extension, InputRule } from "@tiptap/core";

export interface SmartPunctuationOptions {
  /**
   * Enable smart quotes: " -> curly quotes
   */
  smartQuotes: boolean;
  /**
   * Enable smart dashes: -- -> em dash
   */
  smartDashes: boolean;
  /**
   * Enable smart ellipsis: ... -> ellipsis
   */
  smartEllipsis: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    smartPunctuation: {
      setSmartQuotes: (enabled: boolean) => ReturnType;
      setSmartDashes: (enabled: boolean) => ReturnType;
      setSmartEllipsis: (enabled: boolean) => ReturnType;
    };
  }
}

// Unicode characters
const LEFT_DOUBLE_QUOTE = "\u201C"; // "
const RIGHT_DOUBLE_QUOTE = "\u201D"; // "
const LEFT_SINGLE_QUOTE = "\u2018"; // '
const RIGHT_SINGLE_QUOTE = "\u2019"; // '
const EM_DASH = "\u2014"; // —
const ELLIPSIS = "\u2026"; // …

/**
 * Helper function to create text replacement input rule
 * Compatible with Tiptap 3.x InputRule API
 */
function textReplacementRule(
  find: RegExp,
  replace: string | ((match: RegExpMatchArray) => string)
): InputRule {
  return new InputRule({
    find,
    handler: ({ range, match, commands }) => {
      const replacement =
        typeof replace === "function" ? replace(match) : replace;
      // Use chain to handle insertion properly
      commands.insertContentAt(range, replacement);
    },
  });
}

export const SmartPunctuation = Extension.create<SmartPunctuationOptions>({
  name: "smartPunctuation",

  addOptions() {
    return {
      smartQuotes: true,
      smartDashes: true,
      smartEllipsis: true,
    };
  },

  addCommands() {
    return {
      setSmartQuotes: (enabled: boolean) => () => {
        this.options.smartQuotes = enabled;
        return true;
      },
      setSmartDashes: (enabled: boolean) => () => {
        this.options.smartDashes = enabled;
        return true;
      },
      setSmartEllipsis: (enabled: boolean) => () => {
        this.options.smartEllipsis = enabled;
        return true;
      },
    };
  },

  addInputRules() {
    const rules: InputRule[] = [];

    // Smart Quotes
    if (this.options.smartQuotes) {
      // Opening double quote (after space, newline, or start of text)
      rules.push(
        textReplacementRule(
          /(?:^|[\s\n([\-\u2013\u2014])"$/,
          (match) => match[0].slice(0, -1) + LEFT_DOUBLE_QUOTE
        )
      );

      // Closing double quote (after any character except space)
      rules.push(
        textReplacementRule(
          /[^\s]"$/,
          (match) => match[0].slice(0, -1) + RIGHT_DOUBLE_QUOTE
        )
      );

      // Opening single quote
      rules.push(
        textReplacementRule(
          /(?:^|[\s\n([\-\u2013\u2014])'$/,
          (match) => match[0].slice(0, -1) + LEFT_SINGLE_QUOTE
        )
      );

      // Closing single quote
      rules.push(
        textReplacementRule(
          /[^\s]'$/,
          (match) => match[0].slice(0, -1) + RIGHT_SINGLE_QUOTE
        )
      );
    }

    // Smart Dashes
    if (this.options.smartDashes) {
      // Double dash to em dash: -- -> —
      rules.push(textReplacementRule(/--$/, EM_DASH));
    }

    // Smart Ellipsis
    if (this.options.smartEllipsis) {
      // Triple period to ellipsis: ... -> …
      rules.push(textReplacementRule(/\.\.\.$/, ELLIPSIS));
    }

    return rules;
  },
});
