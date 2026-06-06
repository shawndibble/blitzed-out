import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchRedditPage } from '@/services/redditService';

const okJson = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

describe('fetchRedditPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the first-party Cloud Function proxy first with validated params', async () => {
    fetchMock.mockReturnValueOnce(okJson({ data: { children: [] } }));

    await fetchRedditPage('pics', 'top', null, new AbortController().signal);

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/redditProxy?');
    expect(calledUrl).toContain('subreddit=pics');
    expect(calledUrl).toContain('sort=top');
  });

  it('never routes through third-party CORS proxies', async () => {
    fetchMock.mockReturnValue(okJson({ data: { children: [] } }));

    await fetchRedditPage('pics', 'hot', null, new AbortController().signal);

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    for (const banned of ['jina.ai', 'allorigins', 'corsproxy.io']) {
      expect(urls.some((u) => u.includes(banned))).toBe(false);
    }
  });

  it('falls back to a direct reddit.com fetch when the proxy fails', async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 502 } as Response))
      .mockReturnValueOnce(
        Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(JSON.stringify({ data: { children: [{ data: { id: 'x' } }] } })),
        } as Response)
      );

    const result = await fetchRedditPage('pics', 'top', null, new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('reddit.com/r/pics/top.json');
    expect(result?.data?.children).toHaveLength(1);
  });

  it('propagates AbortError instead of swallowing it', async () => {
    const abortErr = new DOMException('aborted', 'AbortError');
    fetchMock.mockRejectedValueOnce(abortErr);

    await expect(
      fetchRedditPage('pics', 'top', null, new AbortController().signal)
    ).rejects.toThrow('aborted');
  });
});
