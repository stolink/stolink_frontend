/**
 * Simple string hashing function for change detection.
 * Not cryptographically secure, but enough for idempotency checks.
 * Uses a 32-bit FNV-like hash algorithm.
 */
export function calculateContentHash(content: string): string {
  let hash = 0;
  if (!content) return "0";

  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  return hash.toString(36);
}
