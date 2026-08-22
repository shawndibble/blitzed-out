import { logger } from 'firebase-functions';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { APP_CHECK_ENFORCED, observeAppCheck } from './appCheck';
import { enforceRateLimit, RateLimitPolicy } from './rateLimit';

/**
 * Mints short-lived Cloudflare TURN credentials.
 *
 * Anything in the client bundle is harvestable and bills to us until rotated by
 * hand; Cloudflare issues time-boxed credentials, but only to a holder of the
 * account API token — hence a server call. Needs the CLOUDFLARE_TURN_TOKEN
 * secret plus CLOUDFLARE_TURN_KEY_ID (an identifier, so a plain env var).
 */

const CLOUDFLARE_TURN_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';

/**
 * Long enough to outlast a call, short enough that a harvested credential is
 * worth little. Clients re-mint automatically as expiry approaches.
 */
const CREDENTIAL_TTL_SECONDS = 2 * 60 * 60;

/** Upstream budget. The client is waiting; a slow mint is worse than no mint. */
const UPSTREAM_TIMEOUT_MS = 10_000;

/**
 * Per-uid mint budget. Sized far above real use (~1 mint per tab per 110 min) so a
 * false block cannot break a call; derivation in `docs/engineering/security.md`
 * § Cloud Functions.
 *
 * Bounds how *broadly* one account can redistribute credentials, not bandwidth: a
 * single credential relays unlimited bytes for its whole TTL. Caps there are
 * Cloudflare's side of the deal.
 */
const MINT_RATE_LIMIT: RateLimitPolicy = {
  quota: 60,
  windowMs: 10 * 60 * 1000,
};

interface CloudflareIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Cloudflare has returned `iceServers` as both a single object and an array
 * across revisions of this endpoint. Normalize before it reaches the client.
 */
function toIceServerArray(payload: unknown): CloudflareIceServer[] {
  const iceServers = (payload as { iceServers?: unknown })?.iceServers;
  if (!iceServers) return [];
  return Array.isArray(iceServers) ? iceServers : [iceServers as CloudflareIceServer];
}

export const getTurnCredentials = onCall(
  // Bounded well under the 60s default: every path here is either a fast RTDB
  // read or a time-boxed upstream call, and the client is blocked meanwhile.
  {
    enforceAppCheck: APP_CHECK_ENFORCED,
    secrets: ['CLOUDFLARE_TURN_TOKEN'],
    timeoutSeconds: 30,
  },
  async (request: CallableRequest<{ roomId?: unknown }>) => {
    observeAppCheck(request, 'getTurnCredentials');

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in before requesting TURN credentials');
    }

    // Anonymous guest accounts are free to create, so authentication alone is
    // not a spend control — relay bandwidth is billed to us. Requiring the
    // caller to already hold a roster slot ties every credential to a real call.
    const roomId = typeof request.data?.roomId === 'string' ? request.data.roomId : '';
    if (!roomId || !/^[A-Za-z0-9_-]{1,64}$/.test(roomId)) {
      throw new HttpsError('invalid-argument', 'A valid roomId is required');
    }

    const presence = await getDatabase()
      .ref(`video-calls/${roomId}/users/${request.auth.uid}`)
      .once('value');

    if (!presence.exists()) {
      throw new HttpsError('permission-denied', 'Join the call before requesting TURN credentials');
    }

    // After the presence check, so a client hammering with a roomId it does not
    // hold cannot burn the quota that its real calls need — and before the
    // Cloudflare call, because the point is to not make that call.
    await enforceRateLimit(request.auth.uid, 'turnCredentials', MINT_RATE_LIMIT);

    const apiToken = process.env.CLOUDFLARE_TURN_TOKEN;
    const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;

    if (!apiToken || !keyId) {
      // The client falls back to its bundled relay, so this is a degradation
      // rather than an outage — but it is one nobody would otherwise notice.
      logger.error('Cloudflare TURN is not configured; falling back to bundled relay', {
        hasToken: Boolean(apiToken),
        hasKeyId: Boolean(keyId),
      });
      throw new HttpsError('failed-precondition', 'TURN provider not configured');
    }

    let response: Response;
    try {
      response = await fetch(`${CLOUDFLARE_TURN_API}/${keyId}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: CREDENTIAL_TTL_SECONDS }),
        // Without this a hung request runs to the platform timeout, and that
        // response comes from the infrastructure rather than the function — so it
        // carries no CORS headers and the browser reports a CORS failure instead
        // of the timeout it actually was. Failing fast keeps the error legible
        // and lets the client fall back to its bundled relay promptly.
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch (error) {
      logger.error('Cloudflare TURN request failed', error);
      throw new HttpsError('unavailable', 'Could not reach the TURN provider');
    }

    if (!response.ok) {
      logger.error('Cloudflare TURN rejected the request', {
        status: response.status,
        body: await response.text().catch(() => '<unreadable>'),
      });
      throw new HttpsError('unavailable', 'TURN provider rejected the request');
    }

    const iceServers = toIceServerArray(await response.json());

    if (iceServers.length === 0) {
      logger.error('Cloudflare TURN returned no ICE servers');
      throw new HttpsError('unavailable', 'TURN provider returned no servers');
    }

    return {
      iceServers,
      // Absolute, so the client can cache without trusting its own clock offset
      // against ours any more precisely than the TTL already tolerates.
      expiresAt: Date.now() + CREDENTIAL_TTL_SECONDS * 1000,
    };
  }
);
