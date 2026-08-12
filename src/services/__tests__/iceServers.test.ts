import { describe, expect, test, vi } from 'vitest';
import { createIceServerResolver, TURN_CACHE_SLACK_MS } from '../iceServers';
import type { IceServer } from '@/config/webrtc';

const FALLBACK: IceServer[] = [
  { urls: 'stun:stun.example:19302' },
  { urls: 'turn:relay.example:443', username: 'bundled', credential: 'secret' },
];

const CLOUDFLARE_SERVERS: IceServer[] = [
  {
    urls: ['stun:stun.cloudflare.com:3478', 'turns:turn.cloudflare.com:5349?transport=tcp'],
    username: 'minted',
    credential: 'short-lived',
  },
];

function resolverWith(
  mintCredentials: () => Promise<{ iceServers: IceServer[]; expiresAt: number }>,
  now = () => 1_000_000
) {
  return createIceServerResolver({ mintCredentials, fallback: FALLBACK, now });
}

describe('resolveIceServers', () => {
  test('prefers freshly minted credentials over the bundled relay', async () => {
    const resolve = resolverWith(async () => ({
      iceServers: CLOUDFLARE_SERVERS,
      expiresAt: 2_000_000,
    }));

    await expect(resolve()).resolves.toEqual(CLOUDFLARE_SERVERS);
  });

  // Losing the minting endpoint must not take relay away entirely — that is the
  // difference between a degraded call and one where NAT'd users see nobody.
  test('falls back to the bundled relay when minting fails', async () => {
    const resolve = resolverWith(async () => {
      throw new Error('function unavailable');
    });

    await expect(resolve()).resolves.toEqual(FALLBACK);
  });

  test('falls back when the provider returns nothing usable', async () => {
    const resolve = resolverWith(async () => ({ iceServers: [], expiresAt: 2_000_000 }));

    await expect(resolve()).resolves.toEqual(FALLBACK);
  });

  test('reuses minted credentials until they near expiry', async () => {
    const mint = vi.fn(async () => ({ iceServers: CLOUDFLARE_SERVERS, expiresAt: 9_000_000 }));
    const resolve = resolverWith(mint);

    await resolve();
    await resolve();

    expect(mint).toHaveBeenCalledTimes(1);
  });

  test('re-mints once the cached credentials are inside the expiry slack', async () => {
    let clock = 1_000_000;
    const expiresAt = clock + TURN_CACHE_SLACK_MS + 1000;
    const mint = vi.fn(async () => ({ iceServers: CLOUDFLARE_SERVERS, expiresAt }));
    const resolve = resolverWith(mint, () => clock);

    await resolve();
    clock = expiresAt - TURN_CACHE_SLACK_MS + 1;
    await resolve();

    expect(mint).toHaveBeenCalledTimes(2);
  });

  // A failed mint must not be cached, or one blip strands the room on the
  // bundled relay for as long as the tab stays open.
  test('retries minting after a failure instead of caching the fallback', async () => {
    const mint = vi
      .fn<() => Promise<{ iceServers: IceServer[]; expiresAt: number }>>()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue({ iceServers: CLOUDFLARE_SERVERS, expiresAt: 9_000_000 });
    const resolve = resolverWith(mint);

    await expect(resolve()).resolves.toEqual(FALLBACK);
    await expect(resolve()).resolves.toEqual(CLOUDFLARE_SERVERS);
  });
});
