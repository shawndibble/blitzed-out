// Dedicated service for fetching images from Reddit

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

// First-party Cloud Function proxy. Replaces the old third-party CORS proxies
// (r.jina.ai / allorigins / corsproxy.io) which were availability and privacy risks.
const REDDIT_PROXY_URL = `${
  import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
  `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`
}/redditProxy`;

function directRedditUrl(subreddit: string, sort: RedditSort, after: string | null): string {
  const params = new URLSearchParams({ limit: '100', raw_json: '1' });
  if (sort === 'top') params.set('t', 'year');
  if (after) params.set('after', after);
  return `https://www.reddit.com/r/${subreddit}/${sort}.json?${params.toString()}`;
}

function parseJsonLoose(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // Some responses wrap JSON in HTML; extract the outermost object.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

/**
 * Fetches one page of a subreddit's JSON listing. Primary path is the first-party
 * Cloud Function proxy; falls back to a direct reddit.com fetch (e.g. if the function
 * is not yet deployed or is temporarily unavailable). Returns the parsed listing or null.
 */
export async function fetchRedditPage(
  subreddit: string,
  sort: RedditSort,
  after: string | null,
  signal: AbortSignal
): Promise<any | null> {
  const proxyParams = new URLSearchParams({ subreddit, sort });
  if (after) proxyParams.set('after', after);

  try {
    const resp = await fetch(`${REDDIT_PROXY_URL}?${proxyParams.toString()}`, {
      signal,
      credentials: 'omit',
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (error) {
    if (isAbort(error)) throw error;
  }

  // Fallback: direct fetch. User-Agent is a forbidden header in browsers (silently dropped),
  // so we rely on Reddit's CORS-enabled JSON endpoints here.
  try {
    const resp = await fetch(directRedditUrl(subreddit, sort, after), {
      signal,
      credentials: 'omit',
      mode: 'cors',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (resp.ok) {
      return parseJsonLoose(await resp.text());
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
