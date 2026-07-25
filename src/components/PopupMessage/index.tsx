import { useCallback, useEffect, useRef, useState } from 'react';
import ActionCard from '@/components/ActionCard';
import useSoundAndDialog, { DialogResult } from '@/hooks/useSoundAndDialog';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import { useTranslation } from 'react-i18next';
import { isActionsMessage, Message } from '@/types/Message';
import { getTurnFields } from '@/helpers/actionTurn';

const PopupMessage = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { message, setMessage, isMyMessage }: DialogResult = useSoundAndDialog();
  const nextPlayer = useTurnIndicator(message as Message);
  const { hasLocalPlayers, isLocalPlayerRoom } = useLocalPlayers();
  const isLocalRoom = hasLocalPlayers && isLocalPlayerRoom;

  // Keep track of the last valid message for exit animation
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  // Ownership captured when the message was displayed, so a later roll by
  // someone else can't flip what the open card renders.
  const [lastIsMyMessage, setLastIsMyMessage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const lastMessageTurn =
    lastMessage && isActionsMessage(lastMessage)
      ? getTurnFields(lastMessage, { finishWord: t('finish'), startWord: t('start') })
      : undefined;

  // The game-over screen requires an explicit choice; while it is showing,
  // other players' rolls must not replace or close it.
  const isGameOverShowing = isOpen && lastIsMyMessage && !!lastMessageTurn?.finished;

  // Update last message when we get a valid new message
  useEffect(() => {
    if (message && typeof message === 'object' && message.text && isActionsMessage(message)) {
      const fields = getTurnFields(message, { finishWord: t('finish'), startWord: t('start') });
      if (fields.kind !== 'restart' && !isGameOverShowing) {
        setLastMessage(message);
        setLastIsMyMessage(isMyMessage);
        setIsOpen(true);
      }
    }
  }, [message, t, isMyMessage, isGameOverShowing]);

  // handle timeout of ActionCard
  const timeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (message) {
      timeoutIdRef.current = setTimeout(() => setMessage(false), 21000);
    }
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [message, setMessage]);

  const closeActionCard = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    setIsOpen(false);
    // Delay clearing the message to allow exit animation
    setTimeout(() => setMessage(false), 500);
  }, [setMessage]);

  const stopAutoClose = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
  }, []);

  // Don't render if we never had a valid message
  if (!lastMessage) {
    return null;
  }

  return (
    <ActionCard
      text={lastMessage.text}
      turn={lastMessageTurn}
      displayName={lastMessage.displayName}
      open={isOpen}
      handleClose={closeActionCard}
      stopAutoClose={stopAutoClose}
      nextPlayer={nextPlayer}
      isMyMessage={lastIsMyMessage}
      isLocalRoom={isLocalRoom}
    />
  );
};

export default PopupMessage;
