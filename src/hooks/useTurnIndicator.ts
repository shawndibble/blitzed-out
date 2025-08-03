import { useEffect, useState } from 'react';
import useHybridPlayerList, { type HybridPlayer } from './useHybridPlayerList';
import { Player } from '@/types/player';

interface Message {
  uid: string;
  [key: string]: any;
}

function convertHybridPlayerToPlayer(hybridPlayer: HybridPlayer): Player {
  return {
    uid: hybridPlayer.uid,
    displayName: hybridPlayer.displayName,
    isSelf: hybridPlayer.isSelf,
    isFinished: hybridPlayer.isFinished,
  };
}

export default function useTurnIndicator(message?: Message): Player | null {
  const [turnIndicator, setTurnIndicator] = useState<Player | null>(null);
  const hybridPlayers = useHybridPlayerList();

  useEffect(() => {
    if (!message) return;

    // Single player or not enough players for turns
    if (hybridPlayers.length <= 1) {
      setTurnIndicator(null);
      return;
    }

    // Filter out finished players
    const stillPlaying = hybridPlayers.filter((player) => !player.isFinished);

    if (stillPlaying.length <= 1) {
      setTurnIndicator(null);
      return;
    }

    // For local players, we need to find by displayName since message.uid might not match
    // For remote players, we find by uid
    let currentPlayerIndex = -1;

    // First try to find by uid (works for remote players)
    currentPlayerIndex = stillPlaying.findIndex((player) => player.uid === message.uid);

    // If not found and we have local players, try finding by displayName
    if (currentPlayerIndex === -1) {
      currentPlayerIndex = stillPlaying.findIndex(
        (player) => player.displayName === message.displayName
      );
    }

    // If we still can't find the player, use the first player as fallback
    if (currentPlayerIndex === -1) {
      currentPlayerIndex = 0;
    }

    // Get the next player in turn order
    const nextIndex = (currentPlayerIndex + 1) % stillPlaying.length;
    const nextHybridPlayer = stillPlaying[nextIndex];

    // Convert to Player format for the indicator
    const nextPlayer = convertHybridPlayerToPlayer(nextHybridPlayer);
    setTurnIndicator(nextPlayer);
  }, [message, hybridPlayers]);

  return turnIndicator;
}
