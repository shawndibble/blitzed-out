import { describe, test, expect } from 'vitest';
import { ICE_SERVERS } from '../webrtc';

describe('webrtc configuration', () => {
  test('ICE_SERVERS is defined', () => {
    expect(ICE_SERVERS).toBeDefined();
  });

  test('ICE_SERVERS is an array', () => {
    expect(Array.isArray(ICE_SERVERS)).toBe(true);
  });

  test('ICE_SERVERS contains at least one STUN server', () => {
    expect(ICE_SERVERS.length).toBeGreaterThan(0);
  });

  test('Each server has required urls property', () => {
    ICE_SERVERS.forEach((server) => {
      expect(server).toHaveProperty('urls');
      expect(typeof server.urls).toBe('string');
    });
  });

  test('All servers are STUN servers (free)', () => {
    ICE_SERVERS.forEach((server) => {
      expect(server.urls).toMatch(/^stun:/);
    });
  });

  test('Includes Google STUN servers', () => {
    const hasGoogleStun = ICE_SERVERS.some((server) => {
      // Parse the URL to safely check the hostname
      try {
        const url = new URL(server.urls);
        return url.hostname === 'stun.l.google.com' || url.hostname === 'stun1.l.google.com';
      } catch {
        return false;
      }
    });
    expect(hasGoogleStun).toBe(true);
  });
});
