import { httpsCallable } from 'firebase/functions';
import { getFunctionsClient } from '@/services/firebase/app';
import { ICE_SERVERS, IceServer } from '@/config/webrtc';
import { logger } from '@/utils/logger';

export interface MintedCredentials {
  iceServers: IceServer[];
  /** Epoch millis after which the credentials stop working. */
  expiresAt: number;
}

/** Re-mint this far before expiry so a long call never runs out mid-connection. */
export const TURN_CACHE_SLACK_MS = 10 * 60 * 1000;

interface ResolverPorts {
  mintCredentials: () => Promise<MintedCredentials>;
  /** Relay bundled with the client, used when minting is unavailable. */
  fallback: IceServer[];
  now: () => number;
}

/**
 * Resolve the ICE servers to hand a new peer connection.
 *
 * Short-lived credentials come from a backend call, so this is async and can
 * fail. Failure falls back to the bundled relay rather than to STUN alone: for
 * users behind symmetric NAT or a UDP-blocking firewall, no relay means no
 * connection at all, and the symptom they report is "I only see myself".
 */
export function createIceServerResolver({ mintCredentials, fallback, now }: ResolverPorts) {
  let cached: MintedCredentials | null = null;

  return async function resolveIceServers(): Promise<IceServer[]> {
    if (cached && cached.expiresAt - TURN_CACHE_SLACK_MS > now()) {
      return cached.iceServers;
    }

    try {
      const minted = await mintCredentials();

      if (!minted?.iceServers?.length) {
        logger.warn('[ice] TURN provider returned no servers; using bundled relay');
        return fallback;
      }

      // Only a success is cached. Caching a failure would strand the tab on the
      // bundled relay for as long as it stays open.
      cached = minted;
      return minted.iceServers;
    } catch (error) {
      logger.warn('[ice] Could not mint TURN credentials; using bundled relay', error);
      return fallback;
    }
  };
}

export const resolveIceServers = createIceServerResolver({
  mintCredentials: async () => {
    const callable = httpsCallable<unknown, MintedCredentials>(
      getFunctionsClient(),
      'getTurnCredentials'
    );
    const { data } = await callable();
    return data;
  },
  fallback: ICE_SERVERS,
  now: () => Date.now(),
});
