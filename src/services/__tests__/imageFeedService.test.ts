import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectFeedType,
  extractSubredditFromUrl,
  isSubredditUrl,
  fetchImageFeed,
  getCachedImageFeed,
} from '../imageFeedService';

// Mock fetch globally
global.fetch = vi.fn();

describe('imageFeedService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock to default behavior
    (global.fetch as any).mockReset();
  });

  describe('isSubredditUrl', () => {
    it('identifies Reddit subreddit URLs correctly', () => {
      const validUrls = [
        'https://www.reddit.com/r/pics',
        'https://reddit.com/r/EarthPorn/',
        'https://old.reddit.com/r/funny',
        'https://www.reddit.com/r/aww/hot',
        'https://reddit.com/r/Art/top',
      ];

      validUrls.forEach((url) => {
        expect(isSubredditUrl(url)).toBe(true);
      });
    });

    it('rejects non-Reddit URLs', () => {
      const invalidUrls = [
        'https://youtube.com/watch?v=abc',
        'https://imgur.com/gallery/abc',
        'https://example.com/r/pics',
        'https://www.reddit.com/user/john',
        'https://www.reddit.com/comments/abc123',
        '',
        'not-a-url',
      ];

      invalidUrls.forEach((url) => {
        expect(isSubredditUrl(url)).toBe(false);
      });
    });
  });

  describe('extractSubredditFromUrl', () => {
    it('extracts subreddit names correctly', () => {
      const testCases = [
        { url: 'https://www.reddit.com/r/pics', expected: 'pics' },
        { url: 'https://reddit.com/r/EarthPorn/', expected: 'EarthPorn' },
        { url: 'https://old.reddit.com/r/funny', expected: 'funny' },
        { url: 'https://www.reddit.com/r/aww/hot', expected: 'aww' },
        { url: 'https://reddit.com/r/Art/top', expected: 'Art' },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractSubredditFromUrl(url)).toBe(expected);
      });
    });

    it('returns null for invalid URLs', () => {
      const invalidUrls = [
        'https://youtube.com/watch?v=abc',
        'https://www.reddit.com/user/john',
        '',
        'not-a-url',
      ];

      invalidUrls.forEach((url) => {
        expect(extractSubredditFromUrl(url)).toBeNull();
      });
    });
  });

  describe('detectFeedType', () => {
    it('detects Reddit URLs as reddit feed type', () => {
      const redditUrls = [
        'https://www.reddit.com/r/pics',
        'https://reddit.com/r/EarthPorn/',
        'https://old.reddit.com/r/funny',
      ];

      redditUrls.forEach((url) => {
        expect(detectFeedType(url)).toBe('reddit');
      });
    });

    it('returns null for non-supported URLs', () => {
      const nonSupportedUrls = [
        'https://youtube.com/watch?v=abc',
        'https://imgur.com/gallery/abc',
        'https://example.com/image.jpg',
        '',
        'not-a-url',
      ];

      nonSupportedUrls.forEach((url) => {
        expect(detectFeedType(url)).toBeNull();
      });
    });
  });

  describe('fetchImageFeed', () => {
    it('fetches Reddit images successfully', async () => {
      const mockResponse = {
        data: {
          children: [
            {
              data: {
                url_overridden_by_dest: 'https://i.redd.it/image1.jpg',
                post_hint: 'image',
                preview: {
                  images: [
                    {
                      source: { url: 'https://preview.redd.it/preview1.jpg' },
                    },
                  ],
                },
              },
            },
            {
              data: {
                url_overridden_by_dest: 'https://i.redd.it/image2.png',
                post_hint: 'image',
              },
            },
          ],
        },
      };

      (global.fetch as any).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: async () => JSON.stringify(mockResponse),
        })
      );

      const config = {
        type: 'reddit' as const,
        url: 'https://www.reddit.com/r/pics',
        maxImages: 10,
      };

      const signal = new AbortController().signal;
      const result = await fetchImageFeed(config, signal);

      expect(result.images).toHaveLength(2);
      expect(result.source).toBe('r/pics');
      expect(result.images).toContain('https://i.redd.it/image1.jpg');
      expect(result.images).toContain('https://i.redd.it/image2.png');
    });

    it('handles fetch errors gracefully', async () => {
      // Reset the mock to reject for this test
      (global.fetch as any).mockReset();
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const config = {
        type: 'reddit' as const,
        url: 'https://www.reddit.com/r/pics',
        maxImages: 10,
      };

      const signal = new AbortController().signal;

      // The Reddit service is resilient and returns empty results when all fetches fail
      const result = await fetchImageFeed(config, signal);
      expect(result.images).toEqual([]);
      expect(result.source).toBe('r/pics');
    });

    it('handles custom feed type', async () => {
      const config = {
        type: 'custom' as const,
        url: 'https://example.com/image.jpg',
        maxImages: 1,
      };

      const signal = new AbortController().signal;
      const result = await fetchImageFeed(config, signal);

      expect(result.images).toEqual(['https://example.com/image.jpg']);
      expect(result.source).toBe('Custom');
    });

    it('throws error for invalid Reddit URL', async () => {
      const config = {
        type: 'reddit' as const,
        url: 'https://youtube.com/watch?v=abc',
        maxImages: 10,
      };

      const signal = new AbortController().signal;

      await expect(fetchImageFeed(config, signal)).rejects.toThrow('Invalid Reddit URL');
    });
  });

  describe('getCachedImageFeed', () => {
    it('caches results between calls', async () => {
      const mockResponse = {
        data: {
          children: [
            {
              data: {
                url_overridden_by_dest: 'https://i.redd.it/image1.jpg',
                post_hint: 'image',
              },
            },
          ],
        },
      };

      // Mock fetch to always succeed on first call to avoid proxy fallback
      (global.fetch as any).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: async () => JSON.stringify(mockResponse),
        })
      );

      const config = {
        type: 'reddit' as const,
        url: 'https://www.reddit.com/r/pics',
        maxImages: 10,
      };

      const signal1 = new AbortController().signal;
      const signal2 = new AbortController().signal;

      // Clear any previous calls
      (global.fetch as any).mockClear();

      // First call - should fetch
      const result1 = await getCachedImageFeed(config, signal1);
      expect(result1.images).toHaveLength(1);
      const firstCallCount = (global.fetch as any).mock.calls.length;
      expect(firstCallCount).toBeGreaterThan(0);

      // Second call - should use cache
      const result2 = await getCachedImageFeed(config, signal2);
      expect(result2.images).toEqual(result1.images);
      expect((global.fetch as any).mock.calls.length).toBe(firstCallCount); // Should not fetch again
    });
  });
});
