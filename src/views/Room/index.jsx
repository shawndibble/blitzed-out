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
import {
  memo, useCallback, useEffect, useRef, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import Navigation from 'views/Navigation';
import GameBoard from 'views/Room/GameBoard';
import ToastAlert from '../../components/ToastAlert';
import BottomTabs from './BottomTabs';
import RollButton from './RollButton';
import RoomBackground from './RoomBackground';
import './styles.css';

const GameBoardComponent = memo(({
  playerList, tile, settings, setSettings, isTransparent, gameBoard,
}) => (
  <GameBoard
    playerList={playerList}
    tile={tile}
    settings={settings}
    setSettings={setSettings}
    isTransparent={isTransparent}
    gameBoard={gameBoard}
  />
));

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
  const timeoutId = useRef();

  useEffect(() => {
    if (popupMessage) {
      timeoutId.current = setTimeout(() => setPopupMessage(false), 12000);
    }
    return () => clearTimeout(timeoutId.current);
  }, [popupMessage]);

  const closeTransitionModal = useCallback(() => {
    clearTimeout(timeoutId.current);
    setPopupMessage(false);
  });

  const stopAutoClose = useCallback(() => clearTimeout(timeoutId.current));
  // end handle timeout of TransitionModal.

  const { background, roomBackground } = settings;
  const isTransparent = (room !== 'public' && roomBackground !== 'app') || background !== 'color';

  if (!gameBoard.length || !Object.keys(settings).length) return null;

  const memoizedGameBoardComponent = (
    <GameBoardComponent
      playerList={playerList}
      tile={tile}
      settings={settings}
      setSettings={setSettings}
      isTransparent={isTransparent}
      gameBoard={gameBoard}
    />
  );

  const messagesComponent = (
    <div className="messages-container">
      <MessageList
        room={room}
        isTransparent={isTransparent}
        currentGameBoardSize={gameBoard.length}
      />
      <MessageInput room={room} isTransparent={isTransparent} />
    </div>
  );

  return (
    <>
      <Navigation room={room} playerList={playerList} />

      <RollButton
        setRollValue={setRollValue}
        dice={roller}
        playerTile={tile}
      />
      <RoomBackground settings={settings} room={room} roomBackgroundUrl={roomBgUrl} />
      {isMobile ? (
        <Box className="mobile-container">
          <BottomTabs
            tab1={memoizedGameBoardComponent}
            tab2={messagesComponent}
          />
        </Box>
      ) : (
        <Box className="desktop-container">
          {memoizedGameBoardComponent}
          {messagesComponent}
        </Box>
      )}
      {popupMessage?.text && (
        <TransitionModal
          text={popupMessage?.text}
          displayName={popupMessage?.displayName}
          setOpen={setPopupMessage}
          open={!!popupMessage || !!popupMessage?.text}
          handleClose={closeTransitionModal}
          stopAutoClose={stopAutoClose}
        />
      )}
      <ToastAlert type="success" open={!!importResult} close={clearImportResult}>
        {importResult}
      </ToastAlert>
    </>
  );
}
