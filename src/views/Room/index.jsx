import { Box } from '@mui/material';
import MessageInput from 'components/MessageInput';
import MessageList from 'components/MessageList';
import PopupMessage from 'components/PopupMessage';
import ToastAlert from 'components/ToastAlert';
import TurnIndicator from 'components/TurnIndicator';
import useLocalStorage from 'hooks/useLocalStorage';
import usePlayerMove from 'hooks/usePlayerMove';
import usePresence from 'hooks/usePresence';
import usePrivateRoomMonitor from 'hooks/usePrivateRoomMonitor';
import useUrlImport from 'hooks/useUrlImport';
import useWindowDimensions from 'hooks/useWindowDimensions';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import getBackgroundSource from 'services/getBackgroundSource';
import Navigation from 'views/Navigation';
import MemoizedGameBoard from 'views/Room/GameBoard';
import UnauthenticatedApp from 'views/UnauthenticatedApp';
import BottomTabs from './BottomTabs';
import RollButton from './RollButton';
import RoomBackground from './RoomBackground';
import './styles.css';

export default function Room() {
  const params = useParams();
  const room = params.id;
  const { isMobile } = useWindowDimensions();

  usePresence(room);

  const [rollValue, setRollValue] = useState({ value: 0, time: Date.now() });
  const gameBoard = useLocalStorage('customBoard')[0];
  const [settings, setSettings] = useLocalStorage('gameSettings');

  const { playerList, tile } = usePlayerMove(room, rollValue, gameBoard);
  const { roller, roomBgUrl } = usePrivateRoomMonitor(room, settings, gameBoard);
  const [importResult, clearImportResult] = useUrlImport(room, settings, setSettings);

  const { isVideo, url } = getBackgroundSource(settings, room, roomBgUrl);
  const videoAdjust = isVideo ? 'video-adjust' : '';

  const { background, roomBackground } = settings;
  const isTransparent = (room !== 'public' && roomBackground !== 'app') || background !== 'color';

  console.log('rollValue', rollValue);

  if (!gameBoard.length || !Object.keys(settings).length) {
    return <UnauthenticatedApp />;
  }

  const memoizedGameBoardComponent = (
    <MemoizedGameBoard
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
      <RoomBackground isVideo={isVideo} url={url} />
      <TurnIndicator room={room} />
      {isMobile ? (
        <Box className="mobile-container">
          <BottomTabs
            tab1={memoizedGameBoardComponent}
            tab2={messagesComponent}
          />
        </Box>
      ) : (
        <Box className={`desktop-container ${videoAdjust}`}>
          {memoizedGameBoardComponent}
          {messagesComponent}
        </Box>
      )}
      <PopupMessage room={room} />
      <ToastAlert type="success" open={!!importResult} close={clearImportResult}>
        {importResult}
      </ToastAlert>
    </>
  );
}
