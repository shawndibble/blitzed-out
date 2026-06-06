import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRedditToken, getRedditAccessToken } from '@/services/redditAuth';

describe('getRedditAccessToken', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearRedditToken();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_REDDIT_CLIENT_ID', 'client_abc');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns null without fetching when no client id is configured', async () => {
    vi.stubEnv('VITE_REDDIT_CLIENT_ID', '');

    const token = await getRedditAccessToken(new AbortController().signal);

    expect(token).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requests an app-only token with Basic auth and caches it', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'T1', expires_in: 3600 }),
    } as Response);

    const token = await getRedditAccessToken(new AbortController().signal);
    expect(token).toBe('T1');

    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://www.reddit.com/api/v1/access_token');
    expect(opts.method).toBe('POST');
    expect((opts.headers as Record<string, string>).Authorization).toMatch(/^Basic /);

    // Cached: a second call within the TTL does not refetch.
    const again = await getRedditAccessToken(new AbortController().signal);
    expect(again).toBe('T1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null on a non-ok token response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 } as Response);

    expect(await getRedditAccessToken(new AbortController().signal)).toBeNull();
  });

  it('propagates AbortError from the token request', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    await expect(getRedditAccessToken(new AbortController().signal)).rejects.toThrow('aborted');
  });
});
