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

export const ICE_SERVERS: IceServer[] = [
  // Google's public STUN server (more reliable)
  { urls: 'stun:stun.l.google.com:19302' },
];

if (METERED_USERNAME && METERED_CREDENTIAL) {
  ICE_SERVERS.push({
    urls: 'turn:global.relay.metered.ca:443',
    username: METERED_USERNAME,
    credential: METERED_CREDENTIAL,
  });
}
