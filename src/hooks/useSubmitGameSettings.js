import useAuth from 'context/hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getActiveTiles } from 'stores/customTiles';
import useGameBoard from './useGameBoard';
import useLocalStorage from './useLocalStorage';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import { getActiveBoard, upsertBoard } from 'stores/gameBoard';
import { handleUser, sendRoomSettingsMessage } from 'views/GameSettings/submitForm';
import useMessages from 'context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { isPublicRoom } from 'helpers/strings';
import { isValidURL } from 'helpers/urls';

function updateRoomBackground(formData) {
  if (!formData.roomBackgroundURL || !isValidURL(formData.roomBackgroundURL)) {
    formData.roomBackground = 'app';
  }
}

export default function useSubmitGameSettings() {
  const { user, updateUser } = useAuth();
  const { id: room } = useParams();
  const { t } = useTranslation();
  const customTiles = useLiveQuery(() => getActiveTiles());
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useRoomNavigate();
  const { messages } = useMessages();

  const handleRoomChange = (formData) => {
    const roomChanged = room.toUpperCase() !== formData.room.toUpperCase();
    const isPrivateRoom = formData.room && !isPublicRoom(formData.room);
    const privateBoardSizeChanged =
      isPrivateRoom && formData.roomTileCount !== settings.roomTileCount;
    return { roomChanged, isPrivateRoom, privateBoardSizeChanged };
  };

  async function submitSettings(formData, actionsList) {
    const { displayName } = formData;
    const updatedUser = await handleUser(user, displayName, updateUser);

    updateRoomBackground(formData);

    const { settingsBoardUpdated, gameMode, newBoard } = await updateGameBoardTiles(formData);
    const { roomChanged, isPrivateRoom, privateBoardSizeChanged } = handleRoomChange(formData);

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

    navigate(formData.room);
  }

  return (formData, actionsList) => submitSettings(formData, actionsList);
}
