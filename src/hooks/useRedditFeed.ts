import { useEffect, useRef, useState } from 'react';

import {
  type RedditFeedConfig,
  getCachedRedditFeed,
  extractSubredditFromUrl,
  isRedditUrl,
} from '@/services/redditService';

interface UseRedditFeedResult {
  images: string[];
  isLoading: boolean;
  error: string | null;
  source: string | null;
}

export function useRedditFeed(url: string | null): UseRedditFeedResult {
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

    // Check if URL is a Reddit URL
    if (!url || !isRedditUrl(url)) {
      setIsLoading(false);
      return;
    }

    const subreddit = extractSubredditFromUrl(url);
    if (!subreddit) {
      setError('Invalid Reddit URL format');
      setIsLoading(false);
      return;
    }

    const config: RedditFeedConfig = {
      subreddit,
      maxImages: 150,
    };

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const loadRedditImages = async (retryCount = 0) => {
      try {
        const result = await getCachedRedditFeed(config, controller.signal);

        if (controller.signal.aborted) return;

        setImages(result.images);
        setSource(result.source);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;

        // Retry logic for Reddit CORS/network issues
        const maxRetries = 2;
        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.warn(
            `Reddit fetch attempt ${retryCount + 1} failed, retrying in ${retryDelay}ms:`,
            err
          );

          setTimeout(() => {
            if (!controller.signal.aborted) {
              loadRedditImages(retryCount + 1);
            }
          }, retryDelay);
          return;
        }

        // Final error after all retries
        setError('Reddit blocked by browser security. Try disabling Enhanced Tracking Protection.');
        setImages([]);
        setSource(null);
      } finally {
        if (!controller.signal.aborted && retryCount === 0) {
          setIsLoading(false);
        }
      }
    };

    // Small delay to avoid rapid API calls during development
    const timeoutId = window.setTimeout(loadRedditImages, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [url]);

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
