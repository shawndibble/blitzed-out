import { useCallback, useEffect, useRef, useState } from 'react';
import ActionCard from '@/components/ActionCard';
import useSoundAndDialog, { DialogResult } from '@/hooks/useSoundAndDialog';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types/Message';

const PopupMessage = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { message, setMessage, isMyMessage }: DialogResult = useSoundAndDialog();
  const nextPlayer = useTurnIndicator(message as Message);

  // Keep track of the last valid message for exit animation
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Update last message when we get a valid new message
  useEffect(() => {
    if (
      message &&
      typeof message === 'object' &&
      message.text &&
      !message.text.includes(t('start'))
    ) {
      setLastMessage(message);
      setIsOpen(true);
    }
  }, [message, t]);

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
      displayName={lastMessage.displayName}
      open={isOpen}
      handleClose={closeActionCard}
      stopAutoClose={stopAutoClose}
      nextPlayer={nextPlayer}
      isMyMessage={isMyMessage}
    />
  );
};

export default PopupMessage;
