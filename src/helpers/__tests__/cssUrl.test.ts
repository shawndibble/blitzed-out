import { describe, expect, it } from 'vitest';
import { cssUrl } from '../cssUrl';

describe('cssUrl', () => {
  describe('Basic functionality', () => {
    it('should format a simple URL correctly', () => {
      expect(cssUrl('https://example.com/image.jpg')).toBe('url("https://example.com/image.jpg")');
    });

    it('should handle empty string', () => {
      expect(cssUrl('')).toBe('url("")');
    });

    it('should handle URLs with query parameters', () => {
      expect(cssUrl('https://example.com/image.jpg?v=1&format=webp')).toBe(
        'url("https://example.com/image.jpg?v=1&format=webp")'
      );
    });
  });

  describe('Control character stripping', () => {
    it('should strip C0 control characters (U+0000 to U+001F)', () => {
      const urlWithC0Controls = 'https://example.com/image\x00\x01\x1F.jpg';
      expect(cssUrl(urlWithC0Controls)).toBe('url("https://example.com/image.jpg")');
    });

    it('should strip DEL character (U+007F)', () => {
      const urlWithDel = 'https://example.com/image\x7F.jpg';
      expect(cssUrl(urlWithDel)).toBe('url("https://example.com/image.jpg")');
    });

    it('should strip C1 control characters (U+0080 to U+009F)', () => {
      const urlWithC1Controls = 'https://example.com/image\x80\x9F.jpg';
      expect(cssUrl(urlWithC1Controls)).toBe('url("https://example.com/image.jpg")');
    });

    it('should strip line separator (U+2028)', () => {
      const urlWithLineSep = 'https://example.com/image\u2028.jpg';
      expect(cssUrl(urlWithLineSep)).toBe('url("https://example.com/image.jpg")');
    });

    it('should strip paragraph separator (U+2029)', () => {
      const urlWithParaSep = 'https://example.com/image\u2029.jpg';
      expect(cssUrl(urlWithParaSep)).toBe('url("https://example.com/image.jpg")');
    });

    it('should strip common control characters (newlines, carriage returns, tabs)', () => {
      const urlWithCommonControls = 'https://example.com/image\n\r\t.jpg';
      expect(cssUrl(urlWithCommonControls)).toBe('url("https://example.com/image.jpg")');
    });

    it('should preserve normal characters', () => {
      const urlWithNormalChars = 'https://example.com/café-image_123.jpg';
      expect(cssUrl(urlWithNormalChars)).toBe('url("https://example.com/café-image_123.jpg")');
    });
  });

  describe('Character escaping', () => {
    it('should escape backslashes', () => {
      expect(cssUrl('C:\\images\\photo.jpg')).toBe('url("C:\\\\images\\\\photo.jpg")');
    });

    it('should escape double quotes', () => {
      expect(cssUrl('https://example.com/"quoted".jpg')).toBe(
        'url("https://example.com/\\"quoted\\".jpg")'
      );
    });

    it('should escape both backslashes and quotes', () => {
      expect(cssUrl('C:\\path\\"with quotes".jpg')).toBe(
        'url("C:\\\\path\\\\\\"with quotes\\".jpg")'
      );
    });

    it('should handle multiple escaping scenarios', () => {
      const complexUrl = 'C:\\folder\\"name"\\file with\nnewline.jpg';
      expect(cssUrl(complexUrl)).toBe('url("C:\\\\folder\\\\\\"name\\"\\\\file withnewline.jpg")');
    });
  });

  describe('Edge cases', () => {
    it('should handle Unicode characters', () => {
      expect(cssUrl('https://example.com/🖼️.jpg')).toBe('url("https://example.com/🖼️.jpg")');
    });

    it('should handle URLs with spaces', () => {
      expect(cssUrl('https://example.com/image with spaces.jpg')).toBe(
        'url("https://example.com/image with spaces.jpg")'
      );
    });

    it('should handle data URLs', () => {
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      expect(cssUrl(dataUrl)).toBe(`url("${dataUrl}")`);
    });

    it('should handle mixed control and valid characters', () => {
      const mixedUrl = 'https://\x00example\n.com/image\u2028.jpg\r';
      expect(cssUrl(mixedUrl)).toBe('url("https://example.com/image.jpg")');
    });
  });

  describe('Type handling', () => {
    it('should handle number input by converting to string', () => {
      expect(cssUrl(123 as any)).toBe('url("123")');
    });

    it('should handle boolean input by converting to string', () => {
      expect(cssUrl(true as any)).toBe('url("true")');
    });

    it('should handle null by converting to string', () => {
      expect(cssUrl(null as any)).toBe('url("null")');
    });

    it('should handle undefined by converting to string', () => {
      expect(cssUrl(undefined as any)).toBe('url("undefined")');
    });
  });
});
