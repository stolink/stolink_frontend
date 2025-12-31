import { describe, it, expect } from "vitest";
import {
  cleanText,
  splitContentByChapters,
  splitTextIntoSections,
} from "./textImportUtils";

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

  describe("splitTextIntoSections", () => {
    it("should not split short text", () => {
      const input = "Short text.";
      const result = splitTextIntoSections(input, 100);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(input);
    });

    it("should split long text at separators", () => {
      // Create text with 3 sentences, total length > 100
      // "Sentence 1." (11) * 10 = 110 chars approximately
      const sentence = "This is a test sentence. ";
      const input = sentence.repeat(5); // ~125 chars
      const result = splitTextIntoSections(input, 50);

      expect(result.length).toBeGreaterThan(1);
      // Check that it didn't split in the middle of a word if possible
      expect(result[0].content.endsWith(".")).toBe(true);
    });

    it("should respect paragraph boundaries when splitting", () => {
      const p1 = "Paragraph 1 is here.";
      const p2 = "Paragraph 2 follows.";
      const input = `${p1}\n\n${p2}`;

      // Force split between paragraphs by setting maxChars just enough for p1
      const result = splitTextIntoSections(input, p1.length + 5);

      expect(result[0].content).toContain(p1);
      expect(result[1].content).toContain(p2);
    });
  });

  describe("splitContentByChapters", () => {
    it("should detect standard chapter headings", () => {
      const input =
        "Intro text\n\nChapter 1. The Beginning\nContent 1\n\nChapter 2. The End\nContent 2";
      const result = splitContentByChapters(input);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(3); // Intro, Ch1, Ch2

      expect(result![0].title).toBe("Intro");

      expect(result![1].title).toContain("Chapter 1");
      expect(result![1].content).toContain("Content 1");

      expect(result![2].title).toContain("Chapter 2");
      expect(result![2].content).toContain("Content 2");
    });

    it("should detect Korean patterns", () => {
      const input = "제1장 시작\n내용입니다.\n제2장 끝\n끝입니다.";
      const result = splitContentByChapters(input);

      expect(result).toHaveLength(2);
      expect(result![0].title).toBe("제1장 시작");
    });

    it("should return null if no chapters found", () => {
      const input = "Just some random text without chapter headers.";
      const result = splitContentByChapters(input);
      expect(result).toBeNull();
    });
  });
});
