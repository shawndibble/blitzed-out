import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        loadingRedditImages: 'Loading Reddit images...',
        redditBlocked: 'Reddit blocked by browser security',
        invalidRedditUrl: 'Invalid Reddit URL format',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Reddit service functions
vi.mock('@/services/redditService', () => ({
  getCachedRedditFeed: vi.fn(),
  extractSubredditFromUrl: vi.fn(),
  isRedditUrl: vi.fn(),
}));

import { useRedditFeed } from '../useRedditFeed';
import {
  getCachedRedditFeed,
  extractSubredditFromUrl,
  isRedditUrl,
} from '@/services/redditService';

const mockGetCachedRedditFeed = vi.mocked(getCachedRedditFeed);
const mockExtractSubredditFromUrl = vi.mocked(extractSubredditFromUrl);
const mockIsRedditUrl = vi.mocked(isRedditUrl);

describe('useRedditFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial loading state', () => {
    it('should have initial loading state', () => {
      const { result } = renderHook(() => useRedditFeed(null));

      expect(result.current.images).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.source).toBe(null);
    });

    it('should not load anything when URL is null', () => {
      renderHook(() => useRedditFeed(null));

      expect(mockIsRedditUrl).not.toHaveBeenCalled();
      expect(mockGetCachedRedditFeed).not.toHaveBeenCalled();
    });

    it('should not load anything when URL is not a Reddit URL', () => {
      mockIsRedditUrl.mockReturnValue(false);

      renderHook(() => useRedditFeed('https://example.com'));

      expect(mockIsRedditUrl).toHaveBeenCalledWith('https://example.com');
      expect(mockGetCachedRedditFeed).not.toHaveBeenCalled();
    });
  });

  describe('successful fetch and state updates', () => {
    it('should successfully fetch Reddit images', async () => {
      const mockImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const mockResult = {
        images: mockImages,
        source: 'r/testsubreddit',
      };

      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');
      mockGetCachedRedditFeed.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useRedditFeed('https://reddit.com/r/testsubreddit'));

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.images).toEqual([]);
      expect(result.current.error).toBe(null);

      // Advance timers to trigger the delayed fetch
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Wait for the promise to resolve
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.images).toEqual(mockImages);
      expect(result.current.error).toBe(null);
      expect(result.current.source).toBe('r/testsubreddit');

      expect(mockGetCachedRedditFeed).toHaveBeenCalledWith(
        {
          subreddit: 'testsubreddit',
          maxImages: 150,
        },
        expect.any(AbortSignal)
      );
    });

    it('should handle invalid Reddit URL format', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue(null);

      const { result } = renderHook(() => useRedditFeed('https://reddit.com/invalid'));

      // Advance past initial delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid Reddit URL format');
      expect(result.current.images).toEqual([]);
    });
  });

  describe('retry logic with exponential backoff', () => {
    it('should retry on fetch failure with exponential backoff', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');

      // Mock first two calls to fail, third to succeed
      const mockResult = {
        images: ['image1.jpg'],
        source: 'r/testsubreddit',
      };

      mockGetCachedRedditFeed
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useRedditFeed('https://reddit.com/r/testsubreddit'));

      // Initial fetch
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // First retry (1000ms delay)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Second retry (2000ms delay)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.images).toEqual(['image1.jpg']);
      expect(result.current.error).toBe(null);

      // Verify exponential backoff pattern
      expect(mockGetCachedRedditFeed).toHaveBeenCalledTimes(3);
    });

    it('should set error after maximum retries exceeded', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');
      mockGetCachedRedditFeed.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRedditFeed('https://reddit.com/r/testsubreddit'));

      // Initial fetch
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // First retry
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Second retry
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Reddit blocked by browser security');
      expect(result.current.images).toEqual([]);
      expect(result.current.source).toBe(null);

      // Should have tried 3 times total (initial + 2 retries)
      expect(mockGetCachedRedditFeed).toHaveBeenCalledTimes(3);
    });
  });

  describe('abort behavior', () => {
    it('should abort request on unmount', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');

      const mockAbortError = new Error('Aborted');
      mockAbortError.name = 'AbortError';
      mockGetCachedRedditFeed.mockRejectedValue(mockAbortError);

      const { result, unmount } = renderHook(() =>
        useRedditFeed('https://reddit.com/r/testsubreddit')
      );

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Unmount before request completes
      unmount();

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Should not update state after unmount
      expect(result.current.isLoading).toBe(true); // State should remain as it was before unmount
      expect(mockGetCachedRedditFeed).toHaveBeenCalledWith(
        {
          subreddit: 'testsubreddit',
          maxImages: 150,
        },
        expect.any(AbortSignal)
      );
    });

    it('should abort and restart when URL changes', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl
        .mockReturnValueOnce('testsubreddit1')
        .mockReturnValueOnce('testsubreddit2');

      const mockResult1 = {
        images: ['image1.jpg'],
        source: 'r/testsubreddit1',
      };

      const mockResult2 = {
        images: ['image2.jpg'],
        source: 'r/testsubreddit2',
      };

      mockGetCachedRedditFeed.mockResolvedValueOnce(mockResult1).mockResolvedValueOnce(mockResult2);

      const { result, rerender } = renderHook(({ url }) => useRedditFeed(url), {
        initialProps: { url: 'https://reddit.com/r/testsubreddit1' },
      });

      // Let first request complete
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.images).toEqual(['image1.jpg']);

      // Change URL - should abort previous and start new
      rerender({ url: 'https://reddit.com/r/testsubreddit2' });

      // State should be reset
      expect(result.current.images).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.source).toBe(null);

      // Let second request complete
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.images).toEqual(['image2.jpg']);
      expect(result.current.source).toBe('r/testsubreddit2');
    });
  });

  describe('edge cases', () => {
    it('should handle aborted requests gracefully during retries', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');

      const mockAbortError = new Error('Aborted');
      mockAbortError.name = 'AbortError';
      mockGetCachedRedditFeed.mockRejectedValue(mockAbortError);

      const { unmount } = renderHook(() => useRedditFeed('https://reddit.com/r/testsubreddit'));

      // Start initial request
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Let first request fail
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Start first retry, then unmount during retry delay
      act(() => {
        vi.advanceTimersByTime(500); // Partial retry delay
      });

      unmount();

      // Complete the retry timing
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Should not have caused any errors or state updates after unmount
      expect(mockGetCachedRedditFeed).toHaveBeenCalled();
    });

    it('should reset state correctly when switching from valid to invalid URL', async () => {
      const { result, rerender } = renderHook(({ url }) => useRedditFeed(url), {
        initialProps: { url: 'https://reddit.com/r/testsubreddit' },
      });

      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');

      // Let initial request start
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now make isRedditUrl return false for the new URL
      mockIsRedditUrl.mockReturnValueOnce(false);

      // Switch to invalid URL
      rerender({ url: 'https://example.com' });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.images).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.source).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle empty images array response', async () => {
      mockIsRedditUrl.mockReturnValue(true);
      mockExtractSubredditFromUrl.mockReturnValue('testsubreddit');
      mockGetCachedRedditFeed.mockResolvedValue({
        images: [],
        source: 'r/testsubreddit',
      });

      const { result } = renderHook(() => useRedditFeed('https://reddit.com/r/testsubreddit'));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.images).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.source).toBe('r/testsubreddit');
    });
  });
});
