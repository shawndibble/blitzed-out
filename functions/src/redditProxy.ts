import * as functions from 'firebase-functions/v1';

/**
 * First-party CORS proxy for Reddit's public JSON feeds, replacing third-party proxies
 * (r.jina.ai / allorigins / corsproxy.io) which were availability and privacy risks.
 *
 * SSRF-safe by construction: the caller supplies only a subreddit name, a sort, and an
 * opaque pagination cursor — never a URL. The reddit.com host and path are built here,
 * so the function can never be pointed at an arbitrary or internal host. Because the input
 * is structurally constrained (not a URL), CORS is open (`*`) — there's nothing an arbitrary
 * origin can reach beyond public Reddit listings, and an allowlist would break PWA/mobile
 * webview origins (`capacitor://localhost`, etc.) for no real gain.
 */
const SUBREDDIT_RE = /^[A-Za-z0-9_]{1,50}$/;
const REDDIT_AFTER_RE = /^t[1-6]_[A-Za-z0-9]{1,20}$/;
const UPSTREAM_TIMEOUT_MS = 10_000;

export const redditProxy = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const subreddit = String(req.query.subreddit || '');
  const sort = String(req.query.sort || 'top');
  const after = req.query.after ? String(req.query.after) : '';

  if (!SUBREDDIT_RE.test(subreddit)) {
    res.status(400).json({ error: 'Invalid subreddit' });
    return;
  }
  if (sort !== 'top' && sort !== 'hot') {
    res.status(400).json({ error: 'Invalid sort' });
    return;
  }
  if (after && !REDDIT_AFTER_RE.test(after)) {
    res.status(400).json({ error: 'Invalid cursor' });
    return;
  }

  // Host + path constructed here — caller-supplied values are validated, not trusted as a URL.
  const params = new URLSearchParams({ limit: '100', raw_json: '1' });
  if (sort === 'top') params.set('t', 'year');
  if (after) params.set('after', after);
  const redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const upstream = await fetch(redditUrl, {
      signal: controller.signal,
      headers: {
        // Reddit blocks generic/datacenter user-agents; identify the app per their API rules.
        'User-Agent': 'web:blitzedout:1.0 (by /u/blitzedout)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      functions.logger.warn(`Reddit upstream ${upstream.status} for r/${subreddit}/${sort}`);
      res.status(502).json({ error: 'Upstream error', status: upstream.status });
      return;
    }

    const json = await upstream.json();
    res.set('Cache-Control', 'public, max-age=300');
    res.status(200).json(json);
  } catch (error) {
    functions.logger.error('redditProxy fetch failed:', error);
    res.status(504).json({ error: 'Fetch failed' });
  }
});
