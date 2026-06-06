import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRedditToken, getRedditAccessToken } from '@/services/redditAuth';
import { fetchRedditPage } from '@/services/redditService';

vi.mock('@/services/redditAuth', () => ({
  getRedditAccessToken: vi.fn(),
  clearRedditToken: vi.fn(),
}));

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

describe('fetchRedditPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(getRedditAccessToken).mockResolvedValue('tok123');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetches the OAuth API directly with a Bearer token', async () => {
    fetchMock.mockReturnValueOnce(okJson({ data: { children: [] } }));

    await fetchRedditPage('pics', 'top', null, new AbortController().signal);

    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('oauth.reddit.com/r/pics/top');
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer tok123');
  });

  it('never uses third-party proxies, the plain .json endpoint, or a Cloud Function', async () => {
    fetchMock.mockReturnValue(okJson({ data: { children: [] } }));

    await fetchRedditPage('pics', 'hot', null, new AbortController().signal);

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    for (const banned of ['jina.ai', 'allorigins', 'corsproxy.io', '.json', 'cloudfunctions']) {
      expect(urls.some((u) => u.includes(banned))).toBe(false);
    }
  });

  it('returns null without fetching when no token is available (unconfigured)', async () => {
    vi.mocked(getRedditAccessToken).mockResolvedValue(null);

    const result = await fetchRedditPage('pics', 'top', null, new AbortController().signal);

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the token and retries once on a 401', async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 401 } as Response))
      .mockReturnValueOnce(okJson({ data: { children: [{ data: { id: 'x' } }] } }));

    const result = await fetchRedditPage('pics', 'top', null, new AbortController().signal);

    expect(clearRedditToken).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result?.data?.children).toHaveLength(1);
  });

  it('propagates AbortError instead of swallowing it', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));

    await expect(
      fetchRedditPage('pics', 'top', null, new AbortController().signal)
    ).rejects.toThrow('aborted');
  });
});
