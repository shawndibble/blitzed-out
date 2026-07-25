import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// react-router-dom's useParams is globally mocked (setupTests.ts) to { id: 'TEST' }.

const { usePresenceMock, useSettingsMock } = vi.hoisted(() => ({
  usePresenceMock: vi.fn(),
  useSettingsMock: vi.fn(),
}));
vi.mock('@/hooks/usePresence', () => ({ default: usePresenceMock }));
vi.mock('@/stores/settingsStore', () => ({ useSettings: () => useSettingsMock() }));

// Keep gameBoard undefined so isRoomReady() short-circuits Room into its
// early "not ready" branch — everything below that gate (GameBoard,
// MessageList, RollButton, VideoCall, ...) never renders or executes.
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => undefined }));

vi.mock('@/components/GameSettingsDialog', () => ({ default: () => null }));
vi.mock('@/views/Navigation', () => ({ default: () => null }));
vi.mock('@/hooks/useWakeLock', () => ({ default: vi.fn(), useWakeLock: vi.fn() }));
vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: () => ({
    localPlayers: [],
    sessionSettings: null,
    currentPlayerIndex: -1,
    isLocalPlayerRoom: false,
  }),
}));
vi.mock('@/hooks/useTurnTransition', () => ({
  useTurnTransition: () => ({
    showTransition: false,
    transitionPlayerName: '',
    isTransitionForCurrentUser: false,
    handleTransitionComplete: vi.fn(),
  }),
}));
vi.mock('@/hooks/usePlayerMove', () => ({ default: () => ({ tile: undefined }) }));
vi.mock('@/hooks/useHybridPlayerList', () => ({ default: () => [] }));
vi.mock('@/hooks/usePrivateRoomMonitor', () => ({ default: () => ({ roller: undefined }) }));
vi.mock('@/hooks/useUrlImport', () => ({
  default: () => [undefined, vi.fn(), false],
}));
vi.mock('@/hooks/useUrlPackImport', () => ({
  default: () => ({ pendingPack: undefined, failed: false, dismiss: vi.fn() }),
}));

import Room from '../index';

describe('Room presence wiring', () => {
  beforeEach(() => {
    usePresenceMock.mockReset();
  });

  it('passes settings.roomRealtime through to usePresence', () => {
    useSettingsMock.mockReturnValue([
      { gameMode: 'online', room: 'TEST', roomRealtime: false },
      vi.fn(),
    ]);

    render(<Room />);

    expect(usePresenceMock).toHaveBeenCalledWith('TEST', false);
  });

  it('passes roomRealtime: true through as well', () => {
    useSettingsMock.mockReturnValue([
      { gameMode: 'online', room: 'TEST', roomRealtime: true },
      vi.fn(),
    ]);

    render(<Room />);

    expect(usePresenceMock).toHaveBeenCalledWith('TEST', true);
  });
});
