// Dedicated service for fetching images from Reddit

import { clearRedditToken, getRedditAccessToken } from '@/services/redditAuth';

export interface RedditFeedConfig {
  subreddit: string;
  maxImages?: number;
}

export interface RedditFeedResult {
  images: string[];
  source: string;
}

type RedditSort = 'top' | 'hot';

// Basic HTML entity decoding for Reddit preview URLs
function decodeHtmlEntities(str: string): string {
  return str.replace(/&amp;/g, '&');
}

// Calls go directly from the user's browser to Reddit's CORS-enabled OAuth API
// (oauth.reddit.com), authenticated with an app-only token (see redditAuth.ts). This
// replaced both the old third-party CORS proxies and an interim Cloud Function relay:
// fetching from the user's own IP avoids the datacenter-IP 403/429s a relay would hit.
const OAUTH_BASE = 'https://oauth.reddit.com';

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

function listingUrl(subreddit: string, sort: RedditSort, after: string | null): string {
  const params = new URLSearchParams({ limit: '100', raw_json: '1' });
  if (sort === 'top') params.set('t', 'year');
  if (after) params.set('after', after);
  return `${OAUTH_BASE}/r/${subreddit}/${sort}?${params.toString()}`;
}

async function fetchListing(url: string, token: string, signal: AbortSignal): Promise<Response> {
  return fetch(url, {
    signal,
    credentials: 'omit',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Fetches one page of a subreddit's listing from Reddit's OAuth API, directly from the
 * browser. Returns the parsed listing, or null when unauthenticated/unavailable. On a 401
 * the token is dropped and the request retried once with a fresh token.
 */
export async function fetchRedditPage(
  subreddit: string,
  sort: RedditSort,
  after: string | null,
  signal: AbortSignal
): Promise<any | null> {
  const url = listingUrl(subreddit, sort, after);

  try {
    let token = await getRedditAccessToken(signal);
    if (!token) return null;

    let resp = await fetchListing(url, token, signal);
    if (resp.status === 401) {
      clearRedditToken();
      token = await getRedditAccessToken(signal);
      if (!token) return null;
      resp = await fetchListing(url, token, signal);
    }

    if (resp.ok) {
      return await resp.json();
    }
  } catch (error) {
    if (isAbort(error)) throw error;
  }

  return null;
}

// Reddit-specific fetching logic
export async function fetchRedditImages(
  subreddit: string,
  maxCount: number,
  signal: AbortSignal
): Promise<string[]> {
  const collected = new Set<string>();
  const sorts: RedditSort[] = ['top', 'hot'];

  let sortIndex = 0;
  while (collected.size < maxCount && sortIndex < sorts.length) {
    let after: string | null = null;
    for (let page = 0; page < 5 && collected.size < maxCount; page += 1) {
      const json = await fetchRedditPage(subreddit, sorts[sortIndex], after, signal);
      if (!json) break;

      const children = json?.data?.children ?? [];
      after = json?.data?.after ?? null;

      for (const child of children) {
        const data = child?.data;
        if (!data) continue;

        const direct = data.url_overridden_by_dest as string | undefined;
        const postHint = data.post_hint as string | undefined;

        // Gallery support
        if (data.is_gallery && data.media_metadata && data.gallery_data) {
          const items = (data.gallery_data.items || []) as Array<{ media_id: string }>;
          for (const it of items) {
            const meta = data.media_metadata[it.media_id];
            const source = meta?.s?.u || meta?.s?.gif || meta?.s?.mp4;
            if (typeof source === 'string') {
              const normalized = source.startsWith('http') ? source : `https:${source}`;
              if (/\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(normalized)) {
                collected.add(decodeHtmlEntities(normalized));
              }
            }
          }
          continue;
        }

        if (postHint === 'image' && typeof direct === 'string') {
          if (/\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(direct)) {
            collected.add(decodeHtmlEntities(direct));
            continue;
          }
        }

        const preview = data.preview?.images?.[0]?.source?.url as string | undefined;
        if (preview) {
          const normalized = preview.startsWith('http') ? preview : `https:${preview}`;
          collected.add(decodeHtmlEntities(normalized));
        }
      }

      if (!after) break;
    }
    sortIndex += 1;
  }

  return Array.from(collected).slice(0, maxCount);
}

// Main Reddit service function
export async function fetchRedditFeed(
  config: RedditFeedConfig,
  signal: AbortSignal
): Promise<RedditFeedResult> {
  const maxImages = config.maxImages || 150;
  const images = await fetchRedditImages(config.subreddit, maxImages, signal);

  return {
    images,
    source: `r/${config.subreddit}`,
  };
}

// Helper functions
export function isRedditUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)reddit\.com$/i.test(parsed.hostname) && /\/r\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function extractSubredditFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/r\/([^/]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// Cache management for Reddit feeds
const CACHE_TTL_MS = 300_000; // 300 seconds (5 minutes)
const cache = new Map<string, { fetchedAt: number; result: RedditFeedResult }>();
const inFlight = new Map<string, Promise<RedditFeedResult>>();

export async function getCachedRedditFeed(
  config: RedditFeedConfig,
  signal: AbortSignal
): Promise<RedditFeedResult> {
  const cacheKey = JSON.stringify(config);
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.result;
  }

  const existing = inFlight.get(cacheKey);
  if (existing) {
    try {
      return await existing;
    } catch {
      // fall through to fresh fetch
    }
  }

  const promise = fetchRedditFeed(config, signal)
    .then((result) => {
      cache.set(cacheKey, { fetchedAt: Date.now(), result });
      return result;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, promise);
  return promise;
}
