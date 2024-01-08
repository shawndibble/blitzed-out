import { useEffect, useState } from 'react';
import usePlayerList from './usePlayerList';

function getNextPlayer(players, currentUid) {
  const index = players.findIndex((player) => player.uid === currentUid);
  const nextIndex = index + 1 >= players.length ? 0 : index + 1;
  return players[nextIndex];
}

export default function useTurnIndicator(room, message) {
  const [turnIndicator, setTurnIndicator] = useState(null);
  const players = usePlayerList(room);

  useEffect(() => {
    if (!message) return;

    if (players.length <= 1) {
      setTurnIndicator(null);
      return;
    }

    const player = getNextPlayer(players, message.uid);
    setTurnIndicator(player);
  }, [message]);

  return turnIndicator;
}
