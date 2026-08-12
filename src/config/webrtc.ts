import { logger } from '@/utils/logger';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// Mesh topology cap — beyond this, per-peer connection count crashes browsers.
// For larger groups the UI redirects users to an SFU-based service (Discord/Jitsi/Zoom).
export const MAX_PEERS = 4;

const METERED_USERNAME = import.meta.env.VITE_METERED_USERNAME;
const METERED_CREDENTIAL = import.meta.env.VITE_METERED_CREDENTIAL;

const RELAY_HOST = 'global.relay.metered.ca';

// One entry per port/transport combination the relay publishes. A single UDP URL
// strands every user whose network blocks outbound UDP — corporate, university,
// hotel, some mobile carriers — because neither STUN nor relay is reachable and
// both sides end up seeing only themselves. Port 80 covers egress filters that
// only whitelist web ports; `transport=tcp` covers UDP blocks.
const RELAY_URLS = [
  `turn:${RELAY_HOST}:80`,
  `turn:${RELAY_HOST}:80?transport=tcp`,
  `turn:${RELAY_HOST}:443`,
  `turn:${RELAY_HOST}:443?transport=tcp`,
];

export const ICE_SERVERS: IceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

if (METERED_USERNAME && METERED_CREDENTIAL) {
  RELAY_URLS.forEach((urls) => {
    ICE_SERVERS.push({
      urls,
      username: METERED_USERNAME,
      credential: METERED_CREDENTIAL,
    });
  });
} else {
  logger.warn(
    '[webrtc] No TURN credentials configured — peers behind symmetric NAT or a firewall will fail to connect.'
  );
}
