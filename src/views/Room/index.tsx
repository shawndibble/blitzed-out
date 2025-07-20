import { Box, CircularProgress } from '@mui/material';
import MessageInput from '@/components/MessageInput';
import PopupMessage from '@/components/PopupMessage';
import RoomBackground from '@/components/RoomBackground';
import ToastAlert from '@/components/ToastAlert';
import TurnIndicator from '@/components/TurnIndicator';
import GameSettingsDialog from '@/components/GameSettingsDialog';
import { useSettings } from '@/stores/settingsStore';
import usePlayerMove from '@/hooks/usePlayerMove';
import usePresence from '@/hooks/usePresence';
import usePrivateRoomMonitor from '@/hooks/usePrivateRoomMonitor';
import useUrlImport from '@/hooks/useUrlImport';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useParams } from 'react-router-dom';
import getBackgroundSource from '@/services/getBackgroundSource';
import Navigation from '@/views/Navigation';
import RollButton from './RollButton';
import './styles.css';
import { useState, useCallback, lazy, Suspense } from 'react';

// Lazy load mobile-specific component
const BottomTabs = lazy(() => import('./BottomTabs'));
import { useTranslation } from 'react-i18next';
import { getActiveBoard } from '@/stores/gameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';
import { RollValueState, Tile } from '@/types/index';
import { Tile as GameTile } from '@/types/gameBoard';

// Lazy load heavy components
const MessageList = lazy(() => import('@/components/MessageList'));
const GameBoard = lazy(() => import('@/views/Room/GameBoard'));

// Loading component for heavy components
function ComponentLoader() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
      <CircularProgress size={24} />
    </Box>
  );
}

export default function Room() {
  const params = useParams<{ id: string }>();
  const room = params.id || '';
  const isMobile = useBreakpoint();
  const { t } = useTranslation();

  const [settings, setSettings] = useSettings();

  usePresence(room, settings?.roomRealtime);

  const [rollValue, setRollValue] = useState<RollValueState>({ value: 0, time: 0 });
  const gameBoard = useLiveQuery(getActiveBoard)?.tiles as GameTile[] | undefined;

  // Use useCallback to memoize the setRollValue function
  const memoizedSetRollValue = useCallback((newValue: number) => {
    setRollValue({ value: newValue, time: Date.now() });
  }, []);

  // Use usePlayerMove directly
  const { playerList, tile } = usePlayerMove(room, rollValue, gameBoard);
  const { roller, roomBgUrl } = usePrivateRoomMonitor(room, gameBoard);
  const [importResult, clearImportResult] = useUrlImport(settings, setSettings as any);

  if (
    !gameBoard ||
    !gameBoard.length ||
    !Object.keys(settings).length ||
    (isPublicRoom(room) && !isOnlineMode(settings.gameMode))
  ) {
    return (
      <>
        <Navigation room={params.id} playerList={playerList as any} />
        <GameSettingsDialog open={true} />
      </>
    );
  }

  const { isVideo, url } = getBackgroundSource(settings, room, roomBgUrl);
  const videoAdjust = isVideo ? 'video-adjust' : '';

  const { background, roomBackground } = settings;
  const isTransparent = (!isPublicRoom(room) && roomBackground !== 'app') || background !== 'color';

  const GameBoardComponent = (
    <Suspense fallback={<ComponentLoader />}>
      <GameBoard
        playerList={playerList as any}
        isTransparent={isTransparent}
        gameBoard={gameBoard as Tile[]}
        settings={settings as Settings}
      />
    </Suspense>
  );

  const messagesComponent = (
    <div className="messages-container">
      <Suspense fallback={<ComponentLoader />}>
        <MessageList
          room={room}
          isTransparent={isTransparent}
          currentGameBoardSize={gameBoard.length}
        />
        <MessageInput room={room} isTransparent={isTransparent} />
      </Suspense>
    </div>
  );

  return (
    <>
      <Navigation room={room} playerList={playerList as any} />

      <RollButton
        setRollValue={memoizedSetRollValue}
        dice={roller}
        isEndOfBoard={tile?.index !== undefined && tile.index >= (gameBoard?.length ?? 0) - 1}
      />

      <RoomBackground isVideo={isVideo} url={url} />
      <TurnIndicator />
      {isMobile ? (
        <Suspense fallback={<ComponentLoader />}>
          <BottomTabs tab1={GameBoardComponent} tab2={messagesComponent} />
        </Suspense>
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
