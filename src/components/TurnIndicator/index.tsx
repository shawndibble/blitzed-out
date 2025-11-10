import ToastAlert from '@/components/ToastAlert';
import latestMessageByType, { latestMessage } from '@/helpers/messages';
import { useSettings } from '@/stores/settingsStore';
import useMessages from '@/context/hooks/useMessages';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

export default function TurnIndicator(): JSX.Element | null {
  const { messages } = useMessages();
  const message = latestMessageByType(messages, 'actions');
  const lastMessage = latestMessage(messages);
  const player = useTurnIndicator(message);
  const { playerDialog, othersDialog } = useSettings()[0];

  const shouldShowToast = Boolean(player && lastMessage === message);
  const [showToast, setShowToast] = useState<boolean>(shouldShowToast);

  useEffect(() => {
    if (shouldShowToast && !showToast) {
      queueMicrotask(() => {
        setShowToast(true);
      });
    }
  }, [shouldShowToast, showToast]);

  if (!message || !player) return null;

  const isYourTurn = player?.isSelf;
  const showOnMyTurn = !playerDialog && isYourTurn;
  const showOnOthersTurn = !othersDialog && !isYourTurn;

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
