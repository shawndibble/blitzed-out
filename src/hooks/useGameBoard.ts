import { useLiveQuery } from 'dexie-react-hooks';
import { isPublicRoom } from '@/helpers/strings';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import customizeBoard from '@/services/buildGame';
import { importActions } from '@/services/importLocales';
import { getActiveTiles } from '@/stores/customTiles';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';
import { isOnlineMode } from '@/helpers/strings';
import { useCallback } from 'react';
import { Settings } from '@/types/Settings';
import { DBGameBoard, GameBoardResult } from '@/types/gameBoard';

/**
 * Builds a game board based on the settings provided.
 * @returns A function that takes in a form data object and returns an object.
 */
export default function useGameBoard(): (data: Settings) => Promise<GameBoardResult> {
  const gameBoard = useLiveQuery<DBGameBoard | undefined>(getActiveBoard);
  const [settings, updateSettings] = useSettings();
  const { i18n } = useTranslation();

  const updateGameBoard = useCallback(
    async (data: Settings): Promise<GameBoardResult> => {
      const formData = data?.roomUpdate || data?.boardUpdated ? data : { ...settings, ...data };
      let { gameMode, boardUpdated: settingsBoardUpdated } = formData;
      const { roomTileCount = 40, finishRange, room } = formData;
      const isPublic = isPublicRoom(room || '');

      if (!data || !finishRange) {
        // still loading data.
        return { gameMode };
      }

      // If we are in a public room,
      // then gameMode should update to online, and we need to re-import actions.
      if (isPublic && !isOnlineMode(gameMode || '')) {
        gameMode = 'online';
        // this is async, so we need the boardUpdated & updatedDataFolder as separate entities.
        settingsBoardUpdated = true;
      }

      const tileActionList = await importActions(i18n.resolvedLanguage, gameMode || 'online');

      const tileCount = isPublic ? 40 : roomTileCount || 40;

      const customTiles = await getActiveTiles(gameMode || 'online');

      const newBoard = customizeBoard(formData, tileActionList, customTiles, tileCount);

      // if our board updated, then push those changes out.
      if (
        data?.boardUpdated ||
        settingsBoardUpdated ||
        gameBoard?.tiles?.length !== newBoard.length
      ) {
        await updateSettings(formData);
        await upsertBoard({ title: gameBoard?.title || '', tiles: newBoard });
      }

      return { settingsBoardUpdated, gameMode, newBoard };
    },
    [gameBoard, i18n.resolvedLanguage, settings, updateSettings]
  );

  return useCallback((data: Settings) => updateGameBoard(data), [updateGameBoard]);
}
