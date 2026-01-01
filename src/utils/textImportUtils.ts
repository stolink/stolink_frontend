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
