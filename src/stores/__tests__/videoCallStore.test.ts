/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import {
  HEARTBEAT_INTERVAL_MS,
  MAX_RETRY_ATTEMPTS,
  RECONCILE_INTERVAL_MS,
  RETRY_MAX_MS,
  ROSTER_STALE_MS,
  liveRoster,
  setPeerTransportFactory,
  useVideoCallStore,
} from '../videoCallStore';
import { MAX_PEERS } from '@/config/webrtc';
import type { PeerTransportEvents } from '@/services/ports/PeerTransportPort';

const harness = vi.hoisted(() => ({
  rosterListeners: [] as Array<(snapshot: { val: () => unknown }) => void>,
  peers: [] as any[],
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

/** A literal stand-in for the transport, driven through the port's callbacks. */
class FakeTransport {
  closed = false;
  accept = vi.fn();
  replaceLocalTracks = vi.fn();
  setVideoTrack = vi.fn();
  candidateTypes = vi.fn(async () => null);
  options: any;

  constructor(options: any) {
    this.options = options;
    harness.peers.push(this);
  }

  /** Drive one of the port's callbacks, by its own name. */
  emit(callback: keyof PeerTransportEvents, ...args: any[]) {
    (this.options.events[callback] as (...a: any[]) => void)?.(...args);
  }

  // Must fire onClosed synchronously and exactly once: `dropPeer` re-enters
  // through it, and a second pass would book a second retry for one failure.
  close = vi.fn(() => {
    if (this.closed) return;
    this.closed = true;
    this.emit('onClosed');
  });
}

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  onValue: vi.fn((_ref, callback) => {
    harness.rosterListeners.push(callback);
    return vi.fn(); // Return unsubscribe function
  }),
  off: vi.fn(),
}));

const MINTED_ICE_SERVERS = [
  { urls: 'turns:turn.example:5349?transport=tcp', username: 'minted', credential: 'short-lived' },
];

vi.mock('@/services/iceServers', () => ({
  resolveIceServers: vi.fn(async () => MINTED_ICE_SERVERS),
}));

/** Drive the RTDB roster listener the store registered during `initialize`. */
function publishRoster(userIds: string[]) {
  const value = Object.fromEntries(
    userIds.map((id) => [id, { status: 'online', lastSeen: Date.now() }])
  );
  harness.rosterListeners.forEach((listener) => listener({ val: () => value }));
}

/** As `publishRoster`, but with control over each entry's published media flags. */
function publishRosterEntries(entries: Record<string, Record<string, unknown>>) {
  const value = Object.fromEntries(
    Object.entries(entries).map(([id, extra]) => [
      id,
      { status: 'online', lastSeen: Date.now(), ...extra },
    ])
  );
  harness.rosterListeners.forEach((listener) => listener({ val: () => value }));
}

/** A store with a call already up, which every media-state assertion needs. */
async function initialized() {
  const { result } = renderHook(() => useVideoCallStore());
  await act(async () => {
    await result.current.initialize('test-room', 'test-user-id');
  });
  return result;
}

describe('VideoCallStore', () => {
  let restoreTransport: () => void;
  let mockMediaStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let mockAudioTrack: MediaStreamTrack;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    harness.rosterListeners.length = 0;
    harness.peers.length = 0;
    restoreTransport = setPeerTransportFactory((options) => new FakeTransport(options) as never);

    // Re-arm after clearAllMocks: the store awaits these, so a bare vi.fn()
    // returning undefined fails on `.catch` rather than on the assertion.
    const { firebaseSignaling } = await import('@/services/firebaseSignaling');
    vi.mocked(firebaseSignaling.claim).mockResolvedValue(undefined);
    vi.mocked(firebaseSignaling.setPresent).mockResolvedValue(undefined);
    vi.mocked(firebaseSignaling.heartbeat).mockResolvedValue(undefined);
    vi.mocked(firebaseSignaling.publishMediaState).mockResolvedValue(undefined);

    // jsdom ships no MediaStream; peers hold one per remote participant.
    class StubMediaStream {
      private tracks: MediaStreamTrack[];
      constructor(tracks: MediaStreamTrack[] = []) {
        this.tracks = [...tracks];
      }
      getTracks() {
        return this.tracks;
      }
      getVideoTracks() {
        return this.tracks.filter((track) => track.kind === 'video');
      }
      getAudioTracks() {
        return this.tracks.filter((track) => track.kind === 'audio');
      }
    }
    vi.stubGlobal('MediaStream', StubMediaStream);

    mockVideoTrack = {
      stop: vi.fn(),
      kind: 'video',
      enabled: true,
    } as unknown as MediaStreamTrack;

    mockAudioTrack = {
      stop: vi.fn(),
      kind: 'audio',
      enabled: true,
    } as unknown as MediaStreamTrack;

    mockMediaStream = {
      getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
      getAudioTracks: vi.fn(() => [mockAudioTrack]),
    } as unknown as MediaStream;

    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
      },
    });
  });

  afterEach(() => {
    const store = useVideoCallStore.getState();
    if (store.isInitialized) {
      act(() => {
        store.cleanup();
      });
    }
    vi.useRealTimers();
    restoreTransport();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useVideoCallStore());

      expect(result.current.localStream).toBeNull();
      expect(result.current.peers).toEqual(new Map());
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isVideoOff).toBe(false);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isCallActive).toBe(false);
    });
  });

  describe('Initialize', () => {
    test('should initialize local stream', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      expect(result.current.localStream).toBe(mockMediaStream);
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isCallActive).toBe(true);
    });

    test('should start heartbeat monitoring after initialization', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      expect(result.current.isInitialized).toBe(true);
    });

    test('should handle getUserMedia errors', async () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      expect(result.current.localStream).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toEqual({
        type: 'NotAllowedError',
        message: 'videoCall.errors.permissionDenied',
      });
    });
  });

  describe('Cleanup', () => {
    test('should stop all local stream tracks on cleanup', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.cleanup();
      });

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(result.current.localStream).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isCallActive).toBe(false);
    });

    test('should clear all peers on cleanup', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.cleanup();
      });

      expect(result.current.peers.size).toBe(0);
    });

    test('should not throw if cleanup called before initialization', () => {
      const { result } = renderHook(() => useVideoCallStore());

      expect(() => {
        act(() => {
          result.current.cleanup();
        });
      }).not.toThrow();
    });
  });

  describe('Toggle Mute', () => {
    test('should toggle audio track enabled state', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
      expect(mockAudioTrack.enabled).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
      expect(mockAudioTrack.enabled).toBe(true);
    });

    test('should not throw if toggleMute called before initialization', () => {
      const { result } = renderHook(() => useVideoCallStore());

      expect(() => {
        act(() => {
          result.current.toggleMute();
        });
      }).not.toThrow();
    });
  });

  describe('Toggle Video', () => {
    test('should not throw if toggleVideo called before initialization', () => {
      const { result } = renderHook(() => useVideoCallStore());

      expect(() => {
        act(() => {
          result.current.toggleVideo();
        });
      }).not.toThrow();
    });
  });

  describe('Page Visibility Handling', () => {
    test('should pause video when page becomes hidden', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.handleVisibilityChange(true);
      });

      expect(mockVideoTrack.enabled).toBe(false);
    });

    test('should resume video when page becomes visible', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.handleVisibilityChange(true);
      });

      act(() => {
        result.current.handleVisibilityChange(false);
      });

      const videoTrack = result.current.localStream?.getVideoTracks()[0];
      expect(videoTrack?.enabled).toBe(true);
    });

    test('should not resume if video was manually turned off', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.toggleVideo();
      });

      act(() => {
        result.current.handleVisibilityChange(true);
      });

      act(() => {
        result.current.handleVisibilityChange(false);
      });

      expect(result.current.isVideoOff).toBe(true);
    });
  });

  describe('Initialize concurrency', () => {
    // Three components can call initialize, and it awaits twice before
    // isInitialized flips — so the flag alone gates nothing.
    test('a second concurrent call does not build a second call session', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await Promise.all([
          result.current.initialize('test-room', 'self'),
          result.current.initialize('test-room', 'self'),
        ]);
      });

      expect(firebaseSignaling.claim).toHaveBeenCalledTimes(1);
    });

    // A failed claim means no roster slot, so the user is invisible and
    // credential minting rejects them. It must not leave the generation lock
    // held with isInitialized false, which would block every later attempt.
    test('a failed roster claim releases the lock and the camera', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const { result } = renderHook(() => useVideoCallStore());
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(firebaseSignaling.claim).mockRejectedValueOnce(new Error('permission denied'));

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });

      expect(result.current.isInitialized).toBe(true);
      errorSpy.mockRestore();
    });

    // cleanup() landing mid-await would otherwise leave a roster listener and
    // two intervals running that nothing holds a handle to.
    test('abandons setup when cleanup lands while it is still awaiting', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        const pending = result.current.initialize('test-room', 'self');
        result.current.cleanup();
        await pending;
      });

      expect(result.current.isInitialized).toBe(false);
      expect(mockVideoTrack.stop).toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(RECONCILE_INTERVAL_MS * 3);
      });

      expect(harness.peers.length).toBe(0);
    });
  });

  describe('Presence Heartbeat', () => {
    test('refreshes presence on an interval so the server prune does not evict a live caller', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });
      vi.mocked(firebaseSignaling.heartbeat).mockClear();

      await act(async () => {
        vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
      });

      expect(firebaseSignaling.heartbeat).toHaveBeenCalledTimes(2);
    });

    test('stops the heartbeat on cleanup', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });

      act(() => {
        result.current.cleanup();
      });
      vi.mocked(firebaseSignaling.heartbeat).mockClear();

      await act(async () => {
        vi.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3);
      });

      expect(firebaseSignaling.heartbeat).not.toHaveBeenCalled();
    });
  });

  // Observed in production: /PUBLIC held nine dead roster entries, and four is
  // enough to consume every mesh slot and lock real participants out entirely.
  describe('Ghost roster entries', () => {
    const FRESH = { lastSeen: 1_000_000 };

    test('drops entries older than the stale threshold', () => {
      const roster = liveRoster(
        { alive: FRESH, ghost: { lastSeen: 1_000_000 - ROSTER_STALE_MS - 1 } },
        1_000_000
      );

      expect(roster).toEqual(['alive']);
    });

    // These are the entries that survive forever: nothing can age out a
    // timestamp that was never written.
    test('drops entries with no usable timestamp', () => {
      const roster = liveRoster({ alive: FRESH, ghost: { status: 'online' } }, 1_000_000);

      expect(roster).toEqual(['alive']);
    });

    test('falls back to joinedAt for clients that predate the heartbeat', () => {
      const roster = liveRoster({ old: { joinedAt: 999_000 } }, 1_000_000);

      expect(roster).toEqual(['old']);
    });

    // When more participants are present than MAX_PEERS allows, slots should go
    // to whoever is most likely still there.
    test('orders the freshest participants first', () => {
      const roster = liveRoster(
        {
          stale: { lastSeen: 900_000 },
          freshest: { lastSeen: 999_999 },
          mid: { lastSeen: 950_000 },
        },
        1_000_000
      );

      expect(roster).toEqual(['freshest', 'mid', 'stale']);
    });

    test('handles a missing or malformed snapshot', () => {
      expect(liveRoster(null)).toEqual([]);
      expect(liveRoster('nonsense')).toEqual([]);
    });

    test('a room full of ghosts still leaves room to dial a live participant', async () => {
      const { result } = renderHook(() => useVideoCallStore());
      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });

      act(() => {
        const ghosts = Object.fromEntries(
          ['g1', 'g2', 'g3', 'g4', 'g5'].map((id) => [
            id,
            { lastSeen: Date.now() - ROSTER_STALE_MS - 1 },
          ])
        );
        harness.rosterListeners.forEach((listener) =>
          listener({
            val: () => ({
              ...ghosts,
              self: { lastSeen: Date.now() },
              zed: { lastSeen: Date.now() },
            }),
          })
        );
      });

      expect([...result.current.peers.keys()]).toEqual(['zed']);
    });
  });

  describe('Peer Reconciliation', () => {
    async function joinRoom(userId = 'self') {
      const { result } = renderHook(() => useVideoCallStore());
      await act(async () => {
        await result.current.initialize('test-room', userId);
      });
      return result;
    }

    // Bundled credentials are harvestable and capped; the peer must be built with
    // the short-lived set the backend minted, not the fallback baked into the app.
    test('builds peers with the ICE servers resolved at join time', async () => {
      await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });

      expect(harness.peers[0].options.iceServers).toEqual(MINTED_ICE_SERVERS);
    });

    test('opens a peer for every other participant on the roster', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed', 'yan']);
      });

      expect([...result.current.peers.keys()].sort()).toEqual(['yan', 'zed']);
    });

    test('never opens a peer to itself', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self']);
      });

      expect(result.current.peers.size).toBe(0);
    });

    test('stays within MAX_PEERS', async () => {
      const result = await joinRoom('aaa');

      act(() => {
        publishRoster(['aaa', 'b', 'c', 'd', 'e', 'f', 'g']);
      });

      expect(result.current.peers.size).toBe(MAX_PEERS);
    });

    // The regression this whole change exists for: a peer that dies leaves the RTDB
    // roster untouched, so the old code's "did the user list change?" gate returned
    // early and the connection was never rebuilt. One transient ICE failure meant
    // "I only see myself" until the page was reloaded.
    test('rebuilds a peer that failed, without the roster changing', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });
      const [firstAttempt] = harness.peers;

      act(() => {
        firstAttempt.emit('onError', new Error('ICE failed'));
      });
      expect(result.current.peers.has('zed')).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
      });

      expect(result.current.peers.has('zed')).toBe(true);
      expect(harness.peers.length).toBe(2);
    });

    test('rebuilds a peer whose ICE connection failed', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });

      act(() => {
        harness.peers[0].emit('onIceStateChange', 'failed');
      });
      expect(result.current.peers.has('zed')).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
      });

      expect(result.current.peers.has('zed')).toBe(true);
    });

    test('backs off rather than reconnecting on every tick', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });
      act(() => {
        harness.peers[0].emit('onError', new Error('ICE failed'));
      });

      await act(async () => {
        vi.advanceTimersByTime(RECONCILE_INTERVAL_MS);
      });

      expect(result.current.peers.has('zed')).toBe(false);
    });

    test('gives up after repeated failures instead of retrying forever', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS + 2; attempt += 1) {
        const peer = harness.peers[harness.peers.length - 1];
        act(() => {
          peer.emit('onError', new Error('ICE failed'));
        });
        await act(async () => {
          vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
        });
      }

      expect(harness.peers.length).toBe(MAX_RETRY_ATTEMPTS);
      expect(result.current.peers.has('zed')).toBe(false);
    });

    // ICE reaches `connected` before the DTLS handshake finishes. Treating that as
    // connected cleared the retry budget, so a peer whose handshake then failed
    // re-booked attempt 1 forever and re-dialled for the life of the call.
    test('ICE connecting does not clear the retry budget before media can flow', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS + 2; attempt += 1) {
        const peer = harness.peers[harness.peers.length - 1];
        act(() => {
          peer.emit('onIceStateChange', 'connected');
          peer.emit('onError', new Error('DTLS failed'));
        });
        await act(async () => {
          vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
        });
      }

      expect(harness.peers.length).toBe(MAX_RETRY_ATTEMPTS);
      expect(result.current.peers.has('zed')).toBe(false);
    });

    test('a successful connection clears the retry budget', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS - 1; attempt += 1) {
        act(() => {
          harness.peers[harness.peers.length - 1].emit('onError', new Error('ICE failed'));
        });
        await act(async () => {
          vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
        });
      }

      act(() => {
        harness.peers[harness.peers.length - 1].emit('onConnected');
      });
      expect(result.current.peerRetries.has('zed')).toBe(false);

      act(() => {
        harness.peers[harness.peers.length - 1].emit('onError', new Error('ICE failed'));
      });
      await act(async () => {
        vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
      });

      expect(result.current.peers.has('zed')).toBe(true);
    });

    test('drops a participant who left and does not dial them again', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });
      act(() => {
        publishRoster(['self']);
      });

      expect(result.current.peers.has('zed')).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
      });

      expect(harness.peers.length).toBe(1);
    });

    // A user stuck at their retry ceiling must not hold a MAX_PEERS slot, or one
    // unreachable participant starves everyone still trying to connect.
    test('an exhausted participant does not consume a peer slot', async () => {
      const result = await joinRoom('aaa');

      act(() => {
        publishRoster(['aaa', 'b']);
      });

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
        act(() => {
          harness.peers[harness.peers.length - 1].emit('onError', new Error('ICE failed'));
        });
        await act(async () => {
          vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
        });
      }

      act(() => {
        publishRoster(['aaa', 'b', 'c', 'd', 'e', 'f']);
      });

      expect(result.current.peers.size).toBe(MAX_PEERS);
      expect(result.current.peers.has('b')).toBe(false);
    });

    // A participant at their retry ceiling is not in `peers`, so the prune loop
    // cannot reach them. If their spent budget outlives them, rejoining the room
    // never gets them dialled again.
    test('forgets the retry budget of a participant who left', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
        act(() => {
          harness.peers[harness.peers.length - 1].emit('onError', new Error('ICE failed'));
        });
        await act(async () => {
          vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
        });
      }
      expect(result.current.peers.has('zed')).toBe(false);

      act(() => {
        publishRoster(['self']);
      });
      act(() => {
        publishRoster(['self', 'zed']);
      });

      expect(result.current.peers.has('zed')).toBe(true);
    });

    // `onChildAdded` replays every queued offer the instant it binds. An offer
    // accepted before the roster is known is accepted from anyone, and answering
    // one attaches the local camera and mic — so a stranger who left an offer in
    // the queue would receive them. Binding must wait for the roster.
    test('does not start listening until the roster is known', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });
      expect(firebaseSignaling.listen).not.toHaveBeenCalled();

      act(() => {
        publishRoster(['self']);
      });

      expect(firebaseSignaling.listen).toHaveBeenCalledTimes(1);
      expect(result.current.localStream).not.toBeNull();
    });

    test('binds signalling once, not on every roster update', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      await joinRoom();

      act(() => {
        publishRoster(['self']);
      });
      act(() => {
        publishRoster(['self', 'zed']);
      });

      expect(firebaseSignaling.listen).toHaveBeenCalledTimes(1);
    });

    // Signalling rules let any authenticated user push an offer into anyone's
    // queue, and `from` is client-supplied.
    test('ignores an offer from someone who is not on the roster', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const result = await joinRoom();

      act(() => {
        publishRoster(['self']);
      });
      const onSignal = vi.mocked(firebaseSignaling.listen).mock.calls[0][0];

      act(() => {
        onSignal({ type: 'offer', from: 'intruder', sdp: 'v=0', timestamp: 1 });
      });

      expect(result.current.peers.size).toBe(0);
    });

    // A roster listener surviving cleanup would keep reconciling into a torn-down
    // store, and the sidebar can be closed and reopened repeatedly.
    test('detaches the roster listener on cleanup', async () => {
      const { off } = await import('firebase/database');
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });
      vi.mocked(off).mockClear();

      act(() => {
        result.current.cleanup();
      });

      expect(off).toHaveBeenCalled();
    });

    test('stops reconciling after cleanup', async () => {
      const result = await joinRoom();

      act(() => {
        publishRoster(['self', 'zed']);
      });
      act(() => {
        result.current.cleanup();
      });

      await act(async () => {
        vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
      });

      expect(harness.peers.length).toBe(1);
    });
  });

  describe('Incoming signals', () => {
    async function joinAndListen(userId = 'self', roster = [userId]) {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const { result } = renderHook(() => useVideoCallStore());
      await act(async () => {
        await result.current.initialize('test-room', userId);
      });
      act(() => {
        publishRoster(roster);
      });
      return { result, onSignal: vi.mocked(firebaseSignaling.listen).mock.calls[0][0] };
    }

    // Perfect negotiation needs exactly one polite peer per pair, and the pair has
    // to agree on which without exchanging a message.
    test('makes the higher user id the polite side of every pair', async () => {
      await joinAndListen('self', ['self', 'aaa', 'zed']);

      const polite = new Map(
        harness.peers.map((peer) => [peer.options.label, peer.options.polite])
      );

      expect(polite.get('aaa')).toBe(true);
      expect(polite.get('zed')).toBe(false);
    });

    // Their offer can arrive while we are backing off from a failed attempt, when
    // the roster still lists them but we hold no connection.
    test('opens a connection for an offer from a participant we are not dialling', async () => {
      const { result, onSignal } = await joinAndListen('self', ['self', 'zed']);
      act(() => {
        harness.peers[0].emit('onError', new Error('ICE failed'));
      });
      expect(result.current.peers.has('zed')).toBe(false);

      act(() => {
        onSignal({ type: 'offer', from: 'zed', sdp: 'v=0 their offer', timestamp: 1 });
      });

      expect(result.current.peers.has('zed')).toBe(true);
      expect(harness.peers).toHaveLength(2);
      expect(harness.peers[1].accept).toHaveBeenCalledWith({
        type: 'offer',
        sdp: 'v=0 their offer',
      });
    });

    test.each([
      [
        'an answer',
        { type: 'answer' as const, sdp: 'v=0 their answer' },
        { type: 'answer', sdp: 'v=0 their answer' },
      ],
      [
        'a candidate',
        { type: 'ice-candidate' as const, candidate: { candidate: 'candidate:1 1 udp' } },
        { type: 'candidate', candidate: { candidate: 'candidate:1 1 udp' } },
      ],
    ])('hands %s for a live peer straight to it', async (_label, incoming, expected) => {
      const { result, onSignal } = await joinAndListen('self', ['self', 'zed']);

      act(() => {
        onSignal({ from: 'zed', timestamp: 1, ...incoming });
      });

      expect(harness.peers[0].accept).toHaveBeenCalledWith(expected);
      expect(harness.peers).toHaveLength(1);
      expect(result.current.peers.size).toBe(1);
    });

    // Only an offer opens a connection. An answer names a negotiation we never
    // started, so there is nothing for it to complete.
    test('does not open a connection for an answer', async () => {
      const { result, onSignal } = await joinAndListen('self', ['self', 'zed']);
      act(() => {
        harness.peers[0].emit('onError', new Error('ICE failed'));
      });

      act(() => {
        onSignal({ type: 'answer', from: 'zed', sdp: 'v=0 stray answer', timestamp: 1 });
      });

      expect(result.current.peers.size).toBe(0);
      expect(harness.peers).toHaveLength(1);
    });

    test('ignores a signal it cannot make sense of', async () => {
      const { result, onSignal } = await joinAndListen('self', ['self', 'zed']);

      act(() => {
        onSignal({ type: 'offer', from: 'zed', timestamp: 1 });
      });

      expect(harness.peers[0].accept).not.toHaveBeenCalled();
      expect(result.current.peers.size).toBe(1);
    });
  });

  describe('Disconnect Call', () => {
    test('should stop all tracks and set isCallActive to false', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      expect(result.current.isCallActive).toBe(true);

      act(() => {
        result.current.disconnectCall();
      });

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(result.current.localStream).toBeNull();
      expect(result.current.isCallActive).toBe(false);
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isVideoOff).toBe(false);
    });

    test('should not throw if disconnectCall called without active stream', () => {
      const { result } = renderHook(() => useVideoCallStore());

      expect(() => {
        act(() => {
          result.current.disconnectCall();
        });
      }).not.toThrow();
    });

    test('should reset mute and video states when disconnecting', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.toggleMute();
        result.current.toggleVideo();
      });

      expect(result.current.isMuted).toBe(true);
      expect(result.current.isVideoOff).toBe(true);

      act(() => {
        result.current.disconnectCall();
      });

      expect(result.current.isMuted).toBe(false);
      expect(result.current.isVideoOff).toBe(false);
    });
  });

  describe('Reconnect Call', () => {
    test('should get new media stream and set isCallActive to true', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.disconnectCall();
      });

      expect(result.current.isCallActive).toBe(false);

      const newMockStream = {
        getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
        getVideoTracks: vi.fn(() => [mockVideoTrack]),
        getAudioTracks: vi.fn(() => [mockAudioTrack]),
      } as unknown as MediaStream;

      (navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce(newMockStream);

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      expect(result.current.localStream).toBe(newMockStream);
      expect(result.current.isCallActive).toBe(true);
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isVideoOff).toBe(false);
    });

    // Hanging up stops the local tracks but leaves the peer connections standing.
    // Without pushing the fresh tracks onto those senders, the remote side keeps
    // receiving dead media and the caller sees only their own preview.
    test('pushes the fresh tracks onto peers that are still connected', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });
      act(() => {
        publishRoster(['self', 'zed']);
      });
      const [peer] = harness.peers;

      act(() => {
        result.current.disconnectCall();
      });

      const freshVideo = {
        stop: vi.fn(),
        kind: 'video',
        enabled: true,
      } as unknown as MediaStreamTrack;
      const freshAudio = {
        stop: vi.fn(),
        kind: 'audio',
        enabled: true,
      } as unknown as MediaStreamTrack;
      const freshStream = new MediaStream([freshVideo, freshAudio] as any);
      (navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce(freshStream);

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(peer.replaceLocalTracks).toHaveBeenCalledWith(freshStream);
    });

    test('does not touch peers that were already destroyed', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'self');
      });
      act(() => {
        publishRoster(['self', 'zed']);
      });
      const [peer] = harness.peers;
      peer.closed = true;

      act(() => {
        result.current.disconnectCall();
      });

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(peer.replaceLocalTracks).not.toHaveBeenCalled();
    });

    test('should not reconnect if not initialized', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(result.current.localStream).toBeNull();
      expect(result.current.isCallActive).toBe(false);
    });

    test('should handle getUserMedia errors during reconnect', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.disconnectCall();
      });

      const error = new DOMException('Permission denied', 'NotAllowedError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(result.current.localStream).toBeNull();
      expect(result.current.isCallActive).toBe(false);
      expect(result.current.error).toEqual({
        type: 'NotAllowedError',
        message: 'videoCall.errors.permissionDenied',
      });
    });
  });

  describe('Error Handling', () => {
    test('should set error for NotFoundError', async () => {
      const error = new DOMException('Device not found', 'NotFoundError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      expect(result.current.error).toEqual({
        type: 'NotFoundError',
        message: 'videoCall.errors.deviceNotFound',
      });
    });

    test('should set error for NotReadableError', async () => {
      const error = new DOMException('Device in use', 'NotReadableError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      expect(result.current.error).toEqual({
        type: 'NotReadableError',
        message: 'videoCall.errors.deviceInUse',
      });
    });

    test('should set error for OverconstrainedError', async () => {
      const error = new DOMException('Constraints not satisfied', 'OverconstrainedError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      expect(result.current.error).toEqual({
        type: 'OverconstrainedError',
        message: 'videoCall.errors.constraintsNotSatisfied',
      });
    });

    test('should set error for unknown errors', async () => {
      const error = new Error('Unknown error');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      expect(result.current.error).toEqual({
        type: 'Unknown',
        message: 'videoCall.errors.unknown',
      });
    });

    test('should clear error with clearError', async () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    test('should clear error when initialize succeeds', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      // First, force an error by making getUserMedia reject
      const error = new DOMException('Permission denied', 'NotAllowedError');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      // Verify error was set
      expect(result.current.error).not.toBeNull();

      // Now mock getUserMedia to resolve successfully
      (navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce(mockMediaStream);

      // Call initialize again - should succeed and clear the error
      await act(async () => {
        await result.current.initialize('test-room', 'test-user');
      });

      // Verify error was cleared on successful initialization
      expect(result.current.error).toBeNull();
    });
  });

  describe('Publishing our own media state', () => {
    test('claims the roster slot with the media it is about to publish', async () => {
      await initialized();

      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      expect(firebaseSignaling.claim).toHaveBeenCalledWith('test-room', 'test-user-id', {
        cam: 'on',
        mic: 'on',
      });
    });

    test('claims with cam none when the device yields no video track', async () => {
      const audioOnly = {
        getTracks: vi.fn(() => [mockAudioTrack]),
        getVideoTracks: vi.fn(() => []),
        getAudioTracks: vi.fn(() => [mockAudioTrack]),
      } as unknown as MediaStream;
      (navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce(audioOnly);

      await initialized();

      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      expect(firebaseSignaling.claim).toHaveBeenCalledWith(
        'test-room',
        'test-user-id',
        expect.objectContaining({ cam: 'none' })
      );
    });

    test('publishes the new mic state when muting', async () => {
      const result = await initialized();

      act(() => {
        result.current.toggleMute();
      });

      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      expect(firebaseSignaling.publishMediaState).toHaveBeenCalledWith({
        cam: 'on',
        mic: 'off',
      });
      expect(mockAudioTrack.enabled).toBe(false);
      // Disabled, never stopped — see toggleMute.
      expect(mockAudioTrack.stop).not.toHaveBeenCalled();
    });

    test('stops the camera track when turning video off, so the device light goes out', async () => {
      const result = await initialized();

      act(() => {
        result.current.toggleVideo();
      });

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(result.current.isVideoOff).toBe(true);
      expect(result.current.localStream?.getVideoTracks()).toHaveLength(0);

      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      expect(firebaseSignaling.publishMediaState).toHaveBeenCalledWith({
        cam: 'off',
        mic: 'on',
      });
    });

    test('stops sending video to every peer when turning video off', async () => {
      const result = await initialized();
      act(() => {
        publishRoster(['test-user-id', 'peer-a', 'peer-b']);
      });
      expect(harness.peers).toHaveLength(2);

      act(() => {
        result.current.toggleVideo();
      });

      harness.peers.forEach((peer) => {
        expect(peer.setVideoTrack).toHaveBeenCalledWith(null);
      });
    });

    test('re-acquires video only when turning the camera back on', async () => {
      const result = await initialized();
      act(() => {
        result.current.toggleVideo();
      });

      const freshVideoTrack = { stop: vi.fn(), kind: 'video', enabled: true };
      (navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce({
        getTracks: () => [freshVideoTrack],
        getVideoTracks: () => [freshVideoTrack],
        getAudioTracks: () => [],
      });

      await act(async () => {
        await result.current.toggleVideo();
      });

      // Video only — re-acquiring audio would take the mic down with it.
      const lastCall = (navigator.mediaDevices.getUserMedia as any).mock.calls.at(-1)[0];
      expect(lastCall).not.toHaveProperty('audio');
      expect(lastCall).toHaveProperty('video');

      expect(result.current.isVideoOff).toBe(false);
      expect(result.current.localStream?.getVideoTracks()).toEqual([freshVideoTrack]);
      expect(result.current.localStream?.getAudioTracks()).toEqual([mockAudioTrack]);
    });

    test('publishes cam hidden when the page is backgrounded, without releasing the camera', async () => {
      const result = await initialized();

      act(() => {
        result.current.handleVisibilityChange(true);
      });

      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      expect(firebaseSignaling.publishMediaState).toHaveBeenCalledWith({
        cam: 'hidden',
        mic: 'on',
      });
      expect(mockVideoTrack.enabled).toBe(false);
      // Backgrounding is transient — the device stays held.
      expect(mockVideoTrack.stop).not.toHaveBeenCalled();

      act(() => {
        result.current.handleVisibilityChange(false);
      });

      expect(firebaseSignaling.publishMediaState).toHaveBeenLastCalledWith({
        cam: 'on',
        mic: 'on',
      });
      expect(mockVideoTrack.enabled).toBe(true);
    });

    test('backgrounding does not resurrect a camera the user turned off', async () => {
      const result = await initialized();
      act(() => {
        result.current.toggleVideo();
      });

      act(() => {
        result.current.handleVisibilityChange(true);
      });
      act(() => {
        result.current.handleVisibilityChange(false);
      });

      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      expect(firebaseSignaling.publishMediaState).toHaveBeenLastCalledWith({
        cam: 'off',
        mic: 'on',
      });
    });
  });

  describe('Remote media state', () => {
    test('reads published flags off the roster', async () => {
      const result = await initialized();

      act(() => {
        publishRosterEntries({
          'test-user-id': {},
          'peer-a': { cam: 'off', mic: 'on' },
        });
      });

      expect(result.current.mediaStates.get('peer-a')).toEqual({ cam: 'off', mic: 'on' });
    });

    test('leaves flags unknown for a peer running an older client', async () => {
      const result = await initialized();

      act(() => {
        publishRosterEntries({ 'test-user-id': {}, 'peer-a': {} });
      });

      // Unknown, not "on" — an old client that muted would otherwise be shown as live.
      expect(result.current.mediaStates.get('peer-a')).toEqual({});
    });

    test('discards values it does not recognise', async () => {
      const result = await initialized();

      act(() => {
        publishRosterEntries({
          'test-user-id': {},
          'peer-a': { cam: 'sideways', mic: 42 },
        });
      });

      expect(result.current.mediaStates.get('peer-a')).toEqual({});
    });

    test('forgets a peer that leaves the roster', async () => {
      const result = await initialized();
      act(() => {
        publishRosterEntries({ 'test-user-id': {}, 'peer-a': { cam: 'off' } });
      });

      act(() => {
        publishRosterEntries({ 'test-user-id': {} });
      });

      expect(result.current.mediaStates.has('peer-a')).toBe(false);
    });
  });

  describe('Peer connection state', () => {
    async function withPeer() {
      const { result } = renderHook(() => useVideoCallStore());
      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });
      act(() => {
        publishRoster(['test-user-id', 'peer-a']);
      });
      return { result, peer: harness.peers[0] };
    }

    test('records the transport connection state per peer', async () => {
      const { result, peer } = await withPeer();

      act(() => {
        peer.emit('onConnectionStateChange', 'connected');
      });

      expect(result.current.peers.get('peer-a')?.connectionState).toBe('connected');
    });

    test('marks a peer reconnecting only once disconnected outlives the grace period', async () => {
      const { result, peer } = await withPeer();

      act(() => {
        peer.emit('onConnectionStateChange', 'disconnected');
      });

      // `disconnected` is explicitly transient in the spec and usually heals on its
      // own; surfacing it immediately produces a banner that flickers on any flaky link.
      expect(result.current.peers.get('peer-a')?.reconnecting).toBe(false);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.peers.get('peer-a')?.reconnecting).toBe(true);
    });

    test('a link that heals inside the grace period never reports reconnecting', async () => {
      const { result, peer } = await withPeer();

      act(() => {
        peer.emit('onConnectionStateChange', 'disconnected');
      });
      act(() => {
        vi.advanceTimersByTime(1000);
        peer.emit('onConnectionStateChange', 'connected');
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.peers.get('peer-a')?.reconnecting).toBe(false);
    });

    test('retryPeer clears an exhausted budget and dials again', async () => {
      const { result, peer } = await withPeer();

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        act(() => {
          harness.peers.at(-1)?.emit('onError', new Error('boom'));
        });
        act(() => {
          vi.advanceTimersByTime(RETRY_MAX_MS + 1);
          result.current.reconcilePeers();
        });
      }
      expect(peer.closed).toBe(true);
      const dialledBeforeRetry = harness.peers.length;
      expect(result.current.peers.has('peer-a')).toBe(false);

      act(() => {
        result.current.retryPeer('peer-a');
      });

      expect(result.current.peerRetries.has('peer-a')).toBe(false);
      expect(harness.peers.length).toBeGreaterThan(dialledBeforeRetry);
    });
  });
});
