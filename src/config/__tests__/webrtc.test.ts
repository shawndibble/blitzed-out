import { describe, test, expect } from 'vitest';
import { ICE_SERVERS } from '../webrtc';

describe('webrtc configuration', () => {
  test('ICE_SERVERS is defined and is an array', () => {
    expect(ICE_SERVERS).toBeDefined();
    expect(Array.isArray(ICE_SERVERS)).toBe(true);
  });

  test('ICE_SERVERS contains at least one server', () => {
    expect(ICE_SERVERS.length).toBeGreaterThan(0);
  });

  test('All servers have required urls property', () => {
    ICE_SERVERS.forEach((server) => {
      expect(server).toHaveProperty('urls');
      expect(typeof server.urls === 'string' || Array.isArray(server.urls)).toBe(true);
    });
  });

  test('Contains at least one STUN server', () => {
    const hasStunServer = ICE_SERVERS.some((server) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      return urls.some((url) => url.startsWith('stun:'));
    });
    expect(hasStunServer).toBe(true);
  });

  test('STUN and TURN servers use valid protocols', () => {
    ICE_SERVERS.forEach((server) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      urls.forEach((url) => {
        expect(url.startsWith('stun:') || url.startsWith('turn:')).toBe(true);
      });
    });
  });

  test('TURN servers have credentials when present', () => {
    const turnServers = ICE_SERVERS.filter((server) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      return urls.some((url) => url.startsWith('turn:'));
    });

    // If there are TURN servers, they should have credentials
    turnServers.forEach((server) => {
      expect(server).toHaveProperty('username');
      expect(server).toHaveProperty('credential');
      expect(typeof server.username).toBe('string');
      expect(typeof server.credential).toBe('string');
    });
  });
});
