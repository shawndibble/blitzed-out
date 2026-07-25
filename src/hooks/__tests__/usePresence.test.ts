import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { setMyPresenceMock, startPresenceHeartbeatMock, removeMyPresenceMock } = vi.hoisted(() => ({
  setMyPresenceMock: vi.fn(),
  startPresenceHeartbeatMock: vi.fn(),
  removeMyPresenceMock: vi.fn(),
}));

vi.mock('@/services/roomPresence', () => ({
  setMyPresence: setMyPresenceMock,
  startPresenceHeartbeat: startPresenceHeartbeatMock,
  removeMyPresence: removeMyPresenceMock,
}));

vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({ user: { displayName: 'Tester' } }),
}));

vi.mock('@/hooks/useOnlineStatus', () => ({ default: () => true }));

import usePresence from '../usePresence';

describe('usePresence removeOnDisconnect wiring', () => {
  beforeEach(() => {
    setMyPresenceMock.mockReset();
    setMyPresenceMock.mockResolvedValue(undefined);
    startPresenceHeartbeatMock.mockReset();
    startPresenceHeartbeatMock.mockReturnValue(() => undefined);
  });

  it('forces removeOnDisconnect true for the PUBLIC room regardless of roomRealtime', () => {
    renderHook(() => usePresence('PUBLIC'));

    expect(setMyPresenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ removeOnDisconnect: true })
    );
  });

  it('PUBLIC still forces realtime even when roomRealtime is explicitly false', () => {
    renderHook(() => usePresence('PUBLIC', false));

    expect(setMyPresenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ removeOnDisconnect: true })
    );
  });

  it('defaults removeOnDisconnect to false for a private room with no roomRealtime passed', () => {
    renderHook(() => usePresence('ABCD'));

    expect(setMyPresenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ removeOnDisconnect: false })
    );
  });

  it('honors roomRealtime true for a private room', () => {
    renderHook(() => usePresence('ABCD', true));

    expect(setMyPresenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ removeOnDisconnect: true })
    );
  });

  it('honors roomRealtime false for a private room', () => {
    renderHook(() => usePresence('ABCD', false));

    expect(setMyPresenceMock).toHaveBeenCalledWith(
      expect.objectContaining({ removeOnDisconnect: false })
    );
  });
});
