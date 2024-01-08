import ToastAlert from 'components/ToastAlert';
import latestMessageByType from 'helpers/messages';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import useTurnIndicator from 'hooks/useTurnIndicator';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

export default function TurnIndicator({ room }) {
  const { messages } = useMessages(room);
  const [showToast, setShowToast] = useState(false);
  const message = latestMessageByType(messages, 'actions');
  const player = useTurnIndicator(room, message);
  const { playerDialog, othersDialog } = useLocalStorage('gameSettings')[0];

  useEffect(() => {
    if (!player) return;
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  }, [player]);

  if (!message || !player) return null;

  if (!playerDialog || !othersDialog) {
    return (
      <ToastAlert open={showToast} close={() => setShowToast(false)} type="info" vertical="top" horizontal="center">
        {player === 'YOU!!!'
          ? (<Trans i18nKey="yourTurn" />)
          : (<Trans i18nKey="playersTurn" values={{ player }} />)}
      </ToastAlert>
    );
  }
}
