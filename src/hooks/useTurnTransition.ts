import { useCallback, useEffect, useRef, useState } from 'react';
import { getSoundById, playSound } from '@/utils/gameSounds';

import type { LocalPlayer, LocalSessionSettings } from '@/types';
import latestMessageByType from '@/helpers/messages';
import useMessages from '@/context/hooks/useMessages';
import useTurnIndicator from '@/hooks/useTurnIndicator';

export interface TurnTransitionInput {
  localPlayers: LocalPlayer[];
  sessionSettings: LocalSessionSettings | null | undefined;
  currentPlayerIndex: number | null | undefined;
  isLocalPlayerRoom: boolean;
  playerDialog?: boolean;
  othersDialog?: boolean;
}

export interface TurnTransitionResult {
  showTransition: boolean;
  transitionPlayerName: string;
  isTransitionForCurrentUser: boolean;
  handleTransitionComplete: () => void;
}

export function useTurnTransition({
  localPlayers,
  sessionSettings,
  currentPlayerIndex,
  isLocalPlayerRoom,
  playerDialog,
  othersDialog,
}: TurnTransitionInput): TurnTransitionResult {
  const [showTransition, setShowTransition] = useState(false);
  const [transitionPlayerName, setTransitionPlayerName] = useState('');
  const [isTransitionForCurrentUser, setIsTransitionForCurrentUser] = useState(false);

  const previousPlayerIndexRef = useRef(currentPlayerIndex);

  // Turn change detection for local players (only in pure local multiplayer mode)
  useEffect(() => {
    if (!localPlayers.length || !sessionSettings || !isLocalPlayerRoom) return;

    const currentIndex = currentPlayerIndex ?? 0;
    const previousIndex = previousPlayerIndexRef.current;

    if (currentIndex !== previousIndex && previousIndex !== undefined) {
      const newCurrentPlayer = localPlayers[currentIndex];

      if (newCurrentPlayer) {
        if (sessionSettings.showTurnTransitions && !playerDialog) {
          setTransitionPlayerName(newCurrentPlayer.name);
          setIsTransitionForCurrentUser(false);
          setShowTransition(true);
        }

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

    previousPlayerIndexRef.current = currentIndex;
  }, [currentPlayerIndex, localPlayers, sessionSettings, isLocalPlayerRoom, playerDialog]);

  // Multi-device turn transitions (only when others' dialog is disabled)
  const { messages } = useMessages();
  const latestActionMessage = latestMessageByType(messages, 'actions');
  const nextPlayer = useTurnIndicator(latestActionMessage);
  const previousMessageRef = useRef(latestActionMessage);
  const previousNextPlayerRef = useRef(nextPlayer);

  useEffect(() => {
    if (isLocalPlayerRoom || !nextPlayer || !latestActionMessage) return;

    if (othersDialog) return;

    const isNewMessage = latestActionMessage !== previousMessageRef.current;

    if (isNewMessage && nextPlayer.isSelf && !previousNextPlayerRef.current?.isSelf) {
      setTransitionPlayerName(nextPlayer.displayName);
      setIsTransitionForCurrentUser(true);
      setShowTransition(true);
    }

    previousMessageRef.current = latestActionMessage;
    previousNextPlayerRef.current = nextPlayer;
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- stabilized: nextPlayer object ref changes each render; pin individual values instead
  }, [
    latestActionMessage,
    nextPlayer?.uid,
    nextPlayer?.isSelf,
    nextPlayer?.displayName,
    isLocalPlayerRoom,
    othersDialog,
  ]);

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
  }, []);

  return {
    showTransition,
    transitionPlayerName,
    isTransitionForCurrentUser,
    handleTransitionComplete,
  };
}
