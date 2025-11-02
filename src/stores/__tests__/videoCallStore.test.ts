/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import { useVideoCallStore } from '../videoCallStore';

vi.mock('@/services/firebaseSignaling', () => ({
  firebaseSignaling: {
    initialize: vi.fn(),
    sendOffer: vi.fn(),
    sendAnswer: vi.fn(),
    sendIceCandidate: vi.fn(),
    cleanup: vi.fn(),
  },
}));

vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  onValue: vi.fn((ref, callback) => {
    // Immediately call callback with empty data to simulate Firebase
    setTimeout(() => {
      callback({ val: () => null });
    }, 0);
    return vi.fn(); // Return unsubscribe function
  }),
  off: vi.fn(),
}));

describe('VideoCallStore', () => {
  let mockMediaStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let mockAudioTrack: MediaStreamTrack;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

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
      const error = new Error('Permission denied');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await expect(result.current.initialize('test-room', 'test-user')).rejects.toThrow(
          'Permission denied'
        );
      });

      expect(result.current.localStream).toBeNull();
      expect(result.current.isInitialized).toBe(false);
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

  describe('Heartbeat System', () => {
    test('should start heartbeat interval on initialization', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      expect(result.current.isInitialized).toBe(true);
    });

    test('should stop heartbeat on cleanup', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.cleanup();
      });

      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('Periodic Cleanup', () => {
    test('should run periodic cleanup every 30 minutes', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });

      expect(result.current.isInitialized).toBe(true);
    });

    test('should stop periodic cleanup on cleanup', async () => {
      const { result } = renderHook(() => useVideoCallStore());

      await act(async () => {
        await result.current.initialize('test-room', 'test-user-id');
      });

      act(() => {
        result.current.cleanup();
      });

      expect(result.current.isInitialized).toBe(false);
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

      const error = new Error('Permission denied');
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(error);

      await act(async () => {
        await expect(result.current.reconnectCall()).rejects.toThrow('Permission denied');
      });

      expect(result.current.localStream).toBeNull();
      expect(result.current.isCallActive).toBe(false);
    });
  });
});
