import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '@/services/firebase/chat';
import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import { Tile, TileExport } from '@/types/gameBoard';
import { useSettings } from '@/stores/settingsStore';
import { useLocalPlayers } from './useLocalPlayers';
import { localPlayerService } from '@/services/localPlayerService';
import { useMessagesStore } from '@/stores/messagesStore';
import { isActionsMessage, Message, TurnFields } from '@/types/Message';
import { Timestamp } from 'firebase/firestore';
import useMessages from '@/context/hooks/useMessages';
import { orderedMessagesByType } from '@/helpers/messages';
import { getTurnFields } from '@/helpers/actionTurn';
import { pickFinishResult } from '@/helpers/finishResult';
import { isUsableRoll, resolveLocation } from '@/helpers/turnLocation';
import { useStatsTracking } from '@/hooks/useStatsTracking';

interface RollValue {
  value: number | number[];
  time: number | DateConstructor;
}

interface LocationResult {
  preMessage?: string;
  newLocation: number;
  kind: TurnFields['kind'];
}

interface PlayerMoveResult {
  tile: Tile;
}

function parseDescription(
  text: string | undefined,
  role: string,
  displayName: string,
  localPlayers?: import('@/types/localPlayers').LocalPlayer[],
  gender?: import('@/types/localPlayers').PlayerGender,
  locale?: string,
  penetrative?: boolean
): string {
  if (!text) return '';
  // our finish tile has %, so if we have it, figure out the result.
  const textArray = text.split('%');
  if (textArray.length <= 1) {
    return actionStringReplacement(
      text,
      role || '',
      displayName || '',
      localPlayers,
      false,
      gender,
      locale,
      penetrative
    );
  }

  return pickFinishResult(textArray);
}

export default function usePlayerMove(
  room: string,
  rollValue: RollValue,
  gameBoard: TileExport[] = []
): PlayerMoveResult {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [settings] = useSettings();
  const { currentPlayer, hasLocalPlayers, isLocalPlayerRoom, advanceToNextPlayer, session } =
    useLocalPlayers();
  const addMessage = useMessagesStore((state) => state.addMessage);
  const { messages } = useMessages();
  const { trackTileLanding, trackGameComplete, trackGameStart } = useStatsTracking();
  const total = gameBoard.length;
  const convertToTile = (tileExport: TileExport, index: number = 0): Tile => ({
    id: index,
    title: tileExport.title || '',
    description: tileExport.description,
    index,
    players: [],
    current: null,
    isTransparent: false,
    className: '',
  });

  const [tile, setTile] = useState<Tile>(() =>
    gameBoard[0] ? convertToTile(gameBoard[0], 0) : convertToTile({ title: '', description: '' }, 0)
  );
  const lastTile = total - 1;

  const lastRollTimeRef = useRef<number>(0);
  const hasCompletedGameRef = useRef<boolean>(false);

  const handleTextOutput = useCallback(
    async (
      newTile: TileExport,
      rollNumber: number,
      newLocation: number,
      kind: TurnFields['kind'],
      preMessage?: string
    ): Promise<void> => {
      if (!newTile) {
        console.error('Tile not found at location:', newLocation);
        return;
      }
      if (!user) {
        return;
      }
      let message = '';

      // Determine which player name to use - local player if in local multiplayer mode, otherwise user
      const isInLocalMultiplayerMode = hasLocalPlayers && isLocalPlayerRoom;
      const playerName =
        isInLocalMultiplayerMode && currentPlayer ? currentPlayer.name : user?.displayName || '';
      const playerRole =
        isInLocalMultiplayerMode && currentPlayer ? currentPlayer.role : settings.role || 'sub';
      const playerGender =
        isInLocalMultiplayerMode && currentPlayer ? currentPlayer.gender : settings.gender;

      // Safely access newTile properties with default values if they don't exist
      const description = parseDescription(
        newTile.description || '',
        playerRole,
        playerName,
        isInLocalMultiplayerMode && session ? session.players : undefined,
        playerGender,
        settings.locale,
        newTile.penetrative
      );

      const title = newTile.title || t('unknownTile');

      if (rollNumber !== -1) {
        message += `${t('roll')}: ${rollNumber}\n`;
      }
      message += `#${newLocation + 1}: ${title}\n`;
      message += `${t('action')}: ${description}`;

      const turn: TurnFields = {
        kind,
        roll: rollNumber === -1 ? null : rollNumber,
        location: newLocation,
        title,
        description,
        finished: kind === 'alreadyFinished' || newLocation === lastTile,
      };

      // Send message with the player's name (local player name or user display name)
      const messageUser =
        isInLocalMultiplayerMode && currentPlayer
          ? {
              ...user,
              displayName: currentPlayer.name,
            }
          : user;

      const messageText = preMessage ? preMessage + message : message;

      // Create optimistic message for immediate display
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        uid: messageUser?.uid || '',
        displayName: messageUser?.displayName || '',
        text: messageText,
        type: 'actions',
        timestamp: Timestamp.now(),
        turn,
      };

      // Add message to store immediately for instant UI feedback
      addMessage(optimisticMessage);

      const messagePayload = {
        room,
        user: messageUser,
        text: messageText,
        type: 'actions' as const,
        turn,
      };

      // Send to Firebase (real message will replace optimistic when received)
      try {
        await sendMessage(messagePayload);
      } catch {
        // Silently handle - optimistic message already shown
      }

      // Advance to next player if in local multiplayer mode
      if (isInLocalMultiplayerMode && rollNumber !== -1) {
        // Add a small delay to ensure the message is sent first
        setTimeout(() => {
          advanceToNextPlayer();
        }, 100);
      }
    },
    [
      room,
      user,
      t,
      settings.role,
      settings.gender,
      settings.locale,
      hasLocalPlayers,
      isLocalPlayerRoom,
      currentPlayer,
      advanceToNextPlayer,
      session,
      addMessage,
      lastTile,
    ]
  );

  // Where a roll takes this player, plus the wording a non-ordinary turn needs.
  // The rules themselves live in `helpers/turnLocation` — pure, no React.
  const getNewLocation = useCallback(
    (rollNumber: number): LocationResult => {
      if (!isUsableRoll(rollNumber)) {
        console.warn('Invalid rollNumber detected, ignoring move:', rollNumber);
        return { newLocation: 0, kind: 'normal' };
      }

      // A local player's position is authoritative for that player; everyone
      // else's — including this device's own remote player — is derived from
      // their newest action message, which is exactly what the roster reads too.
      const isInLocalMultiplayerMode = hasLocalPlayers && isLocalPlayerRoom;
      let currentLocation = 0;

      if (isInLocalMultiplayerMode && currentPlayer) {
        currentLocation = isUsableRoll(currentPlayer.location) ? currentPlayer.location : 0;
      } else if (user?.uid) {
        const userActions = orderedMessagesByType(messages, 'actions', 'DESC');
        const lastAction = userActions.find((m) => m.uid === user.uid);
        if (lastAction && isActionsMessage(lastAction)) {
          currentLocation = getTurnFields(lastAction, {
            finishWord: t('finish'),
            startWord: t('start'),
          }).location;
        }
      }

      const { newLocation, kind } = resolveLocation({ rollNumber, currentLocation, lastTile });

      if (kind === 'restart') {
        return { preMessage: `${t('restartingGame')}\n`, newLocation, kind };
      }
      if (kind === 'alreadyFinished') {
        return { preMessage: `${t('alreadyFinished')}\n`, newLocation, kind };
      }
      return { newLocation, kind };
    },
    [t, lastTile, hasLocalPlayers, isLocalPlayerRoom, currentPlayer, user, messages]
  );

  useEffect(() => {
    let rollNumber: number;

    // Extract roll number with validation
    if (Array.isArray(rollValue.value)) {
      rollNumber = rollValue.value[0];
    } else {
      rollNumber = rollValue.value;
    }

    const currentTime = rollValue.time as number;

    // Validate roll number and time
    if (
      typeof rollNumber !== 'number' ||
      isNaN(rollNumber) ||
      rollNumber === 0 ||
      currentTime <= lastRollTimeRef.current
    ) {
      if (typeof rollNumber !== 'number' || isNaN(rollNumber)) {
        console.warn('Invalid rollNumber in useEffect:', rollNumber, 'rollValue:', rollValue);
      }
      return;
    }

    lastRollTimeRef.current = currentTime;

    const { preMessage, newLocation, kind } = getNewLocation(rollNumber);

    // Validate the new location
    if (typeof newLocation !== 'number' || isNaN(newLocation)) {
      console.error('Invalid newLocation calculated:', newLocation, 'rollNumber:', rollNumber);
      return;
    }

    // Make sure we have a valid location and tile
    if (newLocation >= 0 && newLocation < gameBoard.length && gameBoard[newLocation]) {
      const newTile = convertToTile(gameBoard[newLocation], newLocation);

      queueMicrotask(() => {
        setTile(newTile);
      });

      // Update local player position if in local multiplayer mode
      const isInLocalMultiplayerMode = hasLocalPlayers && isLocalPlayerRoom;
      if (isInLocalMultiplayerMode && currentPlayer && session) {
        const isFinished = newLocation === gameBoard.length - 1; // Last tile = finished
        localPlayerService
          .updatePlayerPosition(session.id, currentPlayer.id, newLocation, isFinished)
          .catch(() => {
            // Silently handle - session sync will recover on next reload
          });
      }

      // Track statistics for tile landing and game completion
      const tileCategory = gameBoard[newLocation]?.title;
      const isFinishedTile = newLocation === gameBoard.length - 1;

      trackTileLanding(tileCategory);

      if (isFinishedTile && !hasCompletedGameRef.current) {
        hasCompletedGameRef.current = true;
        const boardCategories = gameBoard.map((tile) => tile.title);

        // Extract selected intensity levels from settings
        const intensityLevels: string[] = [];
        if (settings.selectedActions) {
          Object.values(settings.selectedActions).forEach((entry) => {
            if (entry.levels) {
              entry.levels.forEach((level) => {
                intensityLevels.push(`Level ${level}`);
              });
            }
          });
        }

        trackGameComplete(boardCategories, intensityLevels);
      }

      if (newLocation === 0) {
        hasCompletedGameRef.current = false;
        // Track game start when restarting (going back to position 0)
        trackGameStart();
      }

      // send our message.
      handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, kind, preMessage).catch(
        () => {
          // Silently handle message send failures
        }
      );
    } else {
      console.error(
        `Invalid location or missing tile: ${newLocation}, gameBoard length: ${gameBoard.length}, tile exists:`,
        !!gameBoard[newLocation]
      );
    }
  }, [
    rollValue,
    gameBoard,
    handleTextOutput,
    getNewLocation,
    hasLocalPlayers,
    isLocalPlayerRoom,
    currentPlayer,
    session,
    trackTileLanding,
    trackGameComplete,
    trackGameStart,
    settings.selectedActions,
  ]);

  return { tile };
}
