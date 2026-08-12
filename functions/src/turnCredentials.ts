import * as functions from 'firebase-functions/v1';
import { getDatabase } from 'firebase-admin/database';

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
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Sign in before requesting TURN credentials'
      );
    }

    // Anonymous guest accounts are free to create, so authentication alone is
    // not a spend control — relay bandwidth is billed to us. Requiring the
    // caller to already hold a roster slot ties every credential to a real call.
    const roomId = typeof data?.roomId === 'string' ? data.roomId : '';
    if (!roomId || !/^[A-Za-z0-9_-]{1,64}$/.test(roomId)) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid roomId is required');
    }

    const presence = await getDatabase()
      .ref(`video-calls/${roomId}/users/${context.auth.uid}`)
      .once('value');

    if (!presence.exists()) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Join the call before requesting TURN credentials'
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
