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

interface RedditFeedState {
  images: string[];
  isLoading: boolean;
  errorCode: string | null;
  source: string | null;
}

export function useRedditFeed(url: string | null): UseRedditFeedResult {
  const { t } = useTranslation();
  const [state, setState] = useState<RedditFeedState>({
    images: [],
    isLoading: false,
    errorCode: null,
    source: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive validity without causing effects
  const isValidRedditUrl = url && isRedditUrl(url);
  const subreddit = isValidRedditUrl ? extractSubredditFromUrl(url) : null;

  useEffect(() => {
    // Handle invalid URLs by resetting state
    if (!isValidRedditUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing with external URL changes
      setState({
        images: [],
        errorCode: null,
        source: null,
        isLoading: false,
      });
      return;
    }

    if (!subreddit) {
      setState({
        images: [],
        errorCode: 'invalidRedditUrl',
        source: null,
        isLoading: false,
      });
      return;
    }

    // Reset state for valid URL before loading
    setState({
      images: [],
      errorCode: null,
      source: null,
      isLoading: true,
    });

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

    const config: RedditFeedConfig = {
      subreddit,
      maxImages: 150,
    };

    const controller = new AbortController();
    abortRef.current = controller;

    const loadRedditImages = async (retryCount = 0) => {
      try {
        const result = await getCachedRedditFeed(config, controller.signal);

        if (controller.signal.aborted) return;

        setState({
          images: result.images,
          source: result.source,
          errorCode: null,
          isLoading: false,
        });
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
        setState({
          errorCode: 'redditBlocked',
          images: [],
          source: null,
          isLoading: false,
        });
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
  }, [url, isValidRedditUrl, subreddit]);

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
    images: state.images,
    isLoading: state.isLoading,
    error: state.errorCode ? t(state.errorCode) : null,
    source: state.source,
  };
}
