// Service for fetching images from various sources

export interface ImageFeedConfig {
  type: 'reddit' | 'custom';
  url: string;
  maxImages?: number;
}

export interface ImageFeedResult {
  images: string[];
  source: string;
}

// Basic HTML entity decoding for Reddit preview URLs
function decodeHtmlEntities(str: string): string {
  return str.replace(/&amp;/g, '&');
}

// Reddit-specific fetching logic (moved from RoomBackground)
async function fetchRedditImages(
  subreddit: string,
  maxCount: number,
  signal: AbortSignal
): Promise<string[]> {
  const collected = new Set<string>();
  let after: string | null = null;

  const endpoints = [
    (a: string | null) =>
      `https://api.reddit.com/r/${subreddit}/top.json?limit=100&t=year&raw_json=1${a ? `&after=${a}` : ''}`,
    (a: string | null) =>
      `https://api.reddit.com/r/${subreddit}/hot.json?limit=100&raw_json=1${a ? `&after=${a}` : ''}`,
  ];

  const toProxyUrl = (url: string) => `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;

  const fetchJson = async (url: string): Promise<any | null> => {
    try {
      const resp = await fetch(url, { signal, credentials: 'omit', mode: 'cors' });
      if (resp.ok) {
        const text = await resp.text();
        try {
          return JSON.parse(text);
        } catch {
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
    } catch {
      // fallthrough to proxy
    }

    try {
      const proxyResp = await fetch(toProxyUrl(url), { signal, credentials: 'omit', mode: 'cors' });
      if (!proxyResp.ok) return null;
      const text = await proxyResp.text();
      try {
        return JSON.parse(text);
      } catch {
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
    } catch {
      return null;
    }
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

// Main service function
export async function fetchImageFeed(
  config: ImageFeedConfig,
  signal: AbortSignal
): Promise<ImageFeedResult> {
  const maxImages = config.maxImages || 150;

  switch (config.type) {
    case 'reddit': {
      const subreddit = extractSubredditFromUrl(config.url);
      if (!subreddit) {
        throw new Error('Invalid Reddit URL');
      }
      const images = await fetchRedditImages(subreddit, maxImages, signal);
      return {
        images,
        source: `r/${subreddit}`,
      };
    }

    case 'custom': {
      // For custom image arrays or other sources
      return {
        images: [config.url], // Single image for now
        source: 'Custom',
      };
    }

    default:
      throw new Error(`Unsupported feed type: ${config.type}`);
  }
}

// Helper functions
export function detectFeedType(url: string): ImageFeedConfig['type'] | null {
  if (isSubredditUrl(url)) return 'reddit';
  return null;
}

export function isSubredditUrl(url: string): boolean {
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

// Cache management
const CACHE_TTL_MS = 400_000; // 400 seconds
const cache = new Map<string, { fetchedAt: number; result: ImageFeedResult }>();
const inFlight = new Map<string, Promise<ImageFeedResult>>();

export async function getCachedImageFeed(
  config: ImageFeedConfig,
  signal: AbortSignal
): Promise<ImageFeedResult> {
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

  const promise = fetchImageFeed(config, signal)
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
