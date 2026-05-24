import type { LocalPlayer, LocalSessionSettings, User } from '@/types';
import type { Settings } from '@/types/Settings';
import type { GameBoardResult, DBGameBoard, TileExport } from '@/types/gameBoard';
import type { CustomTilePull } from '@/types/customTiles';
import type { Message } from '@/types/Message';
import { VALID_GROUP_TYPES } from '@/types';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';

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

function computeRoomChange(
  formData: Settings,
  currentRoom: string | undefined,
  currentRoomTileCount: number | undefined
): { roomChanged: boolean; isPrivateRoom: boolean; privateBoardSizeChanged: boolean } {
  const currentRoomUpper = (currentRoom || '').toUpperCase();
  const formDataRoomUpper = (formData.room || '').toUpperCase();
  const roomChanged = currentRoomUpper !== formDataRoomUpper;
  const isPrivateRoom = Boolean(formData.room && !isPublicRoom(formData.room));
  const privateBoardSizeChanged = isPrivateRoom && formData.roomTileCount !== currentRoomTileCount;
  return { roomChanged, isPrivateRoom, privateBoardSizeChanged };
}

export async function submitGameSettings(
  formData: Settings,
  actionsList: any,
  ctx: SubmitContext,
  deps: SubmitDependencies
): Promise<void> {
  const { displayName } = formData;
  const updatedUser = await deps.updateUser(displayName ?? '');

  updateRoomBackground(formData);

  const {
    settingsBoardUpdated,
    gameMode,
    newBoard = [],
  } = (await deps.updateGameBoardTiles(formData)) as GameBoardResult;

  const { roomChanged, isPrivateRoom, privateBoardSizeChanged } = computeRoomChange(
    formData,
    ctx.currentRoom,
    ctx.currentRoomTileCount
  );

  if (!updatedUser) return;

  if (
    isPrivateRoom &&
    (formData.roomUpdated || !ctx.messages.find((m: Message) => m.type === 'room'))
  ) {
    await deps.sendRoomSettingsFn(formData, updatedUser);
  }

  if (ctx.gameBoard?.tiles !== newBoard) {
    await deps.upsertBoardFn({
      title: deps.translateFn('settingsGenerated'),
      tiles: newBoard,
      isActive: 1,
      gameMode,
    });
  }

  const shouldSendGameSettings =
    (settingsBoardUpdated || roomChanged || privateBoardSizeChanged) &&
    !ctx.messages.some(
      (m: Message) =>
        m.type === 'settings' &&
        m.uid === updatedUser.uid &&
        Date.now() - (m.timestamp?.toMillis() || 0) < 5000
    );

  if (shouldSendGameSettings) {
    await deps.sendGameSettingsFn({
      formData,
      user: updatedUser,
      customTiles: ctx.customTiles,
      actionsList,
      title: 'Settings Generated Board',
      tiles: newBoard,
    });
  }

  const typedFormData = formData as any;
  const settingsHasWizardFields =
    'localPlayersData' in ctx.settingsSnapshot ||
    'localPlayerSessionSettings' in ctx.settingsSnapshot ||
    'hasLocalPlayers' in ctx.settingsSnapshot;

  if (
    typedFormData.hasLocalPlayers &&
    typedFormData.localPlayersData &&
    typedFormData.localPlayerSessionSettings &&
    !ctx.hasLocalPlayers &&
    settingsHasWizardFields
  ) {
    try {
      await deps.createLocalSessionFn(
        formData.room,
        typedFormData.localPlayersData as LocalPlayer[],
        typedFormData.localPlayerSessionSettings as LocalSessionSettings
      );
    } catch {
      // Non-blocking — session creation failure should not prevent settings save
    }
  }

  const cleanedFormData = cleanFormData(formData);

  deps.updateSettingsFn({
    ...cleanedFormData,
    boardUpdated: false,
    roomUpdated: false,
    gameMode,
  });

  if (settingsBoardUpdated && ctx.user?.uid) {
    deps.recordGameStartFn(ctx.user.uid).catch(() => {
      // Stats are non-critical
    });
  }

  deps.navigateFn(formData.room);
}
