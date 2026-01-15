/**
 * Korean Search Utility
 * Supports Chosung (Initial Consonant) matching and space-insensitivity.
 */

const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

/**
 * Checks if a character is a Korean Chosung (Initial Consonant)
 */
function isChosung(char: string) {
  return /[ㄱ-ㅎ]/.test(char);
}

/**
 * Generates a Regex pattern from a Chosung-mixed query
 * Example: "홍ㄱㄷ" -> "홍[가-깋]ㄷ.*" (simplified explanation)
 */
export function getKoreanRegex(query: string): RegExp {
  /*
    Refined logic:
    We constructed `pattern` chunks. Now join them with `\s*`.
  */

  // Temporarily handled inside function for simplicity
  const chunks = query.split("").map((char) => {
    if (char === " ") return "\\s*"; // Explicit space matches 0 or more spaces
    if (isChosung(char)) {
      const index = CHOSUNG.indexOf(char);
      if (index !== -1) {
        const begin = 0xac00 + index * 588;
        const end = 0xac00 + (index + 1) * 588 - 1;
        return `[${char}${String.fromCharCode(begin)}-${String.fromCharCode(end)}]`;
      }
    }
    return /[.*+?^${}()|[\]\\]/.test(char) ? "\\" + char : char;
  });

  // Join with \s* to allow spaces in target between any query chars
  // e.g. Query "홍길" -> matches "홍 길", "홍길"
  return new RegExp(chunks.join("\\s*"), "i");
}

/**
 * Simple matcher helper
 */
export function matchKorean(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;
  const regex = getKoreanRegex(query);
  return regex.test(target);
}
