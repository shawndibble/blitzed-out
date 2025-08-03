import { useEffect, useState } from 'react';
import usePlayerList from './usePlayerList';
import { useLocalPlayers } from './useLocalPlayers';
import { Player } from '@/types/player';

interface Message {
  uid: string;
  [key: string]: any;
}

function getNextPlayer(players: Player[], currentUid: string): Player | null {
  const index = players.findIndex((player) => player.uid === currentUid);
  if (index === -1 || players.length === 0) return null;

  const nextIndex = index + 1 >= players.length ? 0 : index + 1;
  return players[nextIndex];
}

export default function useTurnIndicator(message?: Message): Player | null {
  const [turnIndicator, setTurnIndicator] = useState<Player | null>(null);
  const remotePlayers = usePlayerList();
  const { localPlayers, hasLocalPlayers, isLocalPlayerRoom, currentPlayer } = useLocalPlayers();

  useEffect(() => {
    if (!message) return;

    // Determine if we should use local players or remote players
    const isInLocalMultiplayerMode = hasLocalPlayers && isLocalPlayerRoom;

    if (isInLocalMultiplayerMode) {
      // In local multiplayer mode, use local players and show the next player in turn order
      if (localPlayers.length <= 1) {
        setTurnIndicator(null);
        return;
      }

      // In local mode, find who rolled by looking at the message displayName
      // The message.displayName contains the name of the player who actually rolled
      const whoRolled = localPlayers.find((lp) => lp.name === message.displayName);
      let nextLocalPlayer;

      if (!whoRolled) {
        // Fallback to current player if we can't find by name
        const currentActivePlayer = localPlayers.find((lp) => lp.isActive);
        if (!currentActivePlayer) {
          setTurnIndicator(null);
          return;
        }
        const sortedPlayers = [...localPlayers].sort((a, b) => a.order - b.order);
        const currentIndex = sortedPlayers.findIndex((lp) => lp.id === currentActivePlayer.id);
        const nextIndex = (currentIndex + 1) % sortedPlayers.length;
        nextLocalPlayer = sortedPlayers[nextIndex];
      } else {
        // Find the next player after the one who actually rolled
        const sortedPlayers = [...localPlayers].sort((a, b) => a.order - b.order);
        const rollerIndex = sortedPlayers.findIndex((lp) => lp.id === whoRolled.id);
        const nextIndex = (rollerIndex + 1) % sortedPlayers.length;
        nextLocalPlayer = sortedPlayers[nextIndex];
      }

      // Convert to Player format for the indicator
      const nextPlayer = {
        uid: `local-${nextLocalPlayer.id}`,
        displayName: nextLocalPlayer.name,
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active' as const,
        lastActivity: new Date(),
      };

      setTurnIndicator(nextPlayer);
    } else {
      // In single player or online mode, use remote players
      if (remotePlayers.length <= 1) {
        setTurnIndicator(null);
        return;
      }

      const stillPlaying = remotePlayers.filter((player) => !player.isFinished);
      const nextPlayer = getNextPlayer(stillPlaying, message.uid);
      setTurnIndicator(nextPlayer);
    }
  }, [message, remotePlayers, localPlayers, hasLocalPlayers, isLocalPlayerRoom, currentPlayer]);

  return turnIndicator;
}
