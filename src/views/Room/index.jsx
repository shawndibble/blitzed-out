import { Box } from '@mui/material';
import MessageInput from 'components/MessageInput';
import MessageList from 'components/MessageList';
import TransitionModal from 'components/TransitionModal';
import useLocalStorage from 'hooks/useLocalStorage';
import usePlayerMove from 'hooks/usePlayerMove';
import usePresence from 'hooks/usePresence';
import usePrivateRoomMonitor from 'hooks/usePrivateRoomMonitor';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import useUrlImport from 'hooks/useUrlImport';
import useWindowDimensions from 'hooks/useWindowDimensions';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from 'views/Navigation';
import GameBoard from 'views/Room/GameBoard';
import ToastAlert from '../../components/ToastAlert';
import BottomTabs from './BottomTabs';
import RollButton from './RollButton';
import RoomBackground from './RoomBackground';
import './styles.css';

export default function Room() {
  const params = useParams();
  const room = params.id ?? 'public';
  const { isMobile } = useWindowDimensions();

  usePresence(room);

  const [rollValue, setRollValue] = useState([0]);
  const gameBoard = useLocalStorage('customBoard')[0];
  const [settings, setSettings] = useLocalStorage('gameSettings');

  const [popupMessage, setPopupMessage] = useSoundAndDialog(room);

  const { playerList, tile } = usePlayerMove(room, rollValue, gameBoard);
  const { roller, roomBgUrl } = usePrivateRoomMonitor(room, settings, gameBoard);
  const [importResult, clearImportResult] = useUrlImport(room, settings, setSettings);

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

  const { background, roomBackground } = settings;
  const isTransparent = (room !== 'public' && roomBackground !== 'app') || background !== 'color';

  return (
    <>
      <Navigation room={room} playerList={playerList} />

      <RollButton
        setRollValue={setRollValue}
        dice={roller}
        playerTile={tile}
      />
      <RoomBackground settings={settings} room={room} roomBackgroundUrl={roomBgUrl} />
      {!isMobile ? (
        <Box className="desktop-container">
          <GameBoard
            playerList={playerList}
            tile={tile}
            settings={settings}
            setSettings={setSettings}
            isTransparent={isTransparent}
            gameBoard={gameBoard}
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
                gameBoard={gameBoard}
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
      <ToastAlert type="success" open={!!importResult} close={clearImportResult}>
        {importResult}
      </ToastAlert>
    </>
  );
}
