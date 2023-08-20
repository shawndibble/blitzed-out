import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import MessageInput from 'components/MessageInput';
import MessageList from 'components/MessageList';
import GameBoard from 'views/GameBoard';
import Navigation from 'views/Navigation';
import TransitionModal from 'components/TransitionModal';
import useWindowDimensions from 'hooks/useWindowDimensions';
import usePlayerMove from 'hooks/usePlayerMove';
import usePresence from 'hooks/usePresence';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import useGameBoard from 'hooks/useGameBoard';
import useAuth from 'hooks/useAuth';
import latestMessageByType from 'helpers/messages';
import { getExtention, getURLPath, isVideo } from 'helpers/strings';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import { importActions } from 'services/importLocales';
import { useTranslation } from 'react-i18next';
import BottomTabs from './BottomTabs';
import RollButton from './RollButton';
import './styles.css';

export default function Room() {
  const params = useParams();
  const room = params.id ?? 'public';
  const { user } = useAuth();
  const { i18n } = useTranslation();

  usePresence(room);
  const [popupMessage, setPopupMessage] = useSoundAndDialog(room);
  const { isMobile } = useWindowDimensions();
  const [rollValue, setRollValue] = useState([0]);
  const { playerList, tile } = usePlayerMove(room, rollValue);
  const [settings, setSettings] = useLocalStorage('gameSettings');
  const gameBoard = useLocalStorage('customBoard')[0];
  const customTiles = useLocalStorage('customTiles', [])[0];
  const messages = useMessages(room);
  const [roller, setRoller] = useState('1d6');
  const [roomBgUrl, setRoomBackground] = useState('');
  const updateGameBoardTiles = useGameBoard();

  // handle timeout of TransitionModal
  let timeoutId;
  useEffect(() => {
    if (popupMessage) timeoutId = setTimeout(() => setPopupMessage(false), 8000);
    return () => clearTimeout(timeoutId);
  }, [popupMessage]);

  const closeTransitionModal = () => {
    clearTimeout(timeoutId);
    setPopupMessage(false);
  };
  // end handle timeout of TransitionModal.

  async function rebuildGameBoard(messageSettings, messageUser) {
    const { gameMode, newBoard } = await updateGameBoardTiles(messageSettings);

    await sendGameSettingsMessage({
      formData: { ...settings, ...messageSettings },
      user,
      customTiles,
      actionsList: importActions(i18n.resolvedLanguage, gameMode),
      board: newBoard,
      reason: `Rebuilt game board due to room size changes by ${messageUser}.`,
    });
  }

  // Watch the message list.
  // If the private room settings change, update the game.
  useEffect(() => {
    const roomMessage = latestMessageByType(messages, 'room');
    if (roomMessage) {
      const messageSettings = JSON.parse(roomMessage.settings);
      const { roomDice, roomBackgroundURL, roomTileCount } = messageSettings;
      setRoller(roomDice || '1d6');
      setRoomBackground(roomBackgroundURL);
      // settings form updates for us. However we also need to update for other players.
      if (roomMessage.uid !== user.uid && roomTileCount !== gameBoard.length) {
        rebuildGameBoard(messageSettings, roomMessage.displayName);
      }
      return;
    }
    if (settings?.roomBackgroundURL?.length) {
      setRoomBackground(settings.roomBackgroundURL);
    }
  }, [messages, settings]);

  const {
    background, backgroundURL, roomBackground,
  } = settings;
  const backgroundSource = background !== 'custom' ? background : backgroundURL;
  const roomBackgroundSource = roomBackground === 'app' ? roomBackground : roomBgUrl;
  const isTransparent = (room !== 'public' && roomBackground !== 'app') || background !== 'color';
  const bgSource = room !== 'public' && roomBackground !== 'app' ? roomBackgroundSource : backgroundSource;
  const isVideoFile = isVideo(bgSource);
  const bgExtension = getExtention(bgSource);
  const sourcePath = getURLPath(bgSource);

  return (
    <>
      <Navigation room={room} playerList={playerList} />

      <RollButton
        setRollValue={setRollValue}
        dice={roller}
        playerTile={tile}
      />
      <Box className="main-container" sx={{ backgroundImage: !!bgExtension && !isVideoFile && `url(${sourcePath})` }}>
        {!!isVideoFile && (
          <video autoPlay loop muted>
            <source src={sourcePath} type={`video/${bgExtension}`} />
          </video>
        )}
      </Box>
      {!isMobile ? (
        <Box className="desktop-container">
          <GameBoard
            playerList={playerList}
            tile={tile}
            settings={settings}
            setSettings={setSettings}
            isTransparent={isTransparent}
          />

          <div className="messages-container">
            <MessageList
              room={room}
              isTransparent={isTransparent}
              currentGameBoardSize={gameBoard.length}
            />
            <MessageInput room={room} isTransparent={isTransparent} />
          </div>
        </Box>
      ) : (
        <Box className="mobile-container">
          <BottomTabs
            tab1={(
              <GameBoard
                playerList={playerList}
                tile={tile}
                settings={settings}
                setSettings={setSettings}
                isTransparent={isTransparent}
              />
            )}
            tab2={(
              <div className="messages-container">
                <MessageList
                  room={room}
                  isTransparent={isTransparent}
                  currentGameBoardSize={gameBoard.length}
                />
                <MessageInput room={room} isTransparent={isTransparent} />
              </div>
            )}
          />
        </Box>
      )}
      {popupMessage?.text && (
        <TransitionModal
          text={popupMessage?.text}
          displayName={popupMessage?.displayName}
          setOpen={setPopupMessage}
          open={!!popupMessage || !!popupMessage?.text}
          handleClose={closeTransitionModal}
        />
      )}
    </>
  );
}
