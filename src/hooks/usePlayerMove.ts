import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '@/services/firebase';
import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import usePlayerList from './usePlayerList';
import { Tile, TileExport } from '@/types/gameBoard';
import { useSettings } from '@/stores/settingsStore';
import { useLocalPlayers } from './useLocalPlayers';
import { localPlayerService } from '@/services/localPlayerService';

interface RollValue {
  value: number | number[];
  time: number | DateConstructor;
}

interface LocationResult {
  preMessage?: string;
  newLocation: number;
}

interface Player {
  isSelf: boolean;
  location: number;
  [key: string]: any;
}

interface PlayerMoveResult {
  tile: Tile;
  playerList: Player[];
}

function getFinishResult(textArray: string[]): string {
  // if we have %, we are on the finish tile. Let's get a random result.
  const finishValues = textArray.filter((n) => n).map((line) => line.split(': '));

  // process weighted random finish result.
  const weightedArray: number[] = [];
  finishValues.forEach((val, index) => {
    if (Number(val[1]) === 0) return;
    const clone = Array(Number(val[1])).fill(index);
    weightedArray.push(...clone);
  });

  const result = weightedArray[Math.floor(Math.random() * weightedArray.length)];

  return finishValues.map(([action]) => action)[result]?.replace(/(\r\n|\n|\r)/gm, '') || '';
}

function parseDescription(
  text: string | undefined,
  role: string,
  displayName: string,
  localPlayers?: import('@/types/localPlayers').LocalPlayer[],
  gender?: import('@/types/localPlayers').PlayerGender,
  locale?: string
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
      locale
    );
  }

  return getFinishResult(textArray);
}

export default function usePlayerMove(
  room: string,
  rollValue: RollValue,
  gameBoard: TileExport[] = []
): PlayerMoveResult {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [settings] = useSettings();
  const playerList = usePlayerList();
  const { currentPlayer, hasLocalPlayers, isLocalPlayerRoom, advanceToNextPlayer, session } =
    useLocalPlayers();
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

  const [tile, setTile] = useState<Tile>(
    gameBoard[0] ? convertToTile(gameBoard[0], 0) : convertToTile({ title: '', description: '' }, 0)
  );
  const lastTile = total - 1;

  const lastRollTimeRef = useRef<number>(0);

  const handleTextOutput = useCallback(
    async (
      newTile: TileExport,
      rollNumber: number,
      newLocation: number,
      preMessage?: string
    ): Promise<void> => {
      if (!newTile) {
        console.error('Tile not found at location:', newLocation);
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
        settings.locale
      );

      if (rollNumber !== -1) {
        message += `${t('roll')}: ${rollNumber}\n`;
      }
      message += `#${newLocation + 1}: ${newTile.title || t('unknownTile')}\n`;
      message += `${t('action')}: ${description}`;

      // Send message with the player's name (local player name or user display name)
      const messagePayload = {
        room,
        user:
          isInLocalMultiplayerMode && currentPlayer
            ? {
                ...user,
                displayName: currentPlayer.name,
              }
            : user,
        text: preMessage ? preMessage + message : message,
        type: 'actions' as const,
      };

      try {
        const result = await sendMessage(messagePayload);
        if (!result) {
          console.error('Failed to send message - no result returned');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
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
      hasLocalPlayers,
      isLocalPlayerRoom,
      currentPlayer,
      advanceToNextPlayer,
      session,
    ]
  );

  // Grab the new location.
  // In some instances, we also want to add a message with said location.
  const getNewLocation = useCallback(
    (rollNumber: number): LocationResult => {
      // Validate rollNumber is a valid number
      if (typeof rollNumber !== 'number' || isNaN(rollNumber)) {
        console.warn('Invalid rollNumber detected, ignoring move:', rollNumber);
        return { newLocation: 0 }; // Return current position (no movement)
      }

      // -1 is used to restart the game.
      if (rollNumber === -1) {
        return {
          preMessage: `${t('restartingGame')}\n`,
          newLocation: 0,
        };
      }

      // Get current location from local player if in local multiplayer mode, otherwise from remote player
      const isInLocalMultiplayerMode = hasLocalPlayers && isLocalPlayerRoom;
      let currentLocation = 0; // Default to starting position

      if (isInLocalMultiplayerMode && currentPlayer) {
        // Ensure location is a valid number for local players
        currentLocation = typeof currentPlayer.location === 'number' ? currentPlayer.location : 0;
      } else {
        // Use remote player location or default to 0
        currentLocation = playerList.find((p) => p.isSelf)?.location || 0;
      }

      // Validate currentLocation is a number
      if (typeof currentLocation !== 'number' || isNaN(currentLocation)) {
        console.warn('Invalid currentLocation detected, defaulting to 0:', currentLocation);
        currentLocation = 0;
      }

      // restart game if we roll and are on the last tile.
      if (currentLocation === lastTile) {
        return {
          preMessage: `${t('alreadyFinished')}\n`,
          newLocation: rollNumber,
        };
      }

      const newLocation = rollNumber + currentLocation;
      // If we move past finish, move to finish instead.
      if (newLocation >= lastTile) {
        return { newLocation: lastTile };
      }
      return { newLocation };
    },
    [t, playerList, lastTile, hasLocalPlayers, isLocalPlayerRoom, currentPlayer]
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

    const { preMessage, newLocation } = getNewLocation(rollNumber);

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
          .catch((error) => {
            console.error('Failed to update local player position:', error);
          });
      }

      // send our message.
      handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, preMessage).catch(
        (error) => {
          console.error('Failed to send roll message:', error);
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
  ]);

  return { tile, playerList };
}
