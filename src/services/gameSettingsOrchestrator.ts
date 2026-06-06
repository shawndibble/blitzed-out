import type { LocalPlayer, LocalSessionSettings, User } from '@/types';
import type { Settings } from '@/types/Settings';
import type { GameBoardResult, DBGameBoard, TileExport } from '@/types/gameBoard';
import type { CustomTilePull } from '@/types/customTiles';
import type { Message } from '@/types/Message';
import type { FirebaseGatewayPort } from './ports/FirebaseGatewayPort';
import type { GamePersistencePort } from './ports/GamePersistencePort';
import { VALID_GROUP_TYPES } from '@/types';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';

export type { FirebaseGatewayPort } from './ports/FirebaseGatewayPort';
export type { GamePersistencePort, UpsertBoardRecord } from './ports/GamePersistencePort';
export type { SendGameSettingsOpts } from './ports/FirebaseGatewayPort';

export interface SubmitContext {
  user: User | null;
  currentRoom: string | undefined;
  currentRoomTileCount: number | undefined;
  messages: Message[];
  gameBoard: DBGameBoard | undefined;
  customTiles: CustomTilePull[] | undefined;
  hasLocalPlayers: boolean;
  settingsSnapshot: Settings;
}

/** Framework conveniences — Zustand, React Router, i18next. Not external systems. */
export interface LocalEffects {
  updateSettings(settings: Partial<Settings>): void;
  navigate(room: string): void;
  translate(key: string): string;
}

/** @deprecated Use FirebaseGatewayPort + GamePersistencePort + LocalEffects instead */
export interface SubmitDependencies {
  updateUser: (displayName: string) => Promise<User | null>;
  updateGameBoardTiles: (data: Settings) => Promise<GameBoardResult>;
  sendRoomSettingsFn: (formData: Settings, user: User) => Promise<void>;
  upsertBoardFn: (
    record: Partial<DBGameBoard> & { tiles: TileExport[]; isActive: number }
  ) => Promise<number | undefined>;
  sendGameSettingsFn: (opts: {
    title: string;
    formData: Settings;
    user: User;
    actionsList: any;
    tiles: TileExport[];
    customTiles?: CustomTilePull[];
  }) => Promise<any>;
  createLocalSessionFn: (
    roomId: string,
    players: LocalPlayer[],
    settings: LocalSessionSettings
  ) => Promise<void>;
  updateSettingsFn: (settings: Partial<Settings>) => void;
  navigateFn: (room: string) => void;
  translateFn: (key: string) => string;
  recordGameStartFn: (uid: string) => Promise<void>;
}

export interface SubmitDecisions {
  shouldSendRoomSettings: boolean;
  shouldSendGameSettings: boolean;
  shouldCreateLocalSession: boolean;
  shouldRecordGameStart: boolean;
  roomChanged: boolean;
  isPrivateRoom: boolean;
  privateBoardSizeChanged: boolean;
  cleanedFormData: Settings;
}

function updateRoomBackground(formData: Settings): void {
  const url = formData.roomBackgroundURL?.trim();
  if (url !== formData.roomBackgroundURL) {
    formData.roomBackgroundURL = url || '';
  }
  if (formData.roomBackgroundURL && !isValidURL(formData.roomBackgroundURL)) {
    formData.roomBackgroundURL = '';
  }
}

function cleanFormData(formData: Settings): Settings {
  const cleanedData = { ...formData };
  const cleanedSelectedActions: Record<string, any> = {};

  if (formData.selectedActions) {
    Object.entries(formData.selectedActions).forEach(([key, entry]) => {
      if (entry && entry.levels && entry.levels.length > 0) {
        cleanedSelectedActions[key] = entry;
      }
    });
  }

  Object.keys(cleanedData).forEach((key) => {
    const entry = cleanedData[key] as any;
    if (
      entry &&
      typeof entry === 'object' &&
      entry.type &&
      VALID_GROUP_TYPES.includes(entry.type)
    ) {
      delete cleanedData[key];
    }
  });

  cleanedData.selectedActions = cleanedSelectedActions;

  const wizardFields = ['localPlayersData', 'localPlayerSessionSettings', 'hasLocalPlayers'];
  wizardFields.forEach((field) => {
    delete (cleanedData as any)[field];
  });

  return cleanedData;
}

/**
 * Pure decision planner — computes all conditional flags from plain data.
 * Requires settingsBoardUpdated and updatedUser from upstream async calls.
 * Testable with zero mocks.
 */
export function planSubmit(
  formData: Settings,
  ctx: SubmitContext,
  derivedState: {
    settingsBoardUpdated: boolean;
    updatedUser: User;
    now?: number;
  }
): SubmitDecisions {
  const { settingsBoardUpdated, updatedUser, now = Date.now() } = derivedState;

  const currentUpper = (ctx.currentRoom || '').toUpperCase();
  const formUpper = (formData.room || '').toUpperCase();
  const roomChanged = currentUpper !== formUpper;
  const isPrivateRoom = Boolean(formData.room && !isPublicRoom(formData.room));
  const privateBoardSizeChanged =
    isPrivateRoom && formData.roomTileCount !== ctx.currentRoomTileCount;

  const hasRoomMessage = ctx.messages.some((m) => m.type === 'room');
  const shouldSendRoomSettings = isPrivateRoom && (!!formData.roomUpdated || !hasRoomMessage);

  const recentDuplicate = ctx.messages.some(
    (m) =>
      m.type === 'settings' &&
      m.uid === updatedUser.uid &&
      now - (m.timestamp?.toMillis() || 0) < 5000
  );
  const triggerCondition = settingsBoardUpdated || roomChanged || privateBoardSizeChanged;
  const shouldSendGameSettings = triggerCondition && !recentDuplicate;

  const typedFormData = formData as any;
  const shouldCreateLocalSession = Boolean(
    typedFormData.hasLocalPlayers &&
    typedFormData.localPlayersData &&
    typedFormData.localPlayerSessionSettings &&
    !ctx.hasLocalPlayers
  );

  const shouldRecordGameStart = settingsBoardUpdated && Boolean(ctx.user?.uid);

  return {
    shouldSendRoomSettings,
    shouldSendGameSettings,
    shouldCreateLocalSession,
    shouldRecordGameStart,
    roomChanged,
    isPrivateRoom,
    privateBoardSizeChanged,
    cleanedFormData: cleanFormData(formData),
  };
}

async function executeSubmit(
  formData: Settings,
  actionsList: any,
  ctx: SubmitContext,
  firebase: FirebaseGatewayPort,
  persistence: GamePersistencePort,
  effects: LocalEffects
): Promise<void> {
  const { displayName } = formData;
  const updatedUser = await firebase.updateUser(displayName ?? '');

  updateRoomBackground(formData);

  const {
    settingsBoardUpdated,
    gameMode,
    newBoard = [],
  } = await persistence.updateGameBoardTiles(formData);

  if (!updatedUser) return;

  const decisions = planSubmit(formData, ctx, {
    settingsBoardUpdated: Boolean(settingsBoardUpdated),
    updatedUser,
  });

  if (decisions.shouldSendRoomSettings) {
    await firebase.sendRoomSettings(formData, updatedUser);
  }

  if (ctx.gameBoard?.tiles !== newBoard) {
    await persistence.upsertBoard({
      title: effects.translate('settingsGenerated'),
      tiles: newBoard,
      isActive: 1,
      gameMode,
    });
  }

  if (decisions.shouldSendGameSettings) {
    await firebase.sendGameSettings({
      formData,
      user: updatedUser,
      customTiles: ctx.customTiles,
      actionsList,
      title: 'Settings Generated Board',
      tiles: newBoard,
    });
  }

  const typedFormData = formData as any;

  if (decisions.shouldCreateLocalSession) {
    try {
      await persistence.createLocalSession(
        formData.room,
        typedFormData.localPlayersData as LocalPlayer[],
        typedFormData.localPlayerSessionSettings as LocalSessionSettings
      );
    } catch {
      // Non-blocking — session creation failure should not prevent settings save
    }
  }

  effects.updateSettings({
    ...decisions.cleanedFormData,
    boardUpdated: false,
    roomUpdated: false,
    gameMode,
  });

  if (decisions.shouldRecordGameStart && ctx.user?.uid) {
    persistence.recordGameStart(ctx.user.uid).catch(() => {
      // Stats are non-critical
    });
  }

  effects.navigate(formData.room);
}

/**
 * Submit game settings.
 * Preferred: pass FirebaseGatewayPort, GamePersistencePort, LocalEffects.
 * Legacy: pass SubmitDependencies (4th arg only, no 5th/6th).
 */
export async function submitGameSettings(
  formData: Settings,
  actionsList: any,
  ctx: SubmitContext,
  firebaseOrDeps: FirebaseGatewayPort | SubmitDependencies,
  persistence?: GamePersistencePort,
  effects?: LocalEffects
): Promise<void> {
  if (persistence && effects) {
    return executeSubmit(
      formData,
      actionsList,
      ctx,
      firebaseOrDeps as FirebaseGatewayPort,
      persistence,
      effects
    );
  }

  // Legacy SubmitDependencies path
  const deps = firebaseOrDeps as SubmitDependencies;
  return executeSubmit(
    formData,
    actionsList,
    ctx,
    {
      updateUser: deps.updateUser,
      sendRoomSettings: deps.sendRoomSettingsFn,
      sendGameSettings: deps.sendGameSettingsFn,
    },
    {
      updateGameBoardTiles: deps.updateGameBoardTiles,
      upsertBoard: deps.upsertBoardFn,
      createLocalSession: deps.createLocalSessionFn,
      recordGameStart: deps.recordGameStartFn,
    },
    {
      updateSettings: deps.updateSettingsFn,
      navigate: deps.navigateFn,
      translate: deps.translateFn,
    }
  );
}
