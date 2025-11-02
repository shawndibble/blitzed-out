import './styles.css';

import { Box, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSoundById, playSound } from '@/utils/gameSounds';
import { getGameSessionAnalytics, isRoomReady } from './roomHelpers';

import GameSettingsDialog from '@/components/GameSettingsDialog';
import MessageInput from '@/components/MessageInput';
import Navigation from '@/views/Navigation';
import PopupMessage from '@/components/PopupMessage';
import RollButton from './RollButton';
import { RollValueState } from '@/types/index';
import RoomBackground from '@/components/RoomBackground';
import { Settings } from '@/types/Settings';
import ToastAlert from '@/components/ToastAlert';
import TurnTransition from '@/components/TurnTransition';
import clsx from 'clsx';
import { getActiveBoard } from '@/stores/gameBoard';
import getBackgroundSource from '@/services/getBackgroundSource';
import useBreakpoint from '@/hooks/useBreakpoint';
import useHybridPlayerList from '@/hooks/useHybridPlayerList';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import { useParams } from 'react-router-dom';
import usePlayerMove from '@/hooks/usePlayerMove';
import usePresence from '@/hooks/usePresence';
import usePrivateRoomMonitor from '@/hooks/usePrivateRoomMonitor';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import useUrlImport from '@/hooks/useUrlImport';
import useMessages from '@/context/hooks/useMessages';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import latestMessageByType from '@/helpers/messages';
import { analytics } from '@/services/analytics';

import BottomTabs from './BottomTabs';
import MessageList from '@/components/MessageList';
import GameBoard from '@/views/Room/GameBoard';
import VideoCallProvider from '@/components/VideoCall';
import VideoCallPanel from '@/components/VideoCall/VideoCallPanel';
import VideoSidebar from '@/components/VideoCall/VideoSidebar';

export default function Room() {
  const params = useParams<{ id: string }>();
  const room = params.id || '';
  const isMobile = useBreakpoint();
  const { t } = useTranslation();

  const [settings, setSettings] = useSettings();
  const [isVideoSidebarOpen, setIsVideoSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  usePresence(room);

  // Game session tracking
  const sessionStartTime = useRef<number>(Date.now());
  const actionCount = useRef<number>(0);

  const [rollValue, setRollValue] = useState<RollValueState>({ value: 0, time: 0 });

  // Local player integration for turn transitions and sounds
  const { localPlayers, sessionSettings, currentPlayerIndex, isLocalPlayerRoom } =
    useLocalPlayers();
  const [showTransition, setShowTransition] = useState(false);
  const [transitionPlayerName, setTransitionPlayerName] = useState('');
  const [isTransitionForCurrentUser, setIsTransitionForCurrentUser] = useState(false);
  const previousPlayerIndexRef = useRef(currentPlayerIndex);

  const gameBoard = useLiveQuery(getActiveBoard)?.tiles;

  // Use useCallback to memoize the setRollValue function
  const memoizedSetRollValue = useCallback((newValue: number) => {
    setRollValue({ value: newValue, time: Date.now() });
    // Track action for session analytics
    actionCount.current += 1;
  }, []);

  // Turn change detection for local players (only in pure local multiplayer mode)
  useEffect(() => {
    if (!localPlayers.length || !sessionSettings || !isLocalPlayerRoom) return;

    const currentIndex = currentPlayerIndex ?? 0;
    const previousIndex = previousPlayerIndexRef.current;

    // Check if turn changed
    if (currentIndex !== previousIndex && previousIndex !== undefined) {
      const newCurrentPlayer = localPlayers[currentIndex];

      if (newCurrentPlayer) {
        // Show turn transition if enabled
        if (sessionSettings.showTurnTransitions) {
          setTransitionPlayerName(newCurrentPlayer.name);
          setIsTransitionForCurrentUser(false); // Always show player name for local multiplayer
          setShowTransition(true);
        }

        // Play turn sound if enabled and player has a sound
        if (sessionSettings.enableTurnSounds && newCurrentPlayer.sound) {
          const sound = getSoundById(newCurrentPlayer.sound);
          if (sound) {
            playSound(sound).catch((error) => {
              console.warn('Failed to play turn sound:', error);
            });
          }
        }
      }
    }

    // Update refs
    previousPlayerIndexRef.current = currentIndex;
  }, [currentPlayerIndex, localPlayers, sessionSettings, isLocalPlayerRoom]);

  // Multi-device turn transitions (only when others' dialog is disabled)
  const { messages } = useMessages();
  const latestActionMessage = latestMessageByType(messages, 'actions');
  const nextPlayer = useTurnIndicator(latestActionMessage);
  const previousMessageRef = useRef(latestActionMessage);
  const previousNextPlayerRef = useRef(nextPlayer);

  useEffect(() => {
    // Only show transitions for multi-device when NOT in local player room
    // AND when "show others' dialog" is disabled (so users still get turn awareness)
    if (isLocalPlayerRoom || !nextPlayer || !latestActionMessage) return;

    const { othersDialog } = settings;
    if (othersDialog) return; // Skip if others' dialog is enabled

    // Check if this is a new message (different from previous)
    const isNewMessage = latestActionMessage !== previousMessageRef.current;

    // Only show transition if it's a new message AND nextPlayer changed to be yourself
    if (isNewMessage && nextPlayer.isSelf && !previousNextPlayerRef.current?.isSelf) {
      // Show turn transition when it's your turn (multi-device)
      setTransitionPlayerName(nextPlayer.displayName);
      setIsTransitionForCurrentUser(true); // Show "Your Turn" for multi-device
      setShowTransition(true);
    }

    // Update refs to track changes
    previousMessageRef.current = latestActionMessage;
    previousNextPlayerRef.current = nextPlayer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    latestActionMessage,
    nextPlayer?.uid,
    nextPlayer?.isSelf,
    nextPlayer?.displayName,
    isLocalPlayerRoom,
    settings.othersDialog,
  ]); // Stabilized dependencies with eslint-disable for performance

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
  }, []);

  // Use usePlayerMove directly
  const { playerList, tile } = usePlayerMove(room, rollValue, gameBoard);
  const hybridPlayerList = useHybridPlayerList();

  // Track game session on component unmount
  // Use refs to track latest values without retriggering the cleanup effect
  const lastCountsRef = useRef(
    getGameSessionAnalytics(settings, hybridPlayerList, localPlayers.length)
  );

  // Keep latest values up to date
  useEffect(() => {
    lastCountsRef.current = getGameSessionAnalytics(
      settings,
      hybridPlayerList,
      localPlayers.length
    );
  }, [settings, hybridPlayerList, localPlayers.length]);

  // Track game session on component unmount only
  useEffect(() => {
    const start = sessionStartTime.current;
    return () => {
      const duration = Date.now() - start;
      const { gameMode, playerCount } = lastCountsRef.current;
      analytics.trackGameSession(duration, actionCount.current, gameMode, playerCount);
    };
  }, []);
  const { roller } = usePrivateRoomMonitor(room, gameBoard);
  const [importResult, clearImportResult, isImporting] = useUrlImport(settings, setSettings as any);

  if (!isRoomReady(gameBoard, settings, room, settings.gameMode, isImporting)) {
    return (
      <>
        <Navigation room={params.id} playerList={playerList as any} />
        <GameSettingsDialog open={true} />
      </>
    );
  }

  // Show loading state during import
  if (isImporting) {
    return (
      <>
        <Navigation room={params.id} playerList={playerList as any} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={48} />
        </Box>
      </>
    );
  }

  const { isVideo, url } = getBackgroundSource(settings, room);
  const videoAdjust = isVideo ? 'video-adjust' : '';

  // Apply default background to desktop-container when no custom background is set
  const hasCustomBackground = url && (isVideo || (!isVideo && url));
  const defaultRoomBackgroundClass = !hasCustomBackground ? 'default-room-background' : '';

  const { background, roomBackground } = settings;

  // Helper function to get the actual resolved background value
  const getActualBackground = (): string | null => {
    if (background === 'useRoomBackground') {
      return roomBackground || null;
    }
    return background || null;
  };

  const actualBackground = getActualBackground();

  // Theme logic: gray tiles for all backgrounds except 'color', colored tiles only for 'color' background
  const isGameBoardTransparent = actualBackground !== 'color';

  const isMessageListTransparent = Boolean(
    actualBackground && !['color', 'gray'].includes(actualBackground)
  );

  const GameBoardComponent = (
    <GameBoard
      playerList={hybridPlayerList as any}
      isTransparent={isGameBoardTransparent}
      gameBoard={gameBoard || []}
      settings={settings as Settings}
    />
  );

  const messagesComponent = (
    <div className="messages-container">
      <MessageList
        room={room}
        isTransparent={isMessageListTransparent}
        currentGameBoardSize={gameBoard?.length || 0}
      />
      <MessageInput room={room} isTransparent={isMessageListTransparent} />
    </div>
  );

  const videoCallComponent = <VideoCallPanel showLocalVideo={true} />;

  return (
    <>
      <Navigation room={room} playerList={hybridPlayerList as any} />

      <style>
        {`
          .dice-roller {
            left: ${!isMobile && isVideoSidebarOpen ? `${sidebarWidth + 50}px` : '50px'} !important;
          }
        `}
      </style>

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
        isCurrentUser={isTransitionForCurrentUser}
      />

      {isMobile ? (
        <VideoCallProvider roomId={room}>
          <BottomTabs
            tab1={GameBoardComponent}
            tab2={messagesComponent}
            tab3={videoCallComponent}
          />
        </VideoCallProvider>
      ) : (
        <>
          <VideoSidebar
            roomId={room}
            onToggle={setIsVideoSidebarOpen}
            onWidthChange={setSidebarWidth}
          />
          <Box
            className={clsx('desktop-container', videoAdjust, defaultRoomBackgroundClass)}
            sx={{
              marginLeft: isVideoSidebarOpen ? `${sidebarWidth}px` : 0,
              width: isVideoSidebarOpen ? `calc(100vw - ${sidebarWidth}px)` : '100vw',
              transition: 'margin-left 0.2s ease, width 0.2s ease',
              overflowX: 'visible',
            }}
          >
            {GameBoardComponent}
            {messagesComponent}
          </Box>
        </>
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
