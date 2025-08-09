import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@/test-utils';
import { useImageFeed } from '../useImageFeed';

// Mock the imageFeedService
vi.mock('@/services/imageFeedService', () => ({
  getCachedImageFeed: vi.fn(),
}));

import { getCachedImageFeed } from '@/services/imageFeedService';

describe('useImageFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state when config is null', () => {
    const { result } = renderHook(() => useImageFeed(null));

    expect(result.current.images).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBeNull();
  });

  it('fetches images successfully', async () => {
    const mockImages = ['https://i.redd.it/image1.jpg', 'https://i.redd.it/image2.jpg'];

    (getCachedImageFeed as any).mockResolvedValueOnce({
      images: mockImages,
      source: 'r/pics',
    });

    const config = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 10,
    };

    const { result } = renderHook(() => useImageFeed(config));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.images).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBeNull();

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual(mockImages);
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBe('r/pics');
    expect(getCachedImageFeed).toHaveBeenCalledWith(config, expect.any(AbortSignal));
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Failed to fetch images';
    (getCachedImageFeed as any).mockRejectedValueOnce(new Error(errorMessage));

    const config = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 10,
    };

    const { result } = renderHook(() => useImageFeed(config));

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual([]);
    expect(result.current.error).toBe(`Failed to fetch images: ${errorMessage}`);
    expect(result.current.source).toBeNull();
  });

  it('refetches when config changes', async () => {
    const mockImages1 = ['https://i.redd.it/image1.jpg'];
    const mockImages2 = ['https://i.redd.it/image2.jpg'];

    (getCachedImageFeed as any)
      .mockResolvedValueOnce({
        images: mockImages1,
        source: 'r/pics',
      })
      .mockResolvedValueOnce({
        images: mockImages2,
        source: 'r/earthporn',
      });

    const config1 = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 10,
    };

    const config2 = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/earthporn',
      maxImages: 10,
    };

    const { result, rerender } = renderHook(({ config }: { config: any }) => useImageFeed(config), {
      initialProps: { config: config1 },
    });

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual(mockImages1);
    expect(result.current.source).toBe('r/pics');

    // Change config
    rerender({ config: config2 });

    // Should start loading again
    expect(result.current.isLoading).toBe(true);

    // Wait for second fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual(mockImages2);
    expect(result.current.source).toBe('r/earthporn');
    expect(getCachedImageFeed).toHaveBeenCalledTimes(2);
  });

  it('does not fetch when config changes to null', async () => {
    const mockImages = ['https://i.redd.it/image1.jpg'];

    (getCachedImageFeed as any).mockResolvedValueOnce({
      images: mockImages,
      source: 'r/pics',
    });

    const config = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 10,
    };

    const { result, rerender } = renderHook(({ config }: { config: any }) => useImageFeed(config), {
      initialProps: { config },
    });

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual(mockImages);

    // Change config to null
    rerender({ config: null as any });

    // Should reset state immediately
    expect(result.current.isLoading).toBe(false);
    expect(result.current.images).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBeNull();

    // Should not make additional fetch calls
    expect(getCachedImageFeed).toHaveBeenCalledTimes(1);
  });

  it('cleans up properly on unmount', async () => {
    (getCachedImageFeed as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                images: [],
                source: 'r/pics',
              }),
            100
          );
        })
    );

    const config = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 10,
    };

    const { result, unmount } = renderHook(() => useImageFeed(config));

    expect(result.current.isLoading).toBe(true);

    // Unmount before fetch completes
    unmount();

    // Wait a bit to ensure no state updates occur after unmount
    await new Promise((resolve) => setTimeout(resolve, 150));

    // No errors should occur from attempting to set state on unmounted component
    // This is validated by React's development mode warnings
  });

  it('handles config with different maxImages values', async () => {
    const allImages = Array.from({ length: 5 }, (_, i) => `https://i.redd.it/image${i + 1}.jpg`);

    (getCachedImageFeed as any).mockResolvedValueOnce({
      images: allImages, // Service respects maxImages
      source: 'r/pics',
    });

    const config = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 5,
    };

    const { result } = renderHook(() => useImageFeed(config));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toHaveLength(5);
    expect(getCachedImageFeed).toHaveBeenCalledWith(config, expect.any(AbortSignal));
  });

  it('handles empty results gracefully', async () => {
    (getCachedImageFeed as any).mockResolvedValueOnce({
      images: [],
      source: 'r/pics',
    });

    const config = {
      type: 'reddit' as const,
      url: 'https://www.reddit.com/r/pics',
      maxImages: 10,
    };

    const { result } = renderHook(() => useImageFeed(config));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBe('r/pics');
  });
});
