import { Box } from '@mui/material';
import MessageInput from '@/components/MessageInput';
import MessageList from '@/components/MessageList';
import PopupMessage from '@/components/PopupMessage';
import RoomBackground from '@/components/RoomBackground';
import ToastAlert from '@/components/ToastAlert';
import TurnIndicator from '@/components/TurnIndicator';
import GameSettingsDialog from '@/components/GameSettingsDialog';
import useLocalStorage from '@/hooks/useLocalStorage';
import usePlayerMove from '@/hooks/usePlayerMove';
import usePresence from '@/hooks/usePresence';
import usePrivateRoomMonitor from '@/hooks/usePrivateRoomMonitor';
import useUrlImport from '@/hooks/useUrlImport';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useParams } from 'react-router-dom';
import getBackgroundSource from '@/services/getBackgroundSource';
import Navigation from '@/views/Navigation';
import GameBoard from '@/views/Room/GameBoard';
import BottomTabs from './BottomTabs';
import RollButton from './RollButton';
import './styles.css';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getActiveBoard } from '@/stores/gameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';

export default function Room() {
  const params = useParams();
  const room = params.id;
  const isMobile = useBreakpoint();
  const { t } = useTranslation();

  const [settings, setSettings] = useLocalStorage('gameSettings');

  usePresence(room, settings.roomRealtime);

  const [rollValue, setRollValue] = useState({ value: 0, time: 0 });
  const gameBoard = useLiveQuery(getActiveBoard)?.tiles;

  // Use useCallback to memoize the setRollValue function
  const memoizedSetRollValue = useCallback((newValue) => {
    setRollValue({ value: newValue, time: Date.now() });
  }, []);

  // Use usePlayerMove directly
  const { playerList, tile } = usePlayerMove(room, rollValue, gameBoard);
  const { roller, roomBgUrl } = usePrivateRoomMonitor(room, gameBoard);
  const [importResult, clearImportResult] = useUrlImport(settings, setSettings);

  if (
    !gameBoard ||
    !gameBoard.length ||
    !Object.keys(settings).length ||
    (isPublicRoom(room) && !isOnlineMode(settings.gameMode))
  ) {
    return (
      <>
        <Navigation room={params.id} playerList={playerList} />
        <GameSettingsDialog open={true} />
      </>
    );
  }

  const { isVideo, url } = getBackgroundSource(settings, room, roomBgUrl);
  const videoAdjust = isVideo ? 'video-adjust' : '';

  const { background, roomBackground } = settings;
  const isTransparent = (!isPublicRoom(room) && roomBackground !== 'app') || background !== 'color';

  const GameBoardComponent = (
    <GameBoard
      playerList={playerList}
      isTransparent={isTransparent}
      gameBoard={gameBoard}
      settings={settings}
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
        setRollValue={memoizedSetRollValue}
        dice={roller}
        isEndOfBoard={tile?.index >= gameBoard.length - 1}
      />

      <RoomBackground isVideo={isVideo} url={url} />
      <TurnIndicator room={room} />
      {isMobile ? (
        <Box className="mobile-container">
          <BottomTabs tab1={GameBoardComponent} tab2={messagesComponent} />
        </Box>
      ) : (
        <Box className={`desktop-container ${videoAdjust}`}>
          {GameBoardComponent}
          {messagesComponent}
        </Box>
      )}
      <PopupMessage />
      <ToastAlert
        type={importResult === t('updated') ? 'success' : 'error'}
        open={!!importResult}
        close={clearImportResult}
      >
        {importResult}
      </ToastAlert>
    </>
  );
}
