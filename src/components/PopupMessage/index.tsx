import { useCallback, useEffect, useRef } from 'react';
import TransitionModal from '@/components/TransitionModal';
import useSoundAndDialog, { DialogResult } from '@/hooks/useSoundAndDialog';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import { useTranslation } from 'react-i18next';
import { Message } from '@/types/Message';

const PopupMessage = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { message, setMessage, isMyMessage }: DialogResult = useSoundAndDialog();
  const nextPlayer = useTurnIndicator(message as Message);

  // handle timeout of TransitionModal
  const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (message) {
      timeoutId.current = setTimeout(() => setMessage(false), 21000);
    }
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [message, setMessage]);

  const closeTransitionModal = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    setMessage(false);
  }, [setMessage]);

  const stopAutoClose = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
  }, []);
  // end handle timeout of TransitionModal.

  if (
    !message ||
    typeof message !== 'object' ||
    !message.text ||
    message.text.includes(t('start'))
  ) {
    return null;
  }

  return (
    <TransitionModal
      text={message?.text}
      displayName={message?.displayName}
      open
      handleClose={closeTransitionModal}
      stopAutoClose={stopAutoClose}
      nextPlayer={nextPlayer}
      isMyMessage={isMyMessage}
    />
  );
};

export default PopupMessage;
