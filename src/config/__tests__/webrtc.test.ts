import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  return import('../webrtc');
}

describe('ICE_SERVERS', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test('always offers STUN so peers can discover their reflexive address', async () => {
    const { ICE_SERVERS } = await loadConfig();

    const urls = ICE_SERVERS.flatMap((server) =>
      Array.isArray(server.urls) ? server.urls : [server.urls]
    );

    expect(urls.some((url) => url.startsWith('stun:'))).toBe(true);
  });

  test('omits relay entries when TURN credentials are absent', async () => {
    vi.stubEnv('VITE_METERED_USERNAME', '');
    vi.stubEnv('VITE_METERED_CREDENTIAL', '');

    const { ICE_SERVERS } = await loadConfig();

    expect(ICE_SERVERS.every((server) => !String(server.urls).startsWith('turn'))).toBe(true);
  });

  describe('with TURN credentials configured', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_METERED_USERNAME', 'relay-user');
      vi.stubEnv('VITE_METERED_CREDENTIAL', 'relay-secret');
    });

    test('relays over TCP as well as UDP, so UDP-blocked networks still connect', async () => {
      const { ICE_SERVERS } = await loadConfig();

      const relayUrls = ICE_SERVERS.map((server) => String(server.urls)).filter((url) =>
        url.startsWith('turn')
      );

      expect(relayUrls.some((url) => url.includes('transport=tcp'))).toBe(true);
      expect(relayUrls.some((url) => !url.includes('transport=tcp'))).toBe(true);
    });

    test('relays over port 80 as well as 443, so 443-only egress filters have a fallback', async () => {
      const { ICE_SERVERS } = await loadConfig();

      const relayUrls = ICE_SERVERS.map((server) => String(server.urls)).filter((url) =>
        url.startsWith('turn')
      );

      expect(relayUrls.some((url) => url.includes(':80'))).toBe(true);
      expect(relayUrls.some((url) => url.includes(':443'))).toBe(true);
    });

    test('attaches credentials to every relay entry', async () => {
      const { ICE_SERVERS } = await loadConfig();

      const relayServers = ICE_SERVERS.filter((server) => String(server.urls).startsWith('turn'));

      expect(relayServers.length).toBeGreaterThan(1);
      relayServers.forEach((server) => {
        expect(server.username).toBe('relay-user');
        expect(server.credential).toBe('relay-secret');
      });
    });
  });
});
