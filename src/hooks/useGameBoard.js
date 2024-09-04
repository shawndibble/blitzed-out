import { useLiveQuery } from 'dexie-react-hooks';
import useLocalStorage from 'hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import customizeBoard from 'services/buildGame';
import { importActions } from 'services/importLocales';
import { getActiveTiles } from 'stores/customTiles';
import { getActiveBoard, upsertBoard } from 'stores/gameBoard';

/**
 * Builds a game board based on the settings provided.
 * @returns {function} - A function that takes in a form data object and returns an object.
 */
export default function useGameBoard() {
  const customTiles = useLiveQuery(getActiveTiles);
  const gameBoard = useLiveQuery(getActiveBoard);
  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const { i18n } = useTranslation();

  return async (data = {}) => {
    const formData =
      data?.roomUpdate || data?.boardUpdated ? data : { ...settings, ...data };
    let { gameMode, boardUpdated: settingsBoardUpdated } = formData;
    const { roomTileCount = 40, finishRange, room } = formData;
    const isPublicRoom = room?.toUpperCase() === 'PUBLIC';

    if (!finishRange) {
      // still loading data.
      return {};
    }

    // If we are in a public room,
    // then gameMode should update to online, and we need to re-import actions.
    if (isPublicRoom && gameMode === 'local') {
      gameMode = 'online';
      console.log('changed to online', formData, settings);
      // this is async, so we need the boardUpdated & updatedDataFolder as separate entities.
      settingsBoardUpdated = true;
    }

    const tileActionList = importActions(i18n.resolvedLanguage, gameMode);

    const tileCount = isPublicRoom ? 40 : roomTileCount;

    const newBoard = customizeBoard(
      formData,
      tileActionList,
      customTiles,
      tileCount
    );

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
  };
}
