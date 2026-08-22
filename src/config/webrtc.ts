import { logger } from '@/utils/logger';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Mesh topology cap. Every participant uploads a separately encoded stream to
 * every other one, so a six-person call is five uploads each — roughly the top
 * of the band a serverless mesh sustains before uplink and encoder count start
 * degrading the call for everybody, not just the weakest client. For larger
 * groups the UI redirects users to an SFU-based service (Discord/Jitsi/Zoom).
 */
export const MAX_CALL_PARTICIPANTS = 6;

/**
 * Connections one participant holds, which is everyone else in the call. Derived
 * rather than written out: the two were independently maintained before, so a
 * cap of 4 peers quietly meant a 5-person call.
 */
export const MAX_PEERS = MAX_CALL_PARTICIPANTS - 1;

/**
 * Where the call warns that quality may suffer. Below the hard cap on purpose —
 * degradation is gradual, so there is a band worth flagging before the point
 * nobody else can join at all.
 */
export const CALL_QUALITY_WARNING_PARTICIPANTS = 4;

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

/**
 * How long a `disconnected` link is given to heal before anything acts on it.
 *
 * `disconnected` is transient by specification and usually recovers unaided, so both
 * the ICE restart and the UI that admits something is wrong wait this out first.
 * Shared so the two never contradict each other in a way a user would notice —
 * though they watch different state machines and so arm at different moments.
 */
export const LINK_GRACE_MS = 2500;
