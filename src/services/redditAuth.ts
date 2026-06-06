// Userless ("installed app") OAuth for Reddit's public API, run entirely in the browser.
//
// Reddit's token endpoint (www.reddit.com/api/v1/access_token) and data endpoint
// (oauth.reddit.com) both send `Access-Control-Allow-Origin: *`, so every call is made
// directly from the user's own browser/IP. That dodges both the CORS wall (which blocks
// the plain .json endpoints) and the datacenter-IP 403/429s a server-side relay would hit.
//
// Requires a registered "installed app" client id in VITE_REDDIT_CLIENT_ID (no secret).
// If unset, token requests return null and the slideshow degrades gracefully.

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const INSTALLED_CLIENT_GRANT = 'https://oauth.reddit.com/grants/installed_client';
const DEVICE_ID_KEY = 'reddit_device_id';
const TOKEN_SKEW_MS = 60_000; // refresh a minute before expiry

let cachedToken: { value: string; expiresAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

// Reddit's installed_client grant wants a stable per-device id; persist a random one.
function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    // Reddit's installed_client grant specs device_id as a 20–30 char string;
    // a hyphen-stripped UUID is 32, so trim to 30.
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 30);
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return 'DO_NOT_TRACK_THIS_DEVICE';
  }
}

async function requestToken(signal: AbortSignal): Promise<string | null> {
  const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID as string | undefined;
  if (!clientId) return null;

  try {
    const resp = await fetch(TOKEN_URL, {
      method: 'POST',
      signal,
      credentials: 'omit',
      headers: {
        // Installed apps have no secret — Basic auth is client_id with an empty password.
        Authorization: `Basic ${btoa(`${clientId}:`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: INSTALLED_CLIENT_GRANT,
        device_id: getDeviceId(),
      }),
    });
    if (!resp.ok) return null;

    const json = await resp.json();
    if (!json?.access_token) return null;

    cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - TOKEN_SKEW_MS,
    };
    return cachedToken.value;
  } catch (error) {
    if (isAbort(error)) throw error;
    return null;
  }
}

/** Returns a cached app-only access token, fetching/refreshing as needed. Null if unconfigured. */
export async function getRedditAccessToken(signal: AbortSignal): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = requestToken(signal).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Drops the cached token (e.g. after a 401), forcing a refresh on the next request. */
export function clearRedditToken(): void {
  cachedToken = null;
}
