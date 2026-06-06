import './styles.css';

import { Box, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameSessionAnalytics, isRoomReady } from './roomHelpers';

import GameSettingsDialog from '@/components/GameSettingsDialog';
import MessageInput from '@/components/MessageInput';
import Navigation from '@/views/Navigation';
import PopupMessage from '@/components/PopupMessage';
import RollButton, { RollButtonHandle } from './RollButton';
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
import useWakeLock from '@/hooks/useWakeLock';
import { useTurnTransition } from '@/hooks/useTurnTransition';
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

  // Keeps the screen awake so gameplay controls and connections aren't interrupted
  // (Chromium-based browsers; controlled by settings.wakeLockEnabled)
  useWakeLock(settings.wakeLockEnabled ?? true);

  // Game session tracking
  const sessionStartTimeRef = useRef<number>(Date.now());
  const actionCountRef = useRef<number>(0);

  // Roll button ref for keyboard shortcuts
  const rollButtonRef = useRef<RollButtonHandle>(null);

  const [rollValue, setRollValue] = useState<RollValueState>({ value: 0, time: 0 });

  // Local player integration for turn transitions and sounds
  const { localPlayers, sessionSettings, currentPlayerIndex, isLocalPlayerRoom } =
    useLocalPlayers();

  const gameBoard = useLiveQuery(getActiveBoard)?.tiles;

  // Use useCallback to memoize the setRollValue function
  const memoizedSetRollValue = useCallback((newValue: number) => {
    setRollValue({ value: newValue, time: Date.now() });
    // Track action for session analytics
    actionCountRef.current += 1;
  }, []);

  const {
    showTransition,
    transitionPlayerName,
    isTransitionForCurrentUser,
    handleTransitionComplete,
  } = useTurnTransition({
    localPlayers,
    sessionSettings,
    currentPlayerIndex,
    isLocalPlayerRoom,
    playerDialog: settings.playerDialog,
    othersDialog: settings.othersDialog,
  });

  // Use usePlayerMove directly
  const { tile } = usePlayerMove(room, rollValue, gameBoard);
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
    const start = sessionStartTimeRef.current;
    return () => {
      const duration = Date.now() - start;
      const { gameMode, playerCount } = lastCountsRef.current;
      analytics.trackGameSession(duration, actionCountRef.current, gameMode, playerCount);
    };
  }, []);
  const { roller } = usePrivateRoomMonitor(room, gameBoard);
  const [importResult, clearImportResult, isImporting] = useUrlImport(settings, setSettings as any);

  // Keyboard shortcut: Spacebar to roll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Don't trigger shortcuts when typing in inputs or when a button has focus
      // (buttons handle Space natively, so we avoid double-triggering the roll)
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        target.closest('button')
      ) {
        return;
      }

      // Spacebar to roll (without modifier keys)
      if (e.code === 'Space' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        rollButtonRef.current?.triggerRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isRoomReady(gameBoard, settings, room, settings.gameMode, isImporting)) {
    return (
      <>
        <Navigation room={params.id} playerList={hybridPlayerList as any} />
        <GameSettingsDialog open={true} />
      </>
    );
  }

  // Show loading state during import
  if (isImporting) {
    return (
      <>
        <Navigation room={params.id} playerList={hybridPlayerList as any} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
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

  const videoCallComponent = <VideoCallPanel roomId={room} showLocalVideo={true} />;

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
        ref={rollButtonRef}
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
