import useAuth from 'context/hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getActiveTiles } from 'stores/customTiles';
import useGameBoard from './useGameBoard';
import useLocalStorage from './useLocalStorage';

async function submitSettings(event, formData) {
  const { user, updateUser } = useAuth();
  const { id: room } = useParams();
  const { t } = useTranslation();
  const customTiles = useLiveQuery(() => getActiveTiles());
  const updateGameBoardTiles = useGameBoard();

  // set default settings for first time users. Local Storage will take over after this.
  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useNavigate();

  const { displayName } = formData;

  const updatedUser = await handleUser(user, displayName, updateUser);

  if (!formData.roomBackgroundURL || !formData.roomBackgroundURL.match(/^https?:\/\/.+\/.+$/)) {
    formData.roomBackground = 'app';
  }

  const { settingsBoardUpdated, gameMode, newBoard } = await updateGameBoardTiles(formData);

  const roomChanged = room.toUpperCase() !== formData.room.toUpperCase();
  const isPrivateRoom = formData.room && formData?.room.toUpperCase() !== 'PUBLIC';
  const privateBoardSizeChanged =
    isPrivateRoom && formData.roomTileCount !== settings.roomTileCount;

  // send out room specific settings if we are in a private room.
  if (isPrivateRoom && (formData.roomUpdated || !messages.find((m) => m.type === 'room'))) {
    await sendRoomSettingsMessage(formData, updatedUser);
  }

  if (gameBoard?.tiles !== newBoard) {
    await upsertBoard({
      title: t('settingsGenerated'),
      tiles: newBoard,
      isActive: 1,
      gameMode,
    });
  }

  // if our board updated, or we changed rooms, send out game settings message.
  if (settingsBoardUpdated || roomChanged || privateBoardSizeChanged) {
    await sendGameSettingsMessage({
      formData,
      user: updatedUser,
      customTiles,
      actionsList,
      title: 'Settings Generated Board',
      tiles: newBoard,
    });
  }

  updateSettings({
    ...formData,
    boardUpdated: false,
    roomUpdated: false,
    gameMode,
  });

  if (roomChanged) {
    const privatePath = `/${formData?.room || 'public'}`;
    navigate(privatePath);
  }
}

export default function useSubmitGameSettings() {
  return (event, formData) => submitSettings(event, formData);
}
