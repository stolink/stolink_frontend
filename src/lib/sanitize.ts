import DOMPurify from "dompurify";

/**
 * HTML 콘텐츠를 정제하여 XSS 공격을 방지합니다.
 * Tiptap 에디터에서 사용하는 안전한 태그와 속성만 허용합니다.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      // Headings
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      // Lists
      "ul",
      "ol",
      "li",
      // Tables
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      // Links and media
      "a",
      "img",
      // Containers
      "div",
      "span",
      // Custom mentions (Tiptap extensions)
      "character-mention",
      "foreshadowing-mention",
    ],
    ALLOWED_ATTR: [
      // Common attributes
      "class",
      "id",
      "style",
      // Link attributes
      "href",
      "target",
      "rel",
      // Image attributes
      "src",
      "alt",
      "width",
      "height",
      // Custom mention attributes
      "data-id",
      "data-label",
      "data-type",
      "contenteditable",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
}

/**
 * 일반 텍스트를 정제합니다 (HTML 태그 제거).
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

/**
 * 에디터 콘텐츠를 안전하게 파싱합니다.
 * 백엔드에서 받은 HTML을 에디터에 삽입하기 전에 사용합니다.
 */
export function sanitizeEditorContent(content: string): string {
  if (!content || content.trim() === "") {
    return "";
  }

  return sanitizeHtml(content);
}
