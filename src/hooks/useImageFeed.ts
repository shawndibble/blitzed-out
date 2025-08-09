import { useEffect, useRef, useState } from 'react';

import { type ImageFeedConfig, getCachedImageFeed } from '@/services/imageFeedService';

interface UseImageFeedResult {
  images: string[];
  isLoading: boolean;
  error: string | null;
  source: string | null;
}

export function useImageFeed(config: ImageFeedConfig | null): UseImageFeedResult {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    // Reset state
    setImages([]);
    setError(null);
    setSource(null);

    if (!config) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const loadImages = async () => {
      try {
        const result = await getCachedImageFeed(config, controller.signal);

        if (controller.signal.aborted) return;

        setImages(result.images);
        setSource(result.source);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(err instanceof Error ? err.message : 'Failed to load images');
        setImages([]);
        setSource(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // Small delay to avoid rapid API calls during development
    const timeoutId = window.setTimeout(loadImages, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [config]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    images,
    isLoading,
    error,
    source,
  };
}
