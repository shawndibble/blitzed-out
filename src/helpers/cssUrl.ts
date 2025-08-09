/**
 * Creates a properly formatted CSS url() string with safe escaping
 * @param url - The URL to format for CSS
 * @returns A properly formatted CSS url() string
 */
export function cssUrl(url: string): string {
  // Convert to string and strip control characters by iterating over code points
  const cleanedUrl = Array.from(String(url))
    .filter((char) => {
      const codePoint = char.codePointAt(0);
      if (codePoint === undefined) return false;

      // Filter out control characters:
      // - C0 controls: U+0000 to U+001F
      // - DEL: U+007F
      // - C1 controls: U+0080 to U+009F
      // - Line separator: U+2028
      // - Paragraph separator: U+2029
      return !(
        (codePoint >= 0x00 && codePoint <= 0x1f) ||
        codePoint === 0x7f ||
        (codePoint >= 0x80 && codePoint <= 0x9f) ||
        codePoint === 0x2028 ||
        codePoint === 0x2029
      );
    })
    .join('');

  // Escape backslashes and double quotes
  const escapedUrl = cleanedUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  return `url("${escapedUrl}")`;
}
