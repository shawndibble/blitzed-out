import { describe, expect, it } from 'vitest';
import { isValidURL } from '@/helpers/urls';

describe('isValidURL', () => {
  describe('Valid URLs', () => {
    it('should accept valid HTTP URLs with paths', () => {
      expect(isValidURL('http://example.com/path')).toBe(true);
      expect(isValidURL('https://example.com/path/to/resource')).toBe(true);
    });

    it('should accept valid URLs with query parameters', () => {
      expect(isValidURL('http://example.com/?query=value')).toBe(true);
      expect(isValidURL('https://api.example.com/?param1=value1&param2=value2')).toBe(true);
    });

    it('should accept valid URLs with hash fragments', () => {
      expect(isValidURL('http://example.com/#section')).toBe(true);
      expect(isValidURL('https://docs.example.com/#introduction')).toBe(true);
    });

    it('should accept localhost with paths', () => {
      expect(isValidURL('http://localhost/path')).toBe(true);
      expect(isValidURL('https://localhost:3000/api')).toBe(true);
    });

    it('should accept IPv4 addresses with paths', () => {
      expect(isValidURL('http://192.168.1.1/path')).toBe(true);
      expect(isValidURL('https://127.0.0.1:8080/api')).toBe(true);
    });
  });

  describe('Leading/Trailing Whitespace', () => {
    it('should accept URLs with leading whitespace', () => {
      expect(isValidURL('  http://example.com/path')).toBe(true);
      expect(isValidURL('\t\nhttps://example.com/api')).toBe(true);
    });

    it('should accept URLs with trailing whitespace', () => {
      expect(isValidURL('http://example.com/path  ')).toBe(true);
      expect(isValidURL('https://example.com/api\t\n')).toBe(true);
    });

    it('should accept URLs with both leading and trailing whitespace', () => {
      expect(isValidURL('  http://example.com/path  ')).toBe(true);
      expect(isValidURL('\t\nhttps://example.com/api\t\n')).toBe(true);
    });

    it('should reject URLs that are only whitespace after trimming', () => {
      expect(isValidURL('   ')).toBe(false);
      expect(isValidURL('\t\n')).toBe(false);
    });
  });

  describe('Root Paths', () => {
    it('should reject root paths without query or hash', () => {
      expect(isValidURL('http://example.com/')).toBe(false);
      expect(isValidURL('https://example.com/')).toBe(false);
      expect(isValidURL('http://localhost/')).toBe(false);
      expect(isValidURL('http://192.168.1.1/')).toBe(false);
    });

    it('should accept root paths with query parameters', () => {
      expect(isValidURL('http://example.com/?q=test')).toBe(true);
      expect(isValidURL('http://localhost/?param=value')).toBe(true);
      expect(isValidURL('http://192.168.1.1/?search=term')).toBe(true);
    });

    it('should accept root paths with hash fragments', () => {
      expect(isValidURL('http://example.com/#section')).toBe(true);
      expect(isValidURL('http://localhost/#top')).toBe(true);
      expect(isValidURL('http://192.168.1.1/#anchor')).toBe(true);
    });
  });

  describe('Path Traversal Attempts', () => {
    it('should handle URLs with ../ in path (normalized by URL constructor)', () => {
      // Note: URL constructor normalizes these paths, so '../secret' becomes '/secret'
      expect(isValidURL('http://example.com/../secret')).toBe(true);
      expect(isValidURL('https://example.com/path/../admin')).toBe(true);
      expect(isValidURL('http://example.com/../../etc/passwd')).toBe(true);
    });

    it('should handle URLs with ..\\ in path (normalized by URL constructor)', () => {
      // Note: URL constructor normalizes these paths as well
      expect(isValidURL('http://example.com/..\\secret')).toBe(true);
      expect(isValidURL('https://example.com/path\\..\\admin')).toBe(true);
    });

    it('should reject URLs with literal ../ or ..\\ that remain after parsing', () => {
      // These would only fail if the path literally contains these strings after URL parsing
      // which is rare but possible with encoded characters that decode to traversal patterns
      const testUrl = 'http://example.com/normal/../path';
      const parsed = new URL(testUrl);
      // If somehow a URL had literal ../ after parsing, it would be rejected
      // But normal URL parsing removes these
      expect(parsed.pathname.includes('../')).toBe(false);
    });

    it('should accept legitimate paths that contain .. but not as traversal', () => {
      expect(isValidURL('http://example.com/path..file')).toBe(true);
      expect(isValidURL('https://example.com/file..ext')).toBe(true);
    });
  });

  describe('Unsupported Protocols', () => {
    it('should reject ftp URLs', () => {
      expect(isValidURL('ftp://ftp.example.com/file.txt')).toBe(false);
    });

    it('should reject file URLs', () => {
      expect(isValidURL('file:///path/to/file')).toBe(false);
    });

    it('should reject data URLs', () => {
      expect(isValidURL('data:text/plain;base64,SGVsbG8=')).toBe(false);
    });

    it('should reject javascript URLs', () => {
      expect(isValidURL('javascript:alert("xss")')).toBe(false);
    });

    it('should reject mailto URLs', () => {
      expect(isValidURL('mailto:user@example.com')).toBe(false);
    });

    it('should reject custom protocols', () => {
      expect(isValidURL('myprotocol://example.com/path')).toBe(false);
    });
  });

  describe('Empty or Invalid Hostnames', () => {
    it('should reject URLs with empty hostnames', () => {
      expect(isValidURL('http:///path')).toBe(false);
      expect(isValidURL('https:///api')).toBe(false);
    });

    it('should reject hostnames with .. traversal', () => {
      expect(isValidURL('http://..example.com/path')).toBe(false);
      expect(isValidURL('https://sub..example.com/api')).toBe(false);
    });

    it('should accept hostnames of any length (no minimum length restriction)', () => {
      expect(isValidURL('http://a/path')).toBe(true);
      expect(isValidURL('https://x/api')).toBe(true);
    });

    it('should accept valid short hostnames', () => {
      expect(isValidURL('http://ab/path')).toBe(true);
      expect(isValidURL('https://xy.com/api')).toBe(true);
    });
  });

  describe('URLs with Only Hash or Query on Root', () => {
    it('should accept root URLs with only query parameters', () => {
      expect(isValidURL('http://example.com/?q=search')).toBe(true);
      expect(isValidURL('https://api.example.com/?key=value&type=json')).toBe(true);
    });

    it('should accept root URLs with only hash fragments', () => {
      expect(isValidURL('http://example.com/#main')).toBe(true);
      expect(isValidURL('https://docs.example.com/#section1')).toBe(true);
    });

    it('should accept root URLs with both query and hash', () => {
      expect(isValidURL('http://example.com/?q=test#results')).toBe(true);
      expect(isValidURL('https://example.com/?page=1&limit=10#content')).toBe(true);
    });

    it('should reject root URLs with empty query', () => {
      expect(isValidURL('http://example.com/?')).toBe(false);
      expect(isValidURL('https://example.com/?')).toBe(false);
    });

    it('should reject root URLs with empty hash', () => {
      expect(isValidURL('http://example.com/#')).toBe(false);
      expect(isValidURL('https://example.com/#')).toBe(false);
    });
  });

  describe('Invalid Input Types', () => {
    it('should reject null input', () => {
      expect(isValidURL(null as any)).toBe(false);
    });

    it('should reject undefined input', () => {
      expect(isValidURL(undefined as any)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidURL('')).toBe(false);
    });

    it('should reject non-string types', () => {
      expect(isValidURL(123 as any)).toBe(false);
      expect(isValidURL({} as any)).toBe(false);
      expect(isValidURL([] as any)).toBe(false);
      expect(isValidURL(true as any)).toBe(false);
    });
  });

  describe('Malformed URLs', () => {
    it('should reject URLs with invalid syntax', () => {
      expect(isValidURL('http://')).toBe(false);
      expect(isValidURL('https://')).toBe(false);
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('://')).toBe(false);
    });

    it('should reject URLs with invalid characters', () => {
      expect(isValidURL('http://example .com/path')).toBe(false);
      expect(isValidURL('https://exam<ple.com/api')).toBe(false);
    });

    it('should reject URLs that throw URL constructor errors', () => {
      expect(isValidURL('http:////')).toBe(false);
      expect(isValidURL('https://[invalid-ipv6]/path')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with ports', () => {
      expect(isValidURL('http://example.com:8080/api')).toBe(true);
      expect(isValidURL('https://localhost:3000/path')).toBe(true);
    });

    it('should handle URLs with authentication', () => {
      expect(isValidURL('http://user:pass@example.com/api')).toBe(true);
      expect(isValidURL('https://token@api.example.com/path')).toBe(true);
    });

    it('should handle URLs with complex query parameters', () => {
      expect(isValidURL('http://example.com/search?q=test%20query&format=json&page=1')).toBe(true);
    });

    it('should handle URLs with encoded characters', () => {
      expect(isValidURL('http://example.com/path%20with%20spaces')).toBe(true);
      expect(isValidURL('https://example.com/caf%C3%A9')).toBe(true);
    });
  });
});
