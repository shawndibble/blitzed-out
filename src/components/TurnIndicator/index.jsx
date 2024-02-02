import ToastAlert from 'components/ToastAlert';
import latestMessageByType, { latestMessage } from 'helpers/messages';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'context/hooks/useMessages';
import useTurnIndicator from 'hooks/useTurnIndicator';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

export default function TurnIndicator({ room }) {
  const { messages } = useMessages(room);
  const [showToast, setShowToast] = useState(false);
  const message = latestMessageByType(messages, 'actions');
  const lastMessage = latestMessage(messages);
  const player = useTurnIndicator(room, message);
  const { playerDialog, othersDialog } = useLocalStorage('gameSettings')[0];

  useEffect(() => {
    if (!player || lastMessage !== message) return;
    setShowToast(true);
  }, [player]);

  if (!message || !player) return null;

  const isYourTurn = player?.isSelf;
  const showOnMyTurn = !othersDialog && isYourTurn;
  const showOnOthersTurn = !playerDialog && !isYourTurn;

  if (showOnMyTurn || showOnOthersTurn) {
    return (
      <ToastAlert
        open={showToast}
        close={() => setShowToast(false)}
        type={isYourTurn ? 'error' : 'info'}
        vertical="top"
        horizontal="center"
        disableAutoHide
      >
        {isYourTurn
          ? (<Trans i18nKey="yourTurn" />)
          : (<Trans i18nKey="playersTurn" values={{ player: player.displayName }} />)}
      </ToastAlert>
    );
  }
}
