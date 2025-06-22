import ToastAlert from '@/components/ToastAlert';
import latestMessageByType, { latestMessage } from '@/helpers/messages';
import { useDialogSettings } from '@/stores/gameSettings';
import useMessages from '@/context/hooks/useMessages';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

export default function TurnIndicator(): JSX.Element | null {
  const { messages } = useMessages();
  const [showToast, setShowToast] = useState<boolean>(false);
  const message = latestMessageByType(messages, 'actions');
  const lastMessage = latestMessage(messages);
  const player = useTurnIndicator(message);
  const { playerDialog, othersDialog } = useDialogSettings();

  useEffect(() => {
    if (!player || lastMessage !== message) return;
    setShowToast(true);
  }, [player, lastMessage, message]);

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
        {isYourTurn ? (
          <Trans i18nKey="yourTurn" />
        ) : (
          <Trans i18nKey="playersTurn" values={{ player: player.displayName }} />
        )}
      </ToastAlert>
    );
  }

  return null;
}
