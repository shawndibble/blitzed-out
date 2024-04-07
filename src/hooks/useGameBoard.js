import useLocalStorage from 'hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import customizeBoard from 'services/buildGame';
import { importActions } from 'services/importLocales';

/**
 * Builds a game board based on the settings provided.
 * @returns {function} - A function that takes in a form data object and returns an object.
 */
export default function useGameBoard() {
  const { id: room } = useParams();
  const customTiles = useLocalStorage('customTiles', [])[0];
  const [gameBoard, updateBoard] = useLocalStorage('customBoard');
  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const { i18n } = useTranslation();

  const isPrivateRoom = room?.toUpperCase() !== 'PUBLIC';

  return async (data = {}) => {
    const formData =
      data?.roomUpdate || data?.boardUpdated ? data : { ...settings, ...data };
    let { gameMode, boardUpdated: settingsBoardUpdated } = formData;
    const { roomTileCount, finishRange } = formData;

    if (!finishRange) {
      // still loading data.
      return {};
    }
    // If we are in a public room,
    // then gameMode should update to online and we need to re-import actions.
    if (!isPrivateRoom && gameMode === 'local') {
      gameMode = 'online';
      // this is async, so we need the boardUpdated & updatedDataFolder as separate entities.
      settingsBoardUpdated = true;
    }

    const tileActionList = importActions(i18n.resolvedLanguage, gameMode);

    const tileCount = isPrivateRoom ? roomTileCount || 40 : 40;

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
      gameBoard.length !== newBoard.length
    ) {
      await updateSettings(formData);
      await updateBoard(newBoard);
    }

    return { settingsBoardUpdated, gameMode, newBoard };
  };
}
