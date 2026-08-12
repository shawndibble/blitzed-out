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
  useVideoCallStore,
} from '../videoCallStore';
import { MAX_PEERS } from '@/config/webrtc';

const harness = vi.hoisted(() => ({
  rosterListeners: [] as Array<(snapshot: { val: () => unknown }) => void>,
  peers: [] as any[],
}));

vi.mock('@/services/firebaseSignaling', () => ({
  firebaseSignaling: {
    initialize: vi.fn(),
    sendOffer: vi.fn(),
    sendAnswer: vi.fn(),
    sendIceCandidate: vi.fn(),
    heartbeat: vi.fn().mockResolvedValue(undefined),
    setPresent: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn(),
  },
}));

vi.mock('simple-peer', () => {
  class MockPeer {
    destroyed = false;
    signal = vi.fn();
    replaceTrack = vi.fn();
    addTrack = vi.fn();
    addStream = vi.fn();
    _pc = { iceConnectionState: 'new' };
    options: any;
    private handlers = new Map<string, Array<(...args: any[]) => void>>();

    constructor(options: any) {
      this.options = options;
      harness.peers.push(this);
    }

    on(event: string, handler: (...args: any[]) => void) {
      const existing = this.handlers.get(event) ?? [];
      this.handlers.set(event, [...existing, handler]);
      return this;
    }

    emit(event: string, ...args: any[]) {
      this.handlers.get(event)?.forEach((handler) => handler(...args));
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.emit('close');
    }
  }

  return { default: MockPeer };
});

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
  const value = Object.fromEntries(userIds.map((id) => [id, { status: 'online' }]));
  harness.rosterListeners.forEach((listener) => listener({ val: () => value }));
}

describe('VideoCallStore', () => {
  let mockMediaStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let mockAudioTrack: MediaStreamTrack;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    harness.rosterListeners.length = 0;
    harness.peers.length = 0;

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
    test('should toggle video track enabled state', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.toggleVideo();
      });

      expect(result.current.isVideoOff).toBe(true);
      expect(mockVideoTrack.enabled).toBe(false);

      act(() => {
        result.current.toggleVideo();
      });

      expect(result.current.isVideoOff).toBe(false);
      expect(mockVideoTrack.enabled).toBe(true);
    });

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

      expect(firebaseSignaling.initialize).toHaveBeenCalledTimes(1);
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

      expect(harness.peers[0].options.config.iceServers).toEqual(MINTED_ICE_SERVERS);
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
        firstAttempt.emit('error', new Error('ICE failed'));
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
        harness.peers[0].emit('iceStateChange', 'failed');
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
        harness.peers[0].emit('error', new Error('ICE failed'));
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
          peer.emit('error', new Error('ICE failed'));
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
          harness.peers[harness.peers.length - 1].emit('error', new Error('ICE failed'));
        });
        await act(async () => {
          vi.advanceTimersByTime(RETRY_MAX_MS + RECONCILE_INTERVAL_MS);
        });
      }

      act(() => {
        harness.peers[harness.peers.length - 1].emit('connect');
      });
      expect(result.current.peerRetries.has('zed')).toBe(false);

      act(() => {
        harness.peers[harness.peers.length - 1].emit('error', new Error('ICE failed'));
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
          harness.peers[harness.peers.length - 1].emit('error', new Error('ICE failed'));
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
          harness.peers[harness.peers.length - 1].emit('error', new Error('ICE failed'));
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

    // Signalling rules let any authenticated user push an offer into anyone's
    // queue, and `from` is client-supplied.
    test('ignores an offer from someone who is not on the roster', async () => {
      const { firebaseSignaling } = await import('@/services/firebaseSignaling');
      const result = await joinRoom();
      const onSignal = vi.mocked(firebaseSignaling.initialize).mock.calls[0][2];

      act(() => {
        publishRoster(['self']);
      });
      act(() => {
        onSignal({ type: 'offer', from: 'intruder', sdp: 'v=0', timestamp: 1 });
      });

      expect(result.current.peers.size).toBe(0);
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

      const freshVideo = { stop: vi.fn(), kind: 'video', enabled: true } as unknown as MediaStream;
      const freshAudio = { stop: vi.fn(), kind: 'audio', enabled: true } as unknown as MediaStream;
      const freshStream = new MediaStream([freshVideo, freshAudio] as any);
      (navigator.mediaDevices.getUserMedia as any).mockResolvedValueOnce(freshStream);

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(peer.replaceTrack).toHaveBeenCalledWith(mockVideoTrack, freshVideo, mockMediaStream);
      expect(peer.replaceTrack).toHaveBeenCalledWith(mockAudioTrack, freshAudio, mockMediaStream);
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
      peer.destroyed = true;

      act(() => {
        result.current.disconnectCall();
      });

      await act(async () => {
        await result.current.reconnectCall();
      });

      expect(peer.replaceTrack).not.toHaveBeenCalled();
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
});
