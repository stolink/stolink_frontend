/**
 * Export Service
 * TXT, Markdown, DOCX 내보내기 및 JSON 가져오기 기능
 */

import { saveAs } from "file-saver";
import TurndownService from "turndown";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import type { Document } from "@/types/document";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

/**
 * HTML 콘텐츠에서 순수 텍스트 추출
 */
function htmlToText(html: string): string {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

/**
 * 문서 목록을 TXT 파일로 내보내기
 */
export function exportToTxt(
  documents: Document[],
  projectTitle: string = "작품",
): void {
  const content = documents
    .filter((doc) => doc.type === "text")
    .map((doc) => {
      const text = htmlToText(doc.content);
      return `=== ${doc.title} ===\n\n${text}`;
    })
    .join("\n\n\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${projectTitle}.txt`);
}

/**
 * 문서 목록을 마크다운 파일로 내보내기
 */
export function exportToMarkdown(
  documents: Document[],
  projectTitle: string = "작품",
): void {
  const content = documents
    .filter((doc) => doc.type === "text")
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
function htmlToDocxParagraphs(html: string): Paragraph[] {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const paragraphs: Paragraph[] = [];

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
            new Paragraph({
              text,
              heading: HeadingLevel.HEADING_1,
            }),
          );
          break;
        case "h2":
          paragraphs.push(
            new Paragraph({
              text,
              heading: HeadingLevel.HEADING_2,
            }),
          );
          break;
        case "h3":
          paragraphs.push(
            new Paragraph({
              text,
              heading: HeadingLevel.HEADING_3,
            }),
          );
          break;
        case "p":
          paragraphs.push(
            new Paragraph({
              children: parseInlineFormatting(el),
            }),
          );
          break;
        case "blockquote":
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text, italics: true })],
            }),
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
 * 인라인 서식 파싱 (bold, italic, underline)
 */
function parseInlineFormatting(el: HTMLElement): TextRun[] {
  const runs: TextRun[] = [];

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
}

/**
 * 문서 목록을 DOCX 파일로 내보내기
 */
export async function exportToDocx(
  documents: Document[],
  projectTitle: string = "작품",
): Promise<void> {
  const sections: Paragraph[] = [];

  // 제목 페이지
  sections.push(
    new Paragraph({
      text: projectTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  );

  // 각 문서를 섹션으로 추가
  documents
    .filter((doc) => doc.type === "text")
    .forEach((doc, index) => {
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
      const paragraphs = htmlToDocxParagraphs(doc.content);
      sections.push(...paragraphs);
    });

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
export function exportToJson(
  data: Record<string, unknown>,
  projectTitle: string = "작품",
): void {
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
  // Dynamic import for browser compatibility
  const epub = (await import("epub-gen-memory/bundle")).default;

  const textDocs = documents.filter((doc) => doc.type === "text");

  const chapters = textDocs.map((doc) => ({
    title: doc.title,
    content: doc.content || "<p></p>",
  }));

  const options = {
    title: projectTitle,
    author: author,
    content: chapters,
  };

  const epubBlob = await epub(options);
  saveAs(epubBlob, `${projectTitle}.epub`);
}

/**
 * 문서 목록을 PDF 파일로 내보내기
 */
export async function exportToPdf(
  documents: Document[],
  projectTitle: string = "작품",
): Promise<void> {
  // Dynamic import for html2pdf
  const html2pdf = (await import("html2pdf.js")).default;

  const textDocs = documents.filter((doc) => doc.type === "text");

  // Build HTML content
  const htmlContent = `
    <div style="font-family: 'Noto Sans KR', sans-serif; padding: 20px;">
      <h1 style="text-align: center; margin-bottom: 40px; font-size: 28px;">${projectTitle}</h1>
      ${textDocs
        .map(
          (doc, index) => `
        ${index > 0 ? '<div style="page-break-before: always;"></div>' : ""}
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">${doc.title}</h2>
        <div style="font-size: 14px; line-height: 1.8;">${doc.content}</div>
      `,
        )
        .join("")}
    </div>
  `;

  // Create temporary container
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const options = {
    margin: 15,
    filename: `${projectTitle}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(options).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}
