import { useEffect, useState, useMemo } from 'react';
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

  // Create a stable representation of players to prevent infinite loops
  const playersHash = useMemo(() => {
    return hybridPlayers
      .map((p) => `${p.uid}-${p.displayName}-${p.isFinished}-${p.isSelf}`)
      .join('|');
  }, [hybridPlayers]);

  // Create a stable representation of the message to prevent infinite loops
  const messageHash = useMemo(() => {
    return message ? `${message.uid}-${message.displayName || ''}` : null;
  }, [message]);

  useEffect(() => {
    if (!message) {
      setTurnIndicator(null);
      return;
    }

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

    // Sort players by displayName for consistent turn order across all devices
    // This ensures all devices calculate the same turn sequence
    // Use 'en-US' locale and numeric sorting for consistent international character handling
    const stableTurnOrder = [...stillPlaying].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, 'en-US', {
        numeric: true,
        sensitivity: 'base',
      })
    );

    // For local players, we need to find by displayName since message.uid might not match
    // For remote players, we find by uid
    let currentPlayerIndex = -1;

    // First try to find by uid (works for remote players)
    currentPlayerIndex = stableTurnOrder.findIndex((player) => player.uid === message.uid);

    // If not found and we have local players, try finding by displayName
    if (currentPlayerIndex === -1) {
      currentPlayerIndex = stableTurnOrder.findIndex(
        (player) => player.displayName === message.displayName
      );
    }

    // If we still can't find the player, use the first player as fallback
    if (currentPlayerIndex === -1) {
      currentPlayerIndex = 0;
    }

    // Get the next player in stable turn order
    const nextIndex = (currentPlayerIndex + 1) % stableTurnOrder.length;
    const nextHybridPlayer = stableTurnOrder[nextIndex];

    // Convert to Player format for the indicator
    const nextPlayer = convertHybridPlayerToPlayer(nextHybridPlayer);
    setTurnIndicator(nextPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageHash, playersHash]);

  return turnIndicator;
}
