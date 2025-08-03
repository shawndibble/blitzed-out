import './styles.css';

import { Box, CircularProgress } from '@mui/material';
import { Suspense, lazy, useCallback, useState, useEffect, useRef } from 'react';
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
import useHybridPlayerList from '@/hooks/useHybridPlayerList';
import TurnTransition from '@/components/TurnTransition';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import { playSound, getSoundById } from '@/utils/gameSounds';

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

  // Local player integration for turn transitions and sounds
  const { localPlayers, sessionSettings, currentPlayerIndex } = useLocalPlayers();
  const [showTransition, setShowTransition] = useState(false);
  const [transitionPlayerName, setTransitionPlayerName] = useState('');
  const previousPlayerIndexRef = useRef(currentPlayerIndex);
  const hasPlayedSoundRef = useRef(false);

  const gameBoard = useLiveQuery(getActiveBoard)?.tiles;

  // Use useCallback to memoize the setRollValue function
  const memoizedSetRollValue = useCallback((newValue: number) => {
    setRollValue({ value: newValue, time: Date.now() });
  }, []);

  // Turn change detection for local players
  useEffect(() => {
    if (!localPlayers.length || !sessionSettings) return;

    const currentIndex = currentPlayerIndex ?? 0;
    const previousIndex = previousPlayerIndexRef.current;

    // Check if turn changed
    if (currentIndex !== previousIndex && previousIndex !== undefined) {
      const newCurrentPlayer = localPlayers[currentIndex];

      if (newCurrentPlayer) {
        // Show turn transition if enabled
        if (sessionSettings.showTurnTransitions) {
          setTransitionPlayerName(newCurrentPlayer.name);
          setShowTransition(true);
        }

        // Play turn sound if enabled and player has a sound
        if (
          sessionSettings.enableTurnSounds &&
          newCurrentPlayer.sound &&
          !hasPlayedSoundRef.current
        ) {
          const sound = getSoundById(newCurrentPlayer.sound);
          if (sound) {
            playSound(sound).catch((error) => {
              console.warn('Failed to play turn sound:', error);
            });
          }
          hasPlayedSoundRef.current = true;
        }
      }
    }

    // Update refs
    previousPlayerIndexRef.current = currentIndex;
    if (currentIndex !== previousIndex) {
      hasPlayedSoundRef.current = false; // Reset for next turn change
    }
  }, [currentPlayerIndex, localPlayers, sessionSettings]);

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
  }, []);

  // Use usePlayerMove directly
  const { playerList, tile } = usePlayerMove(room, rollValue, gameBoard);
  const hybridPlayerList = useHybridPlayerList();
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
        playerList={hybridPlayerList as any}
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
      <Navigation room={room} playerList={hybridPlayerList as any} />

      <RollButton
        setRollValue={memoizedSetRollValue}
        dice={roller}
        isEndOfBoard={tile?.index !== undefined && tile.index >= (gameBoard?.length ?? 0) - 1}
      />

      <RoomBackground isVideo={isVideo} url={url} />

      {/* Turn Transition for Local Players */}
      <TurnTransition
        playerName={transitionPlayerName}
        show={showTransition}
        onComplete={handleTransitionComplete}
        duration={2000}
      />

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
