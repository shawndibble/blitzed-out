import * as functions from 'firebase-functions/v1';

/**
 * Mints short-lived Cloudflare TURN credentials for a signed-in caller.
 *
 * TURN credentials cannot live in the client bundle: whatever ships there is
 * harvestable and bills to us until it is rotated by hand. Cloudflare issues
 * time-boxed credentials instead, but only to a caller holding the account API
 * token — which is why this has to be a server call at all.
 *
 * Requires the CLOUDFLARE_TURN_TOKEN secret. CLOUDFLARE_TURN_KEY_ID selects the
 * TURN key; it is an identifier, not a secret, so it is a plain env var.
 */

const CLOUDFLARE_TURN_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';

/** Long enough to outlast any realistic call, short enough that a leak expires. */
const CREDENTIAL_TTL_SECONDS = 12 * 60 * 60;

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

export const getTurnCredentials = functions
  .runWith({ secrets: ['CLOUDFLARE_TURN_TOKEN'] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Sign in before requesting TURN credentials'
      );
    }

    const apiToken = process.env.CLOUDFLARE_TURN_TOKEN;
    const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;

    if (!apiToken || !keyId) {
      // The client falls back to its bundled relay, so this is a degradation
      // rather than an outage — but it is one nobody would otherwise notice.
      functions.logger.error('Cloudflare TURN is not configured; falling back to bundled relay', {
        hasToken: Boolean(apiToken),
        hasKeyId: Boolean(keyId),
      });
      throw new functions.https.HttpsError('failed-precondition', 'TURN provider not configured');
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
      });
    } catch (error) {
      functions.logger.error('Cloudflare TURN request failed', error);
      throw new functions.https.HttpsError('unavailable', 'Could not reach the TURN provider');
    }

    if (!response.ok) {
      functions.logger.error('Cloudflare TURN rejected the request', {
        status: response.status,
        body: await response.text().catch(() => '<unreadable>'),
      });
      throw new functions.https.HttpsError('unavailable', 'TURN provider rejected the request');
    }

    const iceServers = toIceServerArray(await response.json());

    if (iceServers.length === 0) {
      functions.logger.error('Cloudflare TURN returned no ICE servers');
      throw new functions.https.HttpsError('unavailable', 'TURN provider returned no servers');
    }

    return {
      iceServers,
      // Absolute, so the client can cache without trusting its own clock offset
      // against ours any more precisely than the TTL already tolerates.
      expiresAt: Date.now() + CREDENTIAL_TTL_SECONDS * 1000,
    };
  });
