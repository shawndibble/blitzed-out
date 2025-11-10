import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup previous request and timeouts
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Check if URL is a Reddit URL
    if (!url || !isRedditUrl(url)) {
      // Clear state for non-Reddit URLs
      setImages([]);
      setErrorCode(null);
      setSource(null);
      setIsLoading(false);
      return;
    }

    // Reset state for new URL
    setImages([]);
    setErrorCode(null);
    setSource(null);

    const subreddit = extractSubredditFromUrl(url);
    if (!subreddit) {
      setErrorCode('invalidRedditUrl');
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
        setErrorCode(null);
        setIsLoading(false);
      } catch {
        if (controller.signal.aborted) return;

        // Retry logic for Reddit CORS/network issues
        const maxRetries = 2;
        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

          retryTimeoutRef.current = setTimeout(() => {
            if (!controller.signal.aborted) {
              loadRedditImages(retryCount + 1);
            }
          }, retryDelay);
          return;
        }

        // Final error after all retries
        setErrorCode('redditBlocked');
        setImages([]);
        setSource(null);
        setIsLoading(false);
      }
    };

    // Small delay to avoid rapid API calls during development
    timeoutRef.current = setTimeout(loadRedditImages, 300);

    return () => {
      controller.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    images,
    isLoading,
    error: errorCode ? t(errorCode) : null,
    source,
  };
}
