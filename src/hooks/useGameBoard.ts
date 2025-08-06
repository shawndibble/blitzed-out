import { useLiveQuery } from 'dexie-react-hooks';
import { isPublicRoom } from '@/helpers/strings';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import buildGameBoard from '@/services/buildGame';
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
      // Ensure selectedActions is properly handled in formData
      const formData =
        data?.roomUpdate || data?.boardUpdated
          ? data
          : {
              ...settings,
              ...data,
              selectedActions: {
                ...settings.selectedActions,
                ...data.selectedActions,
              },
            };
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

      const finalGameMode = gameMode || 'online';
      const locale = i18n.resolvedLanguage || 'en';
      const tileCount = isPublic ? 40 : roomTileCount || 40;

      // Use the new streamlined buildGameBoard function
      const boardResult = await buildGameBoard(formData, locale, finalGameMode, tileCount);

      // Log useful debug information (but not during tests to avoid stderr noise)
      const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST;

      if (!isTestEnvironment) {
        if (boardResult.metadata.missingGroups.length > 0) {
          console.warn('Missing groups for board building:', boardResult.metadata.missingGroups);
        }

        if (boardResult.metadata.tilesWithContent < tileCount / 2) {
          console.warn('Low tile content ratio:', {
            tilesWithContent: boardResult.metadata.tilesWithContent,
            totalTiles: boardResult.metadata.totalTiles,
            availableTileCount: boardResult.metadata.availableTileCount,
          });
        }
      }

      // if our board updated, then push those changes out.
      if (
        data?.boardUpdated ||
        settingsBoardUpdated ||
        (gameBoard?.tiles?.length ?? 0) !== boardResult.board.length
      ) {
        await updateSettings(formData);
        await upsertBoard({ title: gameBoard?.title || '', tiles: boardResult.board });
      }

      return {
        settingsBoardUpdated,
        gameMode,
        newBoard: boardResult.board,
        metadata: boardResult.metadata,
      };
    },
    [gameBoard, i18n.resolvedLanguage, settings, updateSettings]
  );

  return useCallback((data: Settings) => updateGameBoard(data), [updateGameBoard]);
}
