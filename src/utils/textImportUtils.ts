export interface ImportedSegment {
  title: string;
  content: string;
}

/**
 * Reads a file with auto-detected encoding (UTF-8 or EUC-KR fallback)
 */
export const readFileWithEncoding = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();

  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    const text = utf8Decoder.decode(buffer);
    if (!text.includes("")) {
      return text;
    }
  } catch {
    // UTF-8 decoding failed
  }

  try {
    const eucKrDecoder = new TextDecoder("euc-kr");
    return eucKrDecoder.decode(buffer);
  } catch {
    const fallbackDecoder = new TextDecoder("utf-8", { fatal: false });
    return fallbackDecoder.decode(buffer);
  }
};

/**
 * Cleans text by normalizing line breaks and removing excessive whitespace
 * Preserves paragraph structure
 */
export const cleanText = (text: string): string => {
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  cleaned = cleaned
    .replace(/\n{2,}/g, "<<<PARA>>>")
    // Note: The original regex looked for single newlines after punctuation to optionally merge lines,
    // but for safety in preserving intended formatting, we often just normalize.
    // However, let's keep the user's apparent preference for merging lines that look like hard wraps.
    .replace(/([.!?。！？])\n(?=[^\s])/g, "$1<<<PARA>>>")
    .replace(/\n/g, " ") // Merge lines within a paragraph
    .replace(/<<<PARA>>>/g, "\n\n") // Restore paragraphs
    .replace(/  +/g, " ")
    .trim();

  return cleaned;
};

/**
 * Converts plain text to basic HTML paragraphs
 */
export const processContentToHtml = (text: string): string => {
  // If text is already HTML-like (basic check), arguably we might want to skip,
  // but for this utility we assume input is plain text source.
  const cleaned = cleanText(text);
  return cleaned
    .split("\n\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${p.trim()}</p>`)
    .join("");
};

/**
 * Recursively splits text into chunks of approximately `maxChars` length,
 * attempting to break at logical boundaries (newlines, periods).
 */
export const splitTextIntoSections = (
  text: string,
  maxChars: number = 5000,
): ImportedSegment[] => {
  // If text is small enough, return as single section
  if (text.length <= maxChars) {
    return [{ title: "Section 1", content: text }];
  }

  const separators = ["\n\n", "\n", ". ", " "];
  const chunks: string[] = [];

  const splitRecursive = (currentText: string) => {
    if (currentText.length <= maxChars) {
      chunks.push(currentText);
      return;
    }

    let bestSplitIndex = -1;
    let separatorUsed = "";

    // Find the best place to split within the allowable limit
    for (const separator of separators) {
      // Look backwards from the maxChars limit
      const lastIndex = currentText.lastIndexOf(separator, maxChars);

      // If we found a separator and it's not too close to the beginning (avoiding tiny chunks if possible)
      if (lastIndex !== -1 && lastIndex > maxChars * 0.3) {
        bestSplitIndex = lastIndex;
        separatorUsed = separator;
        break;
      }
    }

    // Fallback: Hard split if no good separator found
    if (bestSplitIndex === -1) {
      bestSplitIndex = maxChars;
    }

    const chunk = currentText.substring(
      0,
      bestSplitIndex + separatorUsed.length,
    );
    chunks.push(chunk);

    const remaining = currentText.substring(
      bestSplitIndex + separatorUsed.length,
    );
    if (remaining.trim().length > 0) {
      splitRecursive(remaining);
    }
  };

  splitRecursive(text);

  return chunks.map((content, index) => ({
    title: `Part ${index + 1}`,
    content: content.trim(),
  }));
};

/**
 * Detects chapter patterns and splits the full text into chapter segments.
 * Returns null if no chapter structure is detected.
 */
export const splitContentByChapters = (
  text: string,
): ImportedSegment[] | null => {
  const pattern =
    /(?:^|\n)\s*((?:Chapter|제|Section|Part)\s*\d+[^(\n)]*|Prologue|Epilogue|프롤로그|에필로그|Episode\s*\d+).*/gi;

  const matches = [...text.matchAll(pattern)];

  if (matches.length < 2) {
    return null;
  }

  const segments: ImportedSegment[] = [];

  matches.forEach((match, i) => {
    const matchIndex = match.index!;
    const matchLength = match[0].length;
    const title = match[1].trim();

    // Capture content before the first chapter as "Intro"
    if (i === 0 && matchIndex > 0) {
      const introContent = text.substring(0, matchIndex).trim();
      if (introContent) {
        segments.push({ title: "Intro", content: introContent });
      }
    }

    const contentStart = matchIndex + matchLength;
    const nextMatch = matches[i + 1];
    const contentEnd = nextMatch ? nextMatch.index! : text.length;

    const content = text.substring(contentStart, contentEnd).trim();
    segments.push({ title, content });
  });

  return segments;
};
