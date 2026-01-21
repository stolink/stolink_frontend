/**
 * Export Service
 * TXT, Markdown, DOCX 내보내기 및 JSON 가져오기 기능
 */

import type { Document } from "@/types/document";

const parser = new DOMParser();

/**
 * Helper: Lazy load TurndownService
 */
async function getTurndownService() {
  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  // Custom rule to preserve highlight (mark) tags
  turndown.addRule("highlight", {
    filter: "mark",
    replacement: function (content) {
      return `==${content}==`;
    },
  });

  return turndown;
}

/**
 * Helper: Parse HTML string safely using DOMParser
 */
function parseHtmlString(html: string): HTMLElement {
  const doc = parser.parseFromString(html, "text/html");
  return doc.body;
}

/**
 * HTML 콘텐츠에서 순수 텍스트 추출
 */
function htmlToText(html: string): string {
  const temp = parseHtmlString(html);
  return temp.textContent || temp.innerText || "";
}

/**
 * HTML 콘텐츠에서 복선 태그 제거 및 PDF용 스타일 정규화
 * #복선:태그명 형식의 텍스트와 foreshadowingSuggest 노드를 제거
 * mark, li 등의 요소에 인라인 스타일 추가
 */
function removeForeshadowingTags(html: string): string {
  const temp = parseHtmlString(html);

  // Remove foreshadowingSuggest nodes
  temp
    .querySelectorAll("[data-type='foreshadowingSuggest']")
    .forEach((el) => el.remove());
  temp.querySelectorAll(".foreshadowing-tag").forEach((el) => el.remove());

  // Fix mark (highlight) vertical alignment - apply inline styles
  temp.querySelectorAll("mark").forEach((el) => {
    el.setAttribute(
      "style",
      "background-color: rgba(164, 119, 100, 0.3); " +
        "padding: 0 2px; " +
        "border-radius: 2px;",
    );
  });

  // Fix list items - unwrap p tags inside li (Tiptap wraps content in p)
  temp.querySelectorAll("li > p").forEach((p) => {
    const li = p.parentElement;
    if (li) {
      // Move p's content directly into li
      while (p.firstChild) {
        li.insertBefore(p.firstChild, p);
      }
      p.remove();
    }
  });

  // Apply consistent line-height to lists
  temp.querySelectorAll("ol, ul").forEach((el) => {
    el.setAttribute(
      "style",
      "list-style-position: outside; padding-left: 2rem; margin: 0.75rem 0;",
    );
  });

  // Remove any remaining #복선:* text patterns
  let result = temp.innerHTML;
  result = result.replace(/#복선:[^\s<]+/g, "");
  result = result.replace(/#복선\d*[^\s<]*/g, "");

  return result;
}

/**
 * 문서 목록을 TXT 파일로 내보내기
 */
export async function exportToTxt(
  documents: Document[],
  projectTitle: string = "작품",
): Promise<void> {
  const { saveAs } = await import("file-saver");
  const content = documents
    .map((doc) => {
      // Remove foreshadowing tags before converting to text
      const cleanedHtml = removeForeshadowingTags(doc.content);
      const text = htmlToText(cleanedHtml);
      return `=== ${doc.title} ===\n\n${text}`;
    })
    .join("\n\n\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${projectTitle}.txt`);
}

/**
 * 문서 목록을 마크다운 파일로 내보내기
 */
export async function exportToMarkdown(
  documents: Document[],
  projectTitle: string = "작품",
): Promise<void> {
  const { saveAs } = await import("file-saver");
  const turndown = await getTurndownService();

  const content = documents
    .map((doc) => {
      const markdown = turndown.turndown(doc.content);
      return `# ${doc.title}\n\n${markdown}`;
    })
    .join("\n\n---\n\n");

  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, `${projectTitle}.md`);
}

/**
 * HTML을 DOCX 문단으로 변환
 */
async function htmlToDocxParagraphs(
  html: string,
  docx: typeof import("docx"),
): Promise<import("docx").Paragraph[]> {
  const { Paragraph, TextRun, HeadingLevel } = docx;
  const temp = parseHtmlString(html);
  const paragraphs: import("docx").Paragraph[] = [];

  // Helper for inline formatting
  const parseInlineFormatting = (el: HTMLElement) => {
    const runs: import("docx").TextRun[] = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text) runs.push(new TextRun(text));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const child = node as HTMLElement;
        const tag = child.tagName.toLowerCase();
        const text = child.textContent || "";
        switch (tag) {
          case "strong":
          case "b":
            runs.push(new TextRun({ text, bold: true }));
            break;
          case "em":
          case "i":
            runs.push(new TextRun({ text, italics: true }));
            break;
          case "u":
            runs.push(new TextRun({ text, underline: {} }));
            break;
          case "mark":
            runs.push(new TextRun({ text, highlight: "yellow" }));
            break;
          default:
            runs.push(new TextRun(text));
        }
      }
    });
    return runs;
  };

  temp.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent || "";

      switch (tagName) {
        case "h1":
          paragraphs.push(
            new Paragraph({ text, heading: HeadingLevel.HEADING_1 }),
          );
          break;
        case "h2":
          paragraphs.push(
            new Paragraph({ text, heading: HeadingLevel.HEADING_2 }),
          );
          break;
        case "h3":
          paragraphs.push(
            new Paragraph({ text, heading: HeadingLevel.HEADING_3 }),
          );
          break;
        case "h4":
          paragraphs.push(
            new Paragraph({ text, heading: HeadingLevel.HEADING_4 }),
          );
          break;
        case "h5":
          paragraphs.push(
            new Paragraph({ text, heading: HeadingLevel.HEADING_5 }),
          );
          break;
        case "h6":
          paragraphs.push(
            new Paragraph({ text, heading: HeadingLevel.HEADING_6 }),
          );
          break;
        case "p":
          paragraphs.push(
            new Paragraph({ children: parseInlineFormatting(el) }),
          );
          break;
        case "blockquote":
          paragraphs.push(
            new Paragraph({ children: [new TextRun({ text, italics: true })] }),
          );
          break;
        case "ul":
        case "ol":
          el.querySelectorAll("li").forEach((li) => {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun(`• ${li.textContent || ""}`)],
              }),
            );
          });
          break;
        default:
          if (text.trim()) {
            paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
          }
      }
    }
  });

  return paragraphs;
}

/**
 * 문서 목록을 DOCX 파일로 내보내기
 */
export async function exportToDocx(
  documents: Document[],
  projectTitle: string = "작품",
): Promise<void> {
  const docx = await import("docx");
  const { saveAs } = await import("file-saver");
  const { Document: DocxDocument, Packer, Paragraph, HeadingLevel } = docx;

  const sections: import("docx").Paragraph[] = [];

  // 제목 페이지
  sections.push(
    new Paragraph({
      text: projectTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  );

  // 각 문서를 섹션으로 추가
  for (let index = 0; index < documents.length; index++) {
    const doc = documents[index];
    // 문서 간 구분선 (첫 번째 제외)
    if (index > 0) {
      sections.push(new Paragraph({ text: "" }));
      sections.push(
        new Paragraph({ text: "* * *", alignment: "center" as const }),
      );
      sections.push(new Paragraph({ text: "" }));
    }

    // 섹션 제목
    sections.push(
      new Paragraph({
        text: doc.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      }),
    );

    // 본문
    const paragraphs = await htmlToDocxParagraphs(doc.content, docx);
    sections.push(...paragraphs);
  }

  const docxDoc = new DocxDocument({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBlob(docxDoc);
  saveAs(buffer, `${projectTitle}.docx`);
}

/**
 * JSON 백업 파일로 내보내기
 */
export async function exportToJson(
  data: Record<string, unknown>,
  projectTitle: string = "작품",
): Promise<void> {
  const { saveAs } = await import("file-saver");
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  saveAs(blob, `${projectTitle}_backup.json`);
}

/**
 * JSON 백업 파일 가져오기
 */
export async function importFromJson(
  file: File,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        resolve(data);
      } catch {
        reject(new Error("유효하지 않은 JSON 파일입니다."));
      }
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsText(file);
  });
}

/**
 * 문서 목록을 EPUB 파일로 내보내기
 */
export async function exportToEpub(
  documents: Document[],
  projectTitle: string = "작품",
  author: string = "작가",
): Promise<void> {
  const { saveAs } = await import("file-saver");
  // Dynamic import for browser compatibility
  const epub = (await import("epub-gen-memory/bundle")).default;

  const textDocs = documents;

  const chapters = textDocs.map((doc) => ({
    title: doc.title,
    content: doc.content || "<p></p>",
  }));

  const options = {
    title: projectTitle,
    author: author,
  };

  const epubBlob = await epub(options, chapters);
  saveAs(epubBlob, `${projectTitle}.epub`);
}

/**
 * 문서 목록을 PDF 파일로 내보내기
 * Markdown으로 변환 후 깔끔한 HTML로 렌더링하여 PDF 생성
 * @param documents 문서 목록
 * @param projectTitle 프로젝트 제목
 * @param options 내보내기 옵션 (fontSize, lineHeight)
 */
export async function exportToPdf(
  documents: Document[],
  projectTitle: string = "작품",
  options?: { fontSize?: number; lineHeight?: number },
): Promise<void> {
  // Dynamic import for html2pdf
  const html2pdf = (await import("html2pdf.js")).default;
  const turndown = await getTurndownService();

  const fontSize = options?.fontSize ?? 14;
  const lineHeight = options?.lineHeight ?? 1.8;

  // Convert each document: HTML -> Markdown -> Clean Text
  const convertedDocs = documents.map((doc) => {
    // Remove foreshadowing tags first
    const cleanedHtml = removeForeshadowingTags(doc.content);
    // Convert to markdown for consistent formatting
    const markdown = turndown.turndown(cleanedHtml);
    return {
      title: doc.title,
      markdown,
    };
  });

  // Convert markdown to simple, clean HTML
  const markdownToSimpleHtml = (md: string): string => {
    let html = md;

    // Headers
    html = html.replace(
      /^###### (.+)$/gm,
      '<h6 style="font-size: ' +
        fontSize +
        'px; font-weight: 600; margin: 0.6em 0 0.2em;">$1</h6>',
    );
    html = html.replace(
      /^##### (.+)$/gm,
      '<h5 style="font-size: ' +
        fontSize * 1.1 +
        'px; font-weight: 600; margin: 0.8em 0 0.3em;">$1</h5>',
    );
    html = html.replace(
      /^#### (.+)$/gm,
      '<h4 style="font-size: ' +
        fontSize * 1.25 +
        'px; font-weight: 600; margin: 1em 0 0.4em;">$1</h4>',
    );
    html = html.replace(
      /^### (.+)$/gm,
      '<h3 style="font-size: ' +
        fontSize * 1.5 +
        'px; font-weight: 600; margin: 1.2em 0 0.4em;">$1</h3>',
    );
    html = html.replace(
      /^## (.+)$/gm,
      '<h2 style="font-size: ' +
        fontSize * 1.75 +
        'px; font-weight: 700; margin: 1.4em 0 0.5em;">$1</h2>',
    );
    html = html.replace(
      /^# (.+)$/gm,
      '<h1 style="font-size: ' +
        fontSize * 2 +
        'px; font-weight: 700; margin: 1.5em 0 0.5em;">$1</h1>',
    );

    // Bold and Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
    // Highlight (==text==) - just show as plain text to avoid alignment issues
    html = html.replace(/==(.+?)==/g, "$1");
    html = html.replace(
      /`(.+?)`/g,
      '<code style="background: #f5f5f5; padding: 0 4px; border-radius: 3px;">$1</code>',
    );

    // Blockquotes
    html = html.replace(
      /^> (.+)$/gm,
      '<blockquote style="border-left: 3px solid #bd9b8d; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #7d5a4b;">$1</blockquote>',
    );

    // Lists - convert to plain text with symbols
    html = html.replace(
      /^- (.+)$/gm,
      '<div style="margin-left: 1.5rem; text-indent: -1rem;">• $1</div>',
    );
    html = html.replace(/^\d+\. (.+)$/gm, (_match, content, offset, string) => {
      // Count which number this is by looking at surrounding context
      const before = string.substring(0, offset);
      const listItemsBefore = (before.match(/^\d+\. /gm) || []).length;
      return `<div style="margin-left: 1.5rem; text-indent: -1rem;">${listItemsBefore + 1}. ${content}</div>`;
    });

    // Horizontal rules
    html = html.replace(
      /^---$/gm,
      '<hr style="border: none; border-top: 1px solid #ccc; margin: 1.5rem 0;">',
    );

    // Paragraphs (lines that aren't already wrapped)
    html = html
      .split("\n")
      .map((line) => {
        if (line.trim() === "") return "<br>";
        if (line.startsWith("<")) return line;
        return `<p style="margin-bottom: 0.5em; line-height: ${lineHeight};">${line}</p>`;
      })
      .join("\n");

    return html;
  };

  // Build HTML content
  const htmlContent = `
    <div style="font-family: 'Noto Sans KR', 'Pretendard', sans-serif; padding: 20px; font-size: ${fontSize}px; line-height: ${lineHeight};">
      <h1 style="text-align: center; margin-bottom: 40px; font-size: ${fontSize * 2}px; font-weight: 700;">${projectTitle}</h1>
      ${convertedDocs
        .map(
          (doc, index) => `
        ${index > 0 ? '<div style="page-break-before: always;"></div>' : ""}
        <h2 style="font-size: ${fontSize * 1.5}px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; font-weight: 700;">${doc.title}</h2>
        <div>${markdownToSimpleHtml(doc.markdown)}</div>
      `,
        )
        .join("")}
    </div>
  `;

  // Create temporary container
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const pdfOptions = {
    margin: 15,
    filename: `${projectTitle}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: {
      unit: "mm" as const,
      format: "a4" as const,
      orientation: "portrait" as const,
    },
  };

  try {
    await html2pdf().set(pdfOptions).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}
