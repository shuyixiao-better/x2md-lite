const INVALID_FILENAME_CHARS = /[\/\\:*?"<>|]/g;

export function sanitizeFilename(input: string): string {
  return input
    .replace(INVALID_FILENAME_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}
