import './styles.css';

import { Box, CircularProgress } from '@mui/material';
import { Suspense, lazy, useCallback, useState } from 'react';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';

import GameSettingsDialog from '@/components/GameSettingsDialog';
import MessageInput from '@/components/MessageInput';
import Navigation from '@/views/Navigation';
import PopupMessage from '@/components/PopupMessage';
import RollButton from './RollButton';
import { RollValueState } from '@/types/index';
import RoomBackground from '@/components/RoomBackground';
import { Settings } from '@/types/Settings';
import ToastAlert from '@/components/ToastAlert';
import TurnIndicator from '@/components/TurnIndicator';
import clsx from 'clsx';
import { getActiveBoard } from '@/stores/gameBoard';
import getBackgroundSource from '@/services/getBackgroundSource';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import usePlayerMove from '@/hooks/usePlayerMove';
import usePresence from '@/hooks/usePresence';
import usePrivateRoomMonitor from '@/hooks/usePrivateRoomMonitor';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import useUrlImport from '@/hooks/useUrlImport';

// Lazy load mobile-specific component
const BottomTabs = lazy(() => import('./BottomTabs'));

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

  usePresence(room);

  const [rollValue, setRollValue] = useState<RollValueState>({ value: 0, time: 0 });
  const gameBoard = useLiveQuery(getActiveBoard)?.tiles;

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

  // Apply default background to desktop-container when no custom background is set
  const hasCustomBackground = url && (isVideo || (!isVideo && url));
  const defaultRoomBackgroundClass = !hasCustomBackground ? 'default-room-background' : '';

  const { background, roomBackground } = settings;
  const isTransparent =
    (!isPublicRoom(room) && roomBackground !== 'app') ||
    !['color', 'gray'].includes(background || '');

  const GameBoardComponent = (
    <Suspense fallback={<ComponentLoader />}>
      <GameBoard
        playerList={playerList as any}
        isTransparent={isTransparent}
        gameBoard={gameBoard}
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
        <Box className={clsx('desktop-container', videoAdjust, defaultRoomBackgroundClass)}>
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
