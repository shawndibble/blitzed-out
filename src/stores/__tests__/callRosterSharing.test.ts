/**
 * @vitest-environment jsdom
 *
 * The two stores that read `video-calls/{roomId}/users`, exercised against one
 * fake database instead of one stub each.
 *
 * Every other test file mocks `firebase/database` for itself, so no listener a
 * store registers is ever visible to another. That blind spot is what let
 * `cleanup()`'s blanket `off(ref)` tear down the participant badge's listener
 * unnoticed: both suites passed, and the badge died in production after the
 * first call ended.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fakeDatabase, realtimeDatabaseModule } from '@/__mocks__/realtimeDatabase';
import { MAX_CALL_PARTICIPANTS } from '@/config/webrtc';

vi.mock('firebase/database', () => realtimeDatabaseModule());

vi.mock('@/services/firebase/app', () => ({
  getRealtimeDb: vi.fn(() => ({})),
}));

vi.mock('@/services/firebaseSignaling', () => ({
  firebaseSignaling: {
    claim: vi.fn().mockResolvedValue(undefined),
    listen: vi.fn(),
    sendOffer: vi.fn(),
    sendAnswer: vi.fn(),
    sendIceCandidate: vi.fn(),
    heartbeat: vi.fn().mockResolvedValue(undefined),
    setPresent: vi.fn().mockResolvedValue(undefined),
    publishMediaState: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn(),
  },
}));

vi.mock('@/services/iceServers', () => ({
  resolveIceServers: vi.fn(async () => []),
}));

vi.mock('@/services/adapters/NativePeerTransportAdapter', () => ({
  createNativePeerTransport: vi.fn(() => ({
    closed: false,
    close: vi.fn(),
    accept: vi.fn(),
    replaceLocalTracks: vi.fn(),
    setVideoTrack: vi.fn(),
    candidateTypes: vi.fn(async () => null),
  })),
}));

const ROOM = 'PUBLIC';
const PATH = `video-calls/${ROOM}/users`;

/** A roster of `count` participants, all heartbeating right now. */
function freshUsers(count: number): Record<string, { lastSeen: number }> {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`user-${index}`, { lastSeen: Date.now() }])
  );
}

describe('Both readers of the call roster node', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    fakeDatabase.reset();

    const { useCallPresenceStore } = await import('../callPresenceStore');
    useCallPresenceStore.setState({ count: 0, capacityCount: 0, loaded: false, roomId: null });

    class StubMediaStream {
      getTracks() {
        return [];
      }
      getVideoTracks() {
        return [];
      }
      getAudioTracks() {
        return [];
      }
    }
    vi.stubGlobal('MediaStream', StubMediaStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => new StubMediaStream() as unknown as MediaStream) },
    });
  });

  afterEach(async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { useCallPresenceStore } = await import('../callPresenceStore');
    useVideoCallStore.getState().cleanup();
    useCallPresenceStore.getState().stopWatching();
    vi.unstubAllGlobals();
  });

  test('both hold their own registration on the same path', async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { useCallPresenceStore } = await import('../callPresenceStore');

    useCallPresenceStore.getState().watch(ROOM);
    await useVideoCallStore.getState().initialize(ROOM, 'me');

    expect(fakeDatabase.listenerCount(PATH)).toBe(2);
  });

  // The regression. `off(ref)` here removed both registrations, so the badge went
  // dark for the rest of the session and the join gate lost the count it reads.
  test('ending a call leaves the badge listening', async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { useCallPresenceStore } = await import('../callPresenceStore');

    useCallPresenceStore.getState().watch(ROOM);
    await useVideoCallStore.getState().initialize(ROOM, 'me');

    useVideoCallStore.getState().cleanup();

    expect(fakeDatabase.listenerCount(PATH)).toBe(1);

    fakeDatabase.publish(PATH, freshUsers(3));
    expect(useCallPresenceStore.getState().count).toBe(3);
  });

  // Same failure seen from the outside: the gate reads the badge's store, so a
  // dead listener let a seventh person past a full call.
  test('the full-call gate still refuses a join after a call has ended', async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { useCallPresenceStore } = await import('../callPresenceStore');

    useCallPresenceStore.getState().watch(ROOM);
    await useVideoCallStore.getState().initialize(ROOM, 'me');
    useVideoCallStore.getState().cleanup();

    fakeDatabase.publish(PATH, freshUsers(MAX_CALL_PARTICIPANTS));
    await useVideoCallStore.getState().initialize(ROOM, 'me');

    expect(useVideoCallStore.getState().isInitialized).toBe(false);
  });

  // RTDB replays a cached view synchronously to a listener joining an open path.
  // A guard keyed on `onValue`'s return value is still unset at that moment.
  test('a badge attaching to a live call sees the roster at once', async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { useCallPresenceStore } = await import('../callPresenceStore');

    await useVideoCallStore.getState().initialize(ROOM, 'me');
    fakeDatabase.publish(PATH, freshUsers(2));

    useCallPresenceStore.getState().watch(ROOM);

    expect(useCallPresenceStore.getState().count).toBe(2);
    expect(useCallPresenceStore.getState().loaded).toBe(true);
  });

  // The badge's listener keeps the node warm, so a joiner's own `onValue` is
  // answered from cache instead of a round trip. Signalling binds inside that
  // first snapshot, which is why `rosterLoaded` is never false at `handleSignal`.
  test('a joiner behind the badge has its roster before initialize returns', async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { useCallPresenceStore } = await import('../callPresenceStore');
    const { firebaseSignaling } = await import('@/services/firebaseSignaling');

    useCallPresenceStore.getState().watch(ROOM);
    fakeDatabase.publish(PATH, freshUsers(1));

    await useVideoCallStore.getState().initialize(ROOM, 'me');

    expect(useVideoCallStore.getState().rosterLoaded).toBe(true);
    expect(firebaseSignaling.listen).toHaveBeenCalledTimes(1);
  });

  // Without it the path is cold, so nothing is known until the read lands.
  test('a joiner with no badge listening waits for the first snapshot', async () => {
    const { useVideoCallStore } = await import('../videoCallStore');
    const { firebaseSignaling } = await import('@/services/firebaseSignaling');

    await useVideoCallStore.getState().initialize(ROOM, 'me');

    expect(useVideoCallStore.getState().rosterLoaded).toBe(false);
    expect(firebaseSignaling.listen).not.toHaveBeenCalled();
  });

  test('a read failure leaves the count unknown rather than zero', async () => {
    const { useCallPresenceStore } = await import('../callPresenceStore');

    useCallPresenceStore.getState().watch(ROOM);
    fakeDatabase.fail(PATH);

    expect(useCallPresenceStore.getState().loaded).toBe(false);
    expect(useCallPresenceStore.getState().count).toBe(0);
  });
});
