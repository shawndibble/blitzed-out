/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRef = vi.fn();
const mockSet = vi.fn();
const mockPush = vi.fn();
const mockOnValue = vi.fn();
const mockOff = vi.fn();
const mockOnDisconnect = vi.fn();
const mockGetDatabase = vi.fn();

vi.mock('firebase/database', () => ({
  getDatabase: () => mockGetDatabase(),
  ref: (...args: any[]) => mockRef(...args),
  set: (...args: any[]) => mockSet(...args),
  push: (...args: any[]) => mockPush(...args),
  onValue: (...args: any[]) => mockOnValue(...args),
  off: (...args: any[]) => mockOff(...args),
  onDisconnect: (...args: any[]) => mockOnDisconnect(...args),
}));

describe('firebaseSignaling', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockRef.mockReturnValue({ key: 'test-room' });
    mockSet.mockResolvedValue(undefined);
    mockPush.mockResolvedValue({ key: 'test-key' });
    mockOnDisconnect.mockReturnValue({
      remove: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(async () => {
    const { firebaseSignaling } = await import('../firebaseSignaling');
    firebaseSignaling.cleanup();
  });

  describe('initialize', () => {
    test('should create Firebase references', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';

      firebaseSignaling.initialize(roomId, userId, vi.fn());

      expect(mockRef).toHaveBeenCalled();
      expect(mockRef.mock.calls.some((call) => call[1]?.includes('video-calls'))).toBe(true);
    });

    test('should set user presence', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';

      firebaseSignaling.initialize(roomId, userId, vi.fn());

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'online',
        })
      );
    });

    test('should set onDisconnect handler', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';

      firebaseSignaling.initialize(roomId, userId, vi.fn());

      expect(mockOnDisconnect).toHaveBeenCalled();
    });

    test('should listen for signals', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';
      const onSignal = vi.fn();

      firebaseSignaling.initialize(roomId, userId, onSignal);

      expect(mockOnValue).toHaveBeenCalled();
    });
  });

  describe('sendOffer', () => {
    test('should send offer to Firebase', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';
      const targetUserId = 'user-456';
      const offer = { type: 'offer' as const, sdp: 'test-sdp' };

      firebaseSignaling.initialize(roomId, userId, vi.fn());
      await firebaseSignaling.sendOffer(targetUserId, offer);

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'offer',
          sdp: 'test-sdp',
          from: userId,
        })
      );
    });

    test('should throw error if not initialized', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const targetUserId = 'user-456';
      const offer = { type: 'offer' as const, sdp: 'test-sdp' };

      await expect(firebaseSignaling.sendOffer(targetUserId, offer)).rejects.toThrow(
        'Signaling not initialized'
      );
    });
  });

  describe('sendAnswer', () => {
    test('should send answer to Firebase', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';
      const targetUserId = 'user-456';
      const answer = { type: 'answer' as const, sdp: 'test-sdp' };

      firebaseSignaling.initialize(roomId, userId, vi.fn());
      await firebaseSignaling.sendAnswer(targetUserId, answer);

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'answer',
          sdp: 'test-sdp',
          from: userId,
        })
      );
    });

    test('should throw error if not initialized', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const targetUserId = 'user-456';
      const answer = { type: 'answer' as const, sdp: 'test-sdp' };

      await expect(firebaseSignaling.sendAnswer(targetUserId, answer)).rejects.toThrow(
        'Signaling not initialized'
      );
    });
  });

  describe('sendIceCandidate', () => {
    test('should send ICE candidate to Firebase', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';
      const targetUserId = 'user-456';
      const candidate = { candidate: 'test-candidate', sdpMLineIndex: 0 };

      firebaseSignaling.initialize(roomId, userId, vi.fn());
      await firebaseSignaling.sendIceCandidate(targetUserId, candidate);

      expect(mockPush).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'ice-candidate',
          candidate,
          from: userId,
        })
      );
    });

    test('should throw error if not initialized', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const targetUserId = 'user-456';
      const candidate = { candidate: 'test-candidate', sdpMLineIndex: 0 };

      await expect(firebaseSignaling.sendIceCandidate(targetUserId, candidate)).rejects.toThrow(
        'Signaling not initialized'
      );
    });
  });

  describe('cleanup', () => {
    test('should remove Firebase listeners', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';

      firebaseSignaling.initialize(roomId, userId, vi.fn());
      firebaseSignaling.cleanup();

      expect(mockOff).toHaveBeenCalled();
    });

    test('should not throw if cleanup called before initialization', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      expect(() => {
        firebaseSignaling.cleanup();
      }).not.toThrow();
    });
  });
});
