import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitGameSettings, SubmitContext, SubmitDependencies } from '../gameSettingsOrchestrator';
import type { Settings } from '@/types/Settings';
import type { User } from '@/types';
import type { Message } from '@/types/Message';
import type { DBGameBoard } from '@/types/gameBoard';

const mockUser: User = { uid: 'user-1', displayName: 'Alice', isAnonymous: false } as User;

function makeFormData(overrides: Partial<Settings> = {}): Settings {
  return {
    displayName: 'Alice',
    room: 'PUBLIC',
    roomTileCount: 40,
    gameMode: 'online',
    boardUpdated: false,
    roomUpdated: false,
    selectedActions: {},
    ...overrides,
  } as Settings;
}

function makeCtx(overrides: Partial<SubmitContext> = {}): SubmitContext {
  return {
    user: mockUser,
    currentRoom: 'PUBLIC',
    currentRoomTileCount: 40,
    messages: [],
    gameBoard: undefined,
    customTiles: [],
    hasLocalPlayers: false,
    settingsSnapshot: makeFormData(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<SubmitDependencies> = {}): SubmitDependencies {
  return {
    updateUser: vi.fn().mockResolvedValue(mockUser),
    updateGameBoardTiles: vi.fn().mockResolvedValue({
      settingsBoardUpdated: true,
      gameMode: 'online',
      newBoard: [{ title: 'Tile 1', description: 'Do something' }],
    }),
    sendRoomSettingsFn: vi.fn().mockResolvedValue(undefined),
    upsertBoardFn: vi.fn().mockResolvedValue(1),
    sendGameSettingsFn: vi.fn().mockResolvedValue(undefined),
    createLocalSessionFn: vi.fn().mockResolvedValue(undefined),
    updateSettingsFn: vi.fn(),
    navigateFn: vi.fn(),
    translateFn: vi.fn((key) => key),
    recordGameStartFn: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('submitGameSettings', () => {
  let formData: Settings;
  let ctx: SubmitContext;
  let deps: SubmitDependencies;

  beforeEach(() => {
    vi.clearAllMocks();
    formData = makeFormData();
    ctx = makeCtx();
    deps = makeDeps();
  });

  describe('auth step', () => {
    it('returns early without calling later steps when updateUser returns null', async () => {
      deps.updateUser = vi.fn().mockResolvedValue(null);
      await submitGameSettings(formData, {}, ctx, deps);

      expect(deps.sendRoomSettingsFn).not.toHaveBeenCalled();
      expect(deps.upsertBoardFn).not.toHaveBeenCalled();
      expect(deps.sendGameSettingsFn).not.toHaveBeenCalled();
      expect(deps.updateSettingsFn).not.toHaveBeenCalled();
      expect(deps.navigateFn).not.toHaveBeenCalled();
    });

    it('calls updateUser with the displayName from formData', async () => {
      await submitGameSettings(makeFormData({ displayName: 'Bob' }), {}, ctx, deps);
      expect(deps.updateUser).toHaveBeenCalledWith('Bob');
    });
  });

  describe('room settings message', () => {
    it('does NOT send room settings message for a public room', async () => {
      await submitGameSettings(makeFormData({ room: 'PUBLIC' }), {}, ctx, deps);
      expect(deps.sendRoomSettingsFn).not.toHaveBeenCalled();
    });

    it('sends room settings message for a private room with no prior room message', async () => {
      const privateFormData = makeFormData({ room: 'MYROOM' });
      const privateCtx = makeCtx({ currentRoom: 'MYROOM', messages: [] });
      await submitGameSettings(privateFormData, {}, privateCtx, deps);
      expect(deps.sendRoomSettingsFn).toHaveBeenCalledWith(privateFormData, mockUser);
    });

    it('sends room settings message when roomUpdated flag is set', async () => {
      const privateFormData = makeFormData({ room: 'MYROOM', roomUpdated: true });
      const existingRoomMsg = { type: 'room', uid: 'user-1' } as Message;
      const privateCtx = makeCtx({ currentRoom: 'MYROOM', messages: [existingRoomMsg] });
      await submitGameSettings(privateFormData, {}, privateCtx, deps);
      expect(deps.sendRoomSettingsFn).toHaveBeenCalled();
    });

    it('does NOT send room settings message when one already exists and roomUpdated is false', async () => {
      const privateFormData = makeFormData({ room: 'MYROOM', roomUpdated: false });
      const existingRoomMsg = { type: 'room', uid: 'user-1' } as Message;
      const privateCtx = makeCtx({ currentRoom: 'MYROOM', messages: [existingRoomMsg] });
      await submitGameSettings(privateFormData, {}, privateCtx, deps);
      expect(deps.sendRoomSettingsFn).not.toHaveBeenCalled();
    });
  });

  describe('game settings message deduplication', () => {
    it('sends game settings message when board was updated', async () => {
      await submitGameSettings(formData, {}, ctx, deps);
      expect(deps.sendGameSettingsFn).toHaveBeenCalled();
    });

    it('does NOT send game settings message when a recent one exists from same user', async () => {
      const recentMsg = {
        type: 'settings',
        uid: mockUser.uid,
        timestamp: { toMillis: () => Date.now() - 1000 },
      } as unknown as Message;
      const ctxWithMsg = makeCtx({ messages: [recentMsg] });
      await submitGameSettings(formData, {}, ctxWithMsg, deps);
      expect(deps.sendGameSettingsFn).not.toHaveBeenCalled();
    });

    it('sends game settings message when the existing one is older than 5 seconds', async () => {
      const oldMsg = {
        type: 'settings',
        uid: mockUser.uid,
        timestamp: { toMillis: () => Date.now() - 6000 },
      } as unknown as Message;
      const ctxWithOldMsg = makeCtx({ messages: [oldMsg] });
      await submitGameSettings(formData, {}, ctxWithOldMsg, deps);
      expect(deps.sendGameSettingsFn).toHaveBeenCalled();
    });
  });

  describe('board persistence', () => {
    it('persists board when it changed', async () => {
      const newBoard = [{ title: 'Tile 1', description: 'Do something' }];
      deps.updateGameBoardTiles = vi.fn().mockResolvedValue({
        settingsBoardUpdated: true,
        gameMode: 'online',
        newBoard,
      });
      const ctxWithOldBoard = makeCtx({ gameBoard: { tiles: [] } as DBGameBoard });
      await submitGameSettings(formData, {}, ctxWithOldBoard, deps);
      expect(deps.upsertBoardFn).toHaveBeenCalledWith(
        expect.objectContaining({ tiles: newBoard, isActive: 1 })
      );
    });

    it('skips board persistence when tiles reference is identical', async () => {
      const existingTiles = [{ title: 'Tile 1', description: 'Do something' }];
      deps.updateGameBoardTiles = vi.fn().mockResolvedValue({
        settingsBoardUpdated: false,
        gameMode: 'online',
        newBoard: existingTiles,
      });
      const ctxSameBoard = makeCtx({ gameBoard: { tiles: existingTiles } as DBGameBoard });
      await submitGameSettings(formData, {}, ctxSameBoard, deps);
      expect(deps.upsertBoardFn).not.toHaveBeenCalled();
    });
  });

  describe('local session creation (wizard flow)', () => {
    it('does NOT create a session when formData has no wizard fields', async () => {
      await submitGameSettings(formData, {}, ctx, deps);
      expect(deps.createLocalSessionFn).not.toHaveBeenCalled();
    });

    it('creates a session when wizard fields are present in both formData and settingsSnapshot', async () => {
      const localPlayers = [{ name: 'Alice' }];
      const sessionSettings = { someField: true };
      const wizardFormData = makeFormData({
        hasLocalPlayers: true,
        localPlayersData: localPlayers,
        localPlayerSessionSettings: sessionSettings,
        room: 'MYROOM',
      } as any);
      const wizardSnapshot = makeFormData({ localPlayersData: localPlayers } as any);
      const wizardCtx = makeCtx({
        hasLocalPlayers: false,
        settingsSnapshot: wizardSnapshot,
        currentRoom: 'MYROOM',
      });
      await submitGameSettings(wizardFormData, {}, wizardCtx, deps);
      expect(deps.createLocalSessionFn).toHaveBeenCalledWith(
        'MYROOM',
        localPlayers,
        sessionSettings
      );
    });

    it('does NOT create a session when one already exists (hasLocalPlayers = true)', async () => {
      const localPlayers = [{ name: 'Alice' }];
      const wizardFormData = makeFormData({
        hasLocalPlayers: true,
        localPlayersData: localPlayers,
        localPlayerSessionSettings: {},
      } as any);
      const ctxWithSession = makeCtx({ hasLocalPlayers: true });
      await submitGameSettings(wizardFormData, {}, ctxWithSession, deps);
      expect(deps.createLocalSessionFn).not.toHaveBeenCalled();
    });
  });

  describe('settings persistence', () => {
    it('calls updateSettingsFn with cleaned data and reset flags', async () => {
      await submitGameSettings(formData, {}, ctx, deps);
      expect(deps.updateSettingsFn).toHaveBeenCalledWith(
        expect.objectContaining({
          boardUpdated: false,
          roomUpdated: false,
          gameMode: 'online',
        })
      );
    });

    it('strips wizard fields from persisted settings', async () => {
      const wizardFormData = makeFormData({
        localPlayersData: [{ name: 'Alice' }],
        hasLocalPlayers: true,
      } as any);
      await submitGameSettings(wizardFormData, {}, ctx, deps);
      const persistedSettings = (deps.updateSettingsFn as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(persistedSettings).not.toHaveProperty('localPlayersData');
      expect(persistedSettings).not.toHaveProperty('hasLocalPlayers');
    });
  });

  describe('stats recording', () => {
    it('records game start when board was updated', async () => {
      deps.updateGameBoardTiles = vi.fn().mockResolvedValue({
        settingsBoardUpdated: true,
        gameMode: 'online',
        newBoard: [],
      });
      await submitGameSettings(formData, {}, ctx, deps);
      expect(deps.recordGameStartFn).toHaveBeenCalledWith(mockUser.uid);
    });

    it('does NOT record game start when board was not updated', async () => {
      deps.updateGameBoardTiles = vi.fn().mockResolvedValue({
        settingsBoardUpdated: false,
        gameMode: 'online',
        newBoard: [],
      });
      await submitGameSettings(formData, {}, ctx, deps);
      expect(deps.recordGameStartFn).not.toHaveBeenCalled();
    });

    it('does not throw when recordGameStartFn fails', async () => {
      deps.recordGameStartFn = vi.fn().mockRejectedValue(new Error('Stats service down'));
      await expect(submitGameSettings(formData, {}, ctx, deps)).resolves.not.toThrow();
    });
  });

  describe('navigation', () => {
    it('navigates to the room from formData', async () => {
      await submitGameSettings(makeFormData({ room: 'TESTROOM' }), {}, ctx, deps);
      expect(deps.navigateFn).toHaveBeenCalledWith('TESTROOM');
    });
  });

  describe('URL sanitization', () => {
    it('clears an invalid roomBackgroundURL before processing', async () => {
      const dirtyFormData = makeFormData({ roomBackgroundURL: 'not-a-url' });
      await submitGameSettings(dirtyFormData, {}, ctx, deps);
      expect(dirtyFormData.roomBackgroundURL).toBe('');
    });

    it('trims whitespace from roomBackgroundURL', async () => {
      const dirtyFormData = makeFormData({ roomBackgroundURL: '  https://example.com/bg.jpg  ' });
      await submitGameSettings(dirtyFormData, {}, ctx, deps);
      expect(dirtyFormData.roomBackgroundURL).toBe('https://example.com/bg.jpg');
    });
  });
});
