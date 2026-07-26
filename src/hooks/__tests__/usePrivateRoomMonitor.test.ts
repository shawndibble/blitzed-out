import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import usePrivateRoomMonitor from '../usePrivateRoomMonitor';
import { importActions } from '@/services/dexieActionImport';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';

const updateGameBoardTilesMock = vi.fn();

vi.mock('@/hooks/useGameBoard', () => ({
  default: () => updateGameBoardTilesMock,
}));

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ user: { uid: 'me', displayName: 'Me' } }),
}));

const roomMessage = {
  id: 'm1',
  uid: 'other',
  text: '',
  displayName: 'Other',
  timestamp: new Date().toISOString(),
  type: 'room' as const,
  settings: JSON.stringify({
    gameMode: 'online',
    soloPlay: false,
    roomTileCount: 60,
    roomDice: '1d6',
    roomBackgroundURL: '',
  }),
  boardSize: 60,
  gameMode: 'online' as const,
  roomTileCount: 60,
};

vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({ messages: [roomMessage], isLoading: false }),
}));

const emptyCustomTiles: unknown[] = [];
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => emptyCustomTiles,
}));

vi.mock('@/services/dexieActionImport', () => ({
  importActions: vi.fn(),
}));

vi.mock('@/services/gameSettingsMessage', () => ({
  default: vi.fn(),
}));

const stableSettings = { room: 'ABCDE', gameMode: 'online', soloPlay: false };
const updateSettingsMock = vi.fn();
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [stableSettings, updateSettingsMock],
  useContentMode: () => 'online',
  deriveContentMode: (gameMode?: string) => (gameMode === 'local' ? 'local' : 'online'),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'en' } }),
}));

describe('usePrivateRoomMonitor — peer-triggered rebuild message', () => {
  beforeEach(() => {
    // vitest.ci.config.ts's clearMocks/restoreMocks wipe implementations set
    // at module scope before the first test runs — reconfigure fresh each time.
    updateGameBoardTilesMock.mockResolvedValue({
      gameMode: 'online',
      newBoard: [{ title: 'Start', description: '' }],
    });
    vi.mocked(importActions).mockResolvedValue({});
    vi.mocked(sendGameSettingsMessage).mockResolvedValue(undefined as never);
  });

  it('builds the rebuilt-board message actionsList from the local bundle for With Others', async () => {
    // gameBoard length (40) differs from the incoming roomTileCount (60) so
    // the "peer changed settings" rebuild path fires.
    const existingGameBoard = Array.from({ length: 40 }, () => ({ title: 't', description: '' }));

    renderHook(() => usePrivateRoomMonitor('ABCDE', existingGameBoard as any));

    await waitFor(() => expect(sendGameSettingsMessage).toHaveBeenCalled());

    expect(importActions).toHaveBeenCalledWith('en', 'local');
  });
});
