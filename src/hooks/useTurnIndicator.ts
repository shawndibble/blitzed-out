import { useEffect, useState } from 'react';
import usePlayerList from './usePlayerList';

interface Player {
  uid: string;
  isFinished: boolean;
  [key: string]: any;
}

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

export default function useTurnIndicator(message: Message | null): Player | null {
  const [turnIndicator, setTurnIndicator] = useState<Player | null>(null);
  const players = usePlayerList();

  useEffect(() => {
    if (!message) return;

    if (players.length <= 1) {
      setTurnIndicator(null);
      return;
    }

    const stillPlaying = players.filter((player) => !player.isFinished);

    const nextPlayer = getNextPlayer(stillPlaying, message.uid);
    setTurnIndicator(nextPlayer);
  }, [message, players]);

  return turnIndicator;
}
