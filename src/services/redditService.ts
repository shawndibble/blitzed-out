// Dedicated service for fetching images from Reddit

export interface RedditFeedConfig {
  subreddit: string;
  maxImages?: number;
}

export interface RedditFeedResult {
  images: string[];
  source: string;
}

// Basic HTML entity decoding for Reddit preview URLs
function decodeHtmlEntities(str: string): string {
  return str.replace(/&amp;/g, '&');
}

// Multiple proxy services for CORS issues as fallbacks
// cspell:ignore jina allorigins
const PROXY_SERVICES = ['r.jina.ai', 'api.allorigins.win/get?url=', 'corsproxy.io/?'];

const toProxyUrl = (url: string, serviceIndex: number = 0) => {
  const service = PROXY_SERVICES[serviceIndex];
  if (service === 'api.allorigins.win/get?url=') {
    return `https://${service}${encodeURIComponent(url)}`;
  }
  if (service === 'corsproxy.io/?') {
    return `https://${service}${encodeURIComponent(url)}`;
  }
  const withoutScheme = url.replace(/^https?:\/\//, '');
  const scheme = url.startsWith('https://') ? 'https' : 'http';
  return `https://${service}/${scheme}://${withoutScheme}`;
};

// Reddit-specific fetching logic
export async function fetchRedditImages(
  subreddit: string,
  maxCount: number,
  signal: AbortSignal
): Promise<string[]> {
  const collected = new Set<string>();
  let after: string | null = null;

  const endpoints = [
    // Use Reddit RSS/JSON feeds which are more permissive
    (a: string | null) =>
      `https://www.reddit.com/r/${subreddit}/top.json?limit=100&t=year&raw_json=1${a ? `&after=${a}` : ''}`,
    (a: string | null) =>
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=100&raw_json=1${a ? `&after=${a}` : ''}`,
  ];

  const fetchJson = async (url: string): Promise<any | null> => {
    // Try direct fetch with Reddit-friendly headers
    try {
      const resp = await fetch(url, {
        signal,
        credentials: 'omit',
        mode: 'cors',
        headers: {
          'User-Agent': 'BlitzedOut/1.0',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (resp.ok) {
        const text = await resp.text();
        try {
          return JSON.parse(text);
        } catch {
          // Try to extract JSON from HTML response
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
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }

    // Try multiple CORS proxy services
    for (let i = 0; i < PROXY_SERVICES.length; i++) {
      try {
        const proxyResp = await fetch(toProxyUrl(url, i), {
          signal,
          credentials: 'omit',
          mode: 'cors',
          headers: {
            'User-Agent': 'BlitzedOut/1.0',
            Accept: 'application/json, text/plain, */*',
          },
        });

        if (!proxyResp.ok) continue;

        const text = await proxyResp.text();

        // Handle different proxy response formats
        let jsonData;
        try {
          const parsed = JSON.parse(text);
          // AllOrigins wraps response in contents property
          jsonData = parsed.contents ? JSON.parse(parsed.contents) : parsed;
        } catch {
          // Try to extract JSON from HTML response
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            try {
              jsonData = JSON.parse(text.slice(start, end + 1));
            } catch {
              continue;
            }
          } else {
            continue;
          }
        }

        if (jsonData) {
          return jsonData;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        continue;
      }
    }

    return null;
  };

  let endpointIndex = 0;
  while (collected.size < maxCount && endpointIndex < endpoints.length) {
    after = null;
    for (let page = 0; page < 5 && collected.size < maxCount; page += 1) {
      const url = endpoints[endpointIndex](after);
      const json = await fetchJson(url);
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
    endpointIndex += 1;
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
