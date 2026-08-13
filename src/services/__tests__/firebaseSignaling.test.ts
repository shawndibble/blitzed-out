/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRef = vi.fn();
const mockSet = vi.fn();
const mockPush = vi.fn();
const mockOnValue = vi.fn();
const mockOnChildAdded = vi.fn();
const mockOff = vi.fn();
const mockOnDisconnect = vi.fn();
const mockGetDatabase = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const SERVER_TIME = { '.sv': 'timestamp' };

vi.mock('firebase/database', () => ({
  getDatabase: () => mockGetDatabase(),
  ref: (...args: any[]) => mockRef(...args),
  set: (...args: any[]) => mockSet(...args),
  push: (...args: any[]) => mockPush(...args),
  onValue: (...args: any[]) => mockOnValue(...args),
  onChildAdded: (...args: any[]) => mockOnChildAdded(...args),
  off: (...args: any[]) => mockOff(...args),
  onDisconnect: (...args: any[]) => mockOnDisconnect(...args),
  serverTimestamp: () => SERVER_TIME,
  get: (...args: any[]) => mockGet(...args),
  update: (...args: any[]) => mockUpdate(...args),
}));

describe('firebaseSignaling', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockRef.mockImplementation((_db: unknown, path: string) => ({ key: 'test-room', path }));
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockGet.mockResolvedValue({ val: () => 1_700_000_000_000 });
    mockPush.mockResolvedValue({ key: 'test-key' });
    mockOnDisconnect.mockReturnValue({
      remove: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn().mockResolvedValue(undefined),
    });
  });

  const writesTo = (path: string) => mockSet.mock.calls.filter(([target]) => target?.path === path);

  afterEach(async () => {
    const { firebaseSignaling } = await import('../firebaseSignaling');
    firebaseSignaling.cleanup();
  });

  describe('initialize', () => {
    test('should create Firebase references', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());

      expect(mockRef).toHaveBeenCalled();
      expect(mockRef.mock.calls.some((call) => call[1]?.includes('video-calls'))).toBe(true);
    });

    test('should set user presence', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());

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

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());

      expect(mockOnDisconnect).toHaveBeenCalled();
    });

    test('should listen for signals', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const roomId = 'test-room';
      const userId = 'user-123';
      const onSignal = vi.fn();

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(onSignal);

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

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());
      await firebaseSignaling.sendOffer(targetUserId, offer);

      expect(mockPush).toHaveBeenCalledWith(
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

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());
      await firebaseSignaling.sendAnswer(targetUserId, answer);

      expect(mockPush).toHaveBeenCalledWith(
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

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());
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

      await firebaseSignaling.claim(roomId, userId, { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());
      firebaseSignaling.cleanup();

      expect(mockOff).toHaveBeenCalled();
    });

    test('should not throw if cleanup called before initialization', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      expect(() => {
        firebaseSignaling.cleanup();
      }).not.toThrow();
    });

    // onDisconnect only fires when the socket drops. Leaving the call keeps the
    // socket alive, so without an explicit removal the departed user stays on the
    // roster and every remaining peer burns a MAX_PEERS slot dialling a phantom.
    test('removes the presence node so the user stops occupying a roster slot', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());
      firebaseSignaling.cleanup();

      expect(writesTo('video-calls/test-room/users/user-123')).toContainEqual([
        expect.anything(),
        null,
      ]);
    });

    test('cancels the onDisconnect removal so it cannot fire against a rejoined session', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      const cancel = vi.fn().mockResolvedValue(undefined);
      mockOnDisconnect.mockReturnValue({ remove: vi.fn().mockResolvedValue(undefined), cancel });

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      firebaseSignaling.listen(vi.fn());
      firebaseSignaling.cleanup();

      expect(cancel).toHaveBeenCalled();
    });
  });

  describe('heartbeat', () => {
    // The scheduled cleanup function prunes roster entries by staleness. Without a
    // heartbeat the only timestamp is the join time, so anyone in a long call gets
    // evicted from their own room.
    // Staleness is judged by other clients and by the server sweep, so a device
    // with a skewed clock would be read as a ghost by everyone with nothing to
    // correct it. The server's clock is the only one all parties share.
    test('stamps lastSeen with server time, not the device clock', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      mockSet.mockClear();
      await firebaseSignaling.heartbeat();

      const [[, value]] = writesTo('video-calls/test-room/users/user-123');
      expect(value.lastSeen).toEqual(SERVER_TIME);
    });

    // A socket blip fires the armed onDisconnect and deletes the node. Writing
    // lastSeen alone would then fail the rule's hasChildren check, leaving the
    // user invisible on every roster for the rest of the call.
    test('rewrites the whole presence node so a deleted one is restored', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      mockSet.mockClear();
      await firebaseSignaling.heartbeat();

      const [[, value]] = writesTo('video-calls/test-room/users/user-123');
      expect(value).toEqual({
        joinedAt: expect.anything(),
        lastSeen: SERVER_TIME,
        status: 'online',
        cam: 'on',
        mic: 'on',
      });
    });

    // The heartbeat rewrites the whole node, so it has to carry the media flags too
    // — otherwise every toggle is silently reverted within 30 seconds.
    test('carries the latest published media state on every heartbeat', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      await firebaseSignaling.publishMediaState({ cam: 'off', mic: 'off' });
      mockSet.mockClear();
      await firebaseSignaling.heartbeat();

      const [[, value]] = writesTo('video-calls/test-room/users/user-123');
      expect(value).toMatchObject({ cam: 'off', mic: 'off' });
    });

    // A partial write, so a toggle landing next to a heartbeat cannot clobber
    // joinedAt and push this participant's apparent join time forward.
    test('publishes media state without rewriting the rest of the node', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      mockSet.mockClear();
      await firebaseSignaling.publishMediaState({ cam: 'off', mic: 'on' });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'video-calls/test-room/users/user-123' }),
        { cam: 'off', mic: 'on' }
      );
      expect(writesTo('video-calls/test-room/users/user-123')).toHaveLength(0);
    });

    // Rewriting the whole node every 30s would otherwise keep pushing the join
    // time forward, so it is read back once and reused.
    test('preserves the original joinedAt across heartbeats', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');

      await firebaseSignaling.claim('test-room', 'user-123', { cam: 'on', mic: 'on' });
      await firebaseSignaling.heartbeat();

      const writes = writesTo('video-calls/test-room/users/user-123');
      expect(writes[writes.length - 1][1].joinedAt).toBe(1_700_000_000_000);
    });

    // The service is a module singleton, so a prior test's claim would leave
    // presenceRef set and make this pass for the wrong reason.
    test('is a no-op before initialization', async () => {
      const { firebaseSignaling } = await import('../firebaseSignaling');
      firebaseSignaling.cleanup();
      mockSet.mockClear();

      await expect(firebaseSignaling.heartbeat()).resolves.toBeUndefined();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });
});
