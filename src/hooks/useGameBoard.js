import { importActions } from 'services/importLocales';
import useLocalStorage from 'hooks/useLocalStorage';
import customizeBoard from 'services/buildGame';

export default function useGameBoard() {
  const customTiles = useLocalStorage('customTiles', [])[0];
  const [gameBoard, updateBoard] = useLocalStorage('customBoard');
  const settings = useLocalStorage('gameSettings')[0];

  const isPrivateRoom = (formData) => formData.room && formData.room !== 'public';

  const updateTiles = async (data = {}) => {
    const formData = data?.roomUpdate || data?.boardUpdated ? data : { ...settings, ...data };
    let { gameMode, boardUpdated: settingsBoardUpdated } = formData;
    const { locale, roomTileCount } = formData;

    // If we are in a public room,
    // then gamemode should update to online and we need to re-import actions.
    if (!isPrivateRoom(formData) && gameMode === 'local') {
      gameMode = 'online';
      // this is async, so we need the boardUpdated & updatedDataFolder as separate entities.
      settingsBoardUpdated = true;
    }

    const tileActionList = importActions(locale, gameMode);

    const tileCount = isPrivateRoom(formData) ? (roomTileCount || 40) : 40;

    const newBoard = customizeBoard(formData, tileActionList, customTiles, tileCount);

    // if our board updated, then push those changes out.
    if (settingsBoardUpdated || gameBoard.length !== newBoard.length) await updateBoard(newBoard);

    return { settingsBoardUpdated, gameMode, newBoard };
  };

  return updateTiles;
}
