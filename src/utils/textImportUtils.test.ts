import { describe, it, expect } from "vitest";
import { cleanText } from "./textImportUtils";

describe("textImportUtils", () => {
  describe("cleanText", () => {
    it("should normalize line endings", () => {
      const input = "Hello\r\nWorld\r";
      expect(cleanText(input)).toBe("Hello World");
    });

    it("should preserve paragraphs (double newlines)", () => {
      const input = "Para 1.\n\nPara 2.";
      expect(cleanText(input)).toBe("Para 1.\n\nPara 2.");
    });

    it("should merge single newlines into spaces", () => {
      const input = "This is a single\nsentence split across lines.";
      expect(cleanText(input)).toBe(
        "This is a single sentence split across lines.",
      );
    });

    it("should handle the special punctuation case", () => {
      // Logic: replace(/([.!?。！？])\n(?=[^\s])/g, "$1<<<PARA>>>")
      // If a sentence ends with ., and is followed by \n and then non-whitespace, it treats it as a paragraph?
      // Wait, let's check the implementation logic.
      // .replace(/([.!?。！？])\n(?=[^\s])/g, "$1<<<PARA>>>")
      // "End." + \n + "Next" -> "End." + \n\n + "Next"
      const input = "End.\nNext";
      expect(cleanText(input)).toBe("End.\n\nNext");
    });
  });
});
