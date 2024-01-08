import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import usePlayerList from './usePlayerList';

function getNextPlayer(players, current) {
  const index = players.findIndex((player) => player.displayName === current);
  const nextIndex = index + 1 >= players.length ? 0 : index + 1;
  return players[nextIndex];
}

export default function useTurnIndicator(room, message) {
  const { t } = useTranslation();
  const [turnIndicator, setTurnIndicator] = useState(null);
  const players = usePlayerList(room);

  useEffect(() => {
    if (!message) return;

    if (players.length <= 1) {
      setTurnIndicator(null);
      return;
    }

    const player = getNextPlayer(players, message?.displayName);
    setTurnIndicator(player.isSelf ? t('you') : player.displayName);
  }, [message]);

  return turnIndicator;
}
