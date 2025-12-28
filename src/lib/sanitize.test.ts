import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeText, sanitizeEditorContent } from "./sanitize";

describe("sanitize", () => {
  describe("sanitizeHtml", () => {
    it("XSS 공격 벡터를 제거해야 한다", () => {
      const malicious = '<script>alert("xss")</script><p>Hello</p>';
      const clean = sanitizeHtml(malicious);
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("<p>Hello</p>");
    });

    it("이벤트 핸들러 속성을 제거해야 한다", () => {
      const malicious = '<img src="x" onerror="alert(1)" />';
      const clean = sanitizeHtml(malicious);
      expect(clean).not.toContain("onerror");
      expect(clean).toContain("<img");
    });

    it("허용된 태그와 속성은 보존해야 한다", () => {
      const safe =
        '<p class="text-bold"><a href="https://example.com" target="_blank">Link</a></p>';
      const clean = sanitizeHtml(safe);
      expect(clean).toBe(safe);
    });

    it("데이터 속성을 보존해야 한다 (Tiptap 멘션 등)", () => {
      const mention = '<span data-type="mention" data-id="123">@User</span>';
      const clean = sanitizeHtml(mention);
      expect(clean).toBe(mention);
    });
  });

  describe("sanitizeText", () => {
    it("모든 HTML 태그를 제거해야 한다", () => {
      const html = "<p><b>Hello</b> World</p>";
      const text = sanitizeText(html);
      expect(text).toBe("Hello World");
    });

    it("엔티티 코드는 보존되거나 변환되어야 한다", () => {
      const html = "Tom &amp; Jerry";
      const text = sanitizeText(html);
      expect(text).toBe("Tom &amp; Jerry");
    });
  });

  describe("sanitizeEditorContent", () => {
    it("빈 문자열이나 null을 안전하게 처리해야 한다", () => {
      expect(sanitizeEditorContent("")).toBe("");
      // @ts-expect-error - 런타임 널 체크 테스트
      expect(sanitizeEditorContent(null)).toBe("");
    });

    it("내부적으로 sanitizeHtml을 호출해야 한다", () => {
      const html = "<script>alert(1)</script><p>Content</p>";
      const result = sanitizeEditorContent(html);
      expect(result).toBe("<p>Content</p>");
    });
  });
});
